import {
  createHash,
  createHmac,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Prisma, PrismaClient, User } from "@prisma/client";
import { ReservationError } from "../reservations/reservation.service";

export interface AuthOptions {
  accessSecret: string;
  refreshSecret: string;
  challengeSecret: string;
  deliverChallenge: (input: {
    email: string;
    code: string;
    purpose: string;
  }) => Promise<void>;
}
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const safeUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  avatarUrl: user.avatarUrl,
  isVerified: user.isVerified,
});
const issuer = "playza";
const audience = "playza-mobile";
const available = (user: User) => !user.isBlocked && !user.deletedAt;

export class AuthService {
  private dummyPassword = bcrypt.hash("PLAYZA dummy login comparison", 12);
  constructor(
    private db: PrismaClient,
    private options: AuthOptions,
  ) {}

  private challengeHash(userId: string, purpose: string, code: string) {
    return createHmac("sha256", this.options.challengeSecret)
      .update(`${userId}:${purpose}:${code}`)
      .digest("hex");
  }
  private access(user: User, sessionId: string) {
    return jwt.sign(
      { type: "access", sessionId, version: user.tokenVersion },
      this.options.accessSecret,
      {
        subject: user.id,
        issuer,
        audience,
        expiresIn: "15m",
        algorithm: "HS256",
      },
    );
  }
  private refresh(userId: string, sessionId: string, expiresAt: Date) {
    return jwt.sign(
      { type: "refresh", sessionId },
      this.options.refreshSecret,
      {
        subject: userId,
        issuer,
        audience,
        jwtid: randomUUID(),
        algorithm: "HS256",
        expiresIn: Math.max(
          1,
          Math.floor((expiresAt.getTime() - Date.now()) / 1000),
        ),
      },
    );
  }
  private claims(token: string, secret: string, type: string) {
    try {
      const payload = jwt.verify(token, secret, {
        issuer,
        audience,
        algorithms: ["HS256"],
      });
      if (
        typeof payload === "string" ||
        payload.type !== type ||
        typeof payload.sub !== "string" ||
        typeof payload.sessionId !== "string"
      )
        throw new Error("Invalid claims");
      return payload as JwtPayload & {
        sub: string;
        sessionId: string;
        version?: number;
      };
    } catch {
      throw new ReservationError(401, "Invalid or expired token");
    }
  }

  async register(input: {
    email: string;
    name: string;
    phone?: string;
    password: string;
  }) {
    const passwordHash = await bcrypt.hash(input.password, 12);
    try {
      const user = await this.db.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: input.email,
            name: input.name,
            phone: input.phone,
            passwordHash,
          },
        });
        await tx.userRole.create({
          data: { userId: user.id, role: "CUSTOMER" },
        });
        return user;
      });
      await this.sendChallenge(user.email, "EMAIL_VERIFICATION");
      return safeUser(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ReservationError(409, "Account already exists");
      }
      throw error;
    }
  }

  async sendChallenge(
    email: string,
    purpose: "EMAIL_VERIFICATION" | "PASSWORD_RESET",
  ) {
    const user = await this.db.user.findUnique({ where: { email } });
    // Public responses are identical for missing, disabled and already verified accounts.
    if (
      !user ||
      !available(user) ||
      (purpose === "EMAIL_VERIFICATION" && user.isVerified)
    )
      return;
    const code = randomInt(100000, 1000000).toString();
    await this.db.$transaction(async (tx) => {
      // Lock the account so concurrent resends cannot leave multiple active challenges.
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${user.id}::uuid FOR UPDATE`;
      await tx.authChallenge.updateMany({
        where: { userId: user.id, purpose, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      await tx.authChallenge.create({
        data: {
          userId: user.id,
          purpose,
          secretHash: this.challengeHash(user.id, purpose, code),
          expiresAt: new Date(Date.now() + 10 * 60000),
        },
      });
    });
    try {
      await this.options.deliverChallenge({ email, code, purpose });
    } catch {
      throw new ReservationError(
        503,
        "Email delivery is unavailable; retry requesting a code",
      );
    }
  }

  async completeChallenge(
    email: string,
    code: string,
    purpose: "EMAIL_VERIFICATION" | "PASSWORD_RESET",
    password?: string,
  ) {
    const passwordHash = password ? await bcrypt.hash(password, 12) : undefined;
    if (purpose === "PASSWORD_RESET" && !passwordHash)
      throw new ReservationError(400, "New password required");
    const result = await this.db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { email } });
      if (!user || !available(user)) return false;
      const challenge = await tx.authChallenge.findFirst({
        where: {
          userId: user.id,
          purpose,
          consumedAt: null,
          expiresAt: { gt: new Date() },
          attempts: { lt: 5 },
        },
        orderBy: { createdAt: "desc" },
      });
      if (!challenge) return false;
      const claimed = await tx.authChallenge.updateMany({
        where: {
          id: challenge.id,
          consumedAt: null,
          attempts: { lt: 5 },
          expiresAt: { gt: new Date() },
        },
        data: { attempts: { increment: 1 } },
      });
      const expectedHash = this.challengeHash(user.id, purpose, code);
      if (
        claimed.count !== 1 ||
        challenge.secretHash.length !== expectedHash.length ||
        !timingSafeEqual(
          Buffer.from(challenge.secretHash),
          Buffer.from(expectedHash),
        )
      )
        return false;
      const consumed = await tx.authChallenge.updateMany({
        where: { id: challenge.id, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      if (consumed.count !== 1) return false;
      if (purpose === "EMAIL_VERIFICATION")
        await tx.user.update({
          where: { id: user.id },
          data: { isVerified: true },
        });
      else {
        await tx.user.update({
          where: { id: user.id },
          data: { passwordHash, tokenVersion: { increment: 1 } },
        });
        await tx.userSession.updateMany({
          where: { userId: user.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      return true;
    });
    // Throw outside the transaction so failed-attempt increments are committed.
    if (!result)
      throw new ReservationError(400, "Invalid, expired or already used code");
  }

  async login(email: string, password: string, device?: string) {
    const user = await this.db.user.findUnique({ where: { email } });
    const validPassword = await bcrypt.compare(
      password,
      user?.passwordHash || (await this.dummyPassword),
    );
    if (!user || !available(user) || !validPassword)
      throw new ReservationError(401, "Invalid email or password");
    if (!user.isVerified)
      throw new ReservationError(403, "Verify your email before signing in");
    return this.db.$transaction(async (tx) => {
      const expiresAt = new Date(Date.now() + 7 * 86400000);
      const session = await tx.userSession.create({
        data: { userId: user.id, device, expiresAt },
      });
      const refreshToken = this.refresh(user.id, session.id, expiresAt);
      await tx.refreshToken.create({
        data: {
          sessionId: session.id,
          tokenHash: digest(refreshToken),
          familyId: randomUUID(),
          expiresAt,
        },
      });
      return {
        user: safeUser(user),
        accessToken: this.access(user, session.id),
        refreshToken,
      };
    });
  }

  async rotate(token: string) {
    const claims = this.claims(token, this.options.refreshSecret, "refresh");
    const result = await this.db.$transaction(async (tx) => {
      const record = await tx.refreshToken.findUnique({
        where: { tokenHash: digest(token) },
        include: { session: { include: { user: true } } },
      });
      if (
        !record ||
        record.sessionId !== claims.sessionId ||
        record.session.userId !== claims.sub
      )
        return null;
      const { session } = record;
      if (
        session.revokedAt ||
        session.expiresAt <= new Date() ||
        !available(session.user)
      )
        return null;
      const claimed = await tx.refreshToken.updateMany({
        where: {
          id: record.id,
          consumedAt: null,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { consumedAt: new Date() },
      });
      if (claimed.count !== 1) {
        await tx.userSession.update({
          where: { id: session.id },
          data: { revokedAt: new Date() },
        });
        await tx.refreshToken.updateMany({
          where: { familyId: record.familyId },
          data: { revokedAt: new Date() },
        });
        return null;
      }
      const refreshToken = this.refresh(
        session.userId,
        session.id,
        session.expiresAt,
      );
      await tx.refreshToken.create({
        data: {
          sessionId: session.id,
          familyId: record.familyId,
          tokenHash: digest(refreshToken),
          expiresAt: session.expiresAt,
        },
      });
      return {
        accessToken: this.access(session.user, session.id),
        refreshToken,
      };
    });
    if (!result)
      throw new ReservationError(
        401,
        "Refresh token was revoked or reused; sign in again",
      );
    return result;
  }

  async authenticate(token: string) {
    const claims = this.claims(token, this.options.accessSecret, "access");
    const session = await this.db.userSession.findUnique({
      where: { id: claims.sessionId },
      include: { user: true },
    });
    if (
      !session ||
      session.userId !== claims.sub ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      !available(session.user) ||
      !session.user.isVerified ||
      session.user.tokenVersion !== claims.version
    ) {
      throw new ReservationError(401, "Session unavailable");
    }
    return { user: safeUser(session.user), sessionId: session.id };
  }
  async logout(sessionId: string) {
    await this.db.userSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
