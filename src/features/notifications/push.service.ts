import { PrismaClient } from "@prisma/client";
export type PushResult = {
  status: "ok" | "error";
  id?: string;
  details?: { error?: string };
};
export interface PushProvider {
  send(input: {
    to: string;
    title: string;
    body: string;
    data: Record<string, string>;
  }): Promise<PushResult>;
  receipts(ids: string[]): Promise<Record<string, PushResult>>;
}
export function expoPushProvider(accessToken?: string): PushProvider {
  async function post(path: string, body: unknown) {
    const response = await fetch(`https://exp.host/--/api/v2/push/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Expo push provider unavailable");
    const data = (await response.json()) as {
      data: unknown;
      errors?: unknown[];
    };
    if (data.errors?.length) throw new Error("Expo push request rejected");
    return data.data;
  }
  return {
    async send(input) {
      return (await post("send", {
        ...input,
        sound: "default",
        channelId: "playza",
      })) as PushResult;
    },
    async receipts(ids) {
      return (await post("getReceipts", { ids })) as Record<string, PushResult>;
    },
  };
}
export class PushService {
  constructor(
    private db: PrismaClient,
    private provider: PushProvider,
  ) {}
  async prepare(limit = 100) {
    let count = 0;
    for (; count < limit; count++) {
      const prepared = await this.db.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<
          { id: string; receiverId: string }[]
        >`SELECT id,"receiverId" FROM "Notification" WHERE "pushPreparedAt" IS NULL ORDER BY "createdAt" FOR UPDATE SKIP LOCKED LIMIT 1`;
        const item = rows[0];
        if (!item) return false;
        const devices = await tx.deviceToken.findMany({
          where: { userId: item.receiverId, isActive: true },
        });
        if (devices.length)
          await tx.pushDelivery.createMany({
            data: devices.map((device) => ({
              notificationId: item.id,
              deviceTokenId: device.id,
            })),
            skipDuplicates: true,
          });
        await tx.notification.update({
          where: { id: item.id },
          data: { pushPreparedAt: new Date() },
        });
        return true;
      });
      if (!prepared) break;
    }
    return count;
  }
  async sendOne() {
    await this.db.pushDelivery.updateMany({
      where: {
        status: "SENDING",
        attempts: { gte: 8 },
        availableAt: { lte: new Date() },
      },
      data: { status: "FAILED", errorCode: "DELIVERY_LEASE_EXHAUSTED" },
    });
    const delivery = await this.db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        { id: string }[]
      >`SELECT id FROM "PushDelivery" WHERE status IN ('PENDING','SENDING') AND "availableAt"<=now() AND attempts<8 ORDER BY "availableAt" FOR UPDATE SKIP LOCKED LIMIT 1`;
      if (!rows[0]) return null;
      return tx.pushDelivery.update({
        where: { id: rows[0].id },
        data: {
          status: "SENDING",
          attempts: { increment: 1 },
          availableAt: new Date(Date.now() + 60000),
        },
        include: { notification: true, deviceToken: true },
      });
    });
    if (!delivery) return false;
    if (
      !delivery.deviceToken.isActive ||
      delivery.deviceToken.userId !== delivery.notification.receiverId
    ) {
      await this.db.pushDelivery.update({
        where: { id: delivery.id },
        data: { status: "SKIPPED" },
      });
      return true;
    }
    try {
      const result = await this.provider.send({
        to: delivery.deviceToken.token,
        title: delivery.notification.title,
        body: delivery.notification.body,
        data: { notificationId: delivery.notificationId },
      });
      if (result.status === "ok" && result.id)
        await this.db.pushDelivery.update({
          where: { id: delivery.id },
          data: {
            status: "SENT",
            ticketId: result.id,
            availableAt: new Date(Date.now() + 15 * 60000),
          },
        });
      else
        await this.fail(
          delivery.id,
          delivery.deviceTokenId,
          result.details?.error || "PROVIDER_REJECTED",
        );
    } catch {
      await this.db.pushDelivery.update({
        where: { id: delivery.id },
        data: {
          status: delivery.attempts >= 8 ? "FAILED" : "PENDING",
          errorCode: "PROVIDER_UNAVAILABLE",
          availableAt: new Date(
            Date.now() + Math.min(3600000, 30000 * 2 ** delivery.attempts),
          ),
        },
      });
    }
    return true;
  }
  private async fail(id: string, deviceTokenId: string, errorCode: string) {
    await this.db.$transaction(async (tx) => {
      await tx.pushDelivery.update({
        where: { id },
        data: { status: "FAILED", errorCode },
      });
      if (errorCode === "DeviceNotRegistered")
        await tx.deviceToken.update({
          where: { id: deviceTokenId },
          data: { isActive: false },
        });
    });
  }
  async checkReceipts() {
    const rows = await this.db.pushDelivery.findMany({
      where: {
        status: "SENT",
        availableAt: { lte: new Date() },
        ticketId: { not: null },
      },
      take: 100,
      orderBy: { availableAt: "asc" },
    });
    if (!rows.length) return;
    const results = await this.provider.receipts(
      rows.map((row) => row.ticketId!),
    );
    for (const row of rows) {
      const receipt = results[row.ticketId!];
      if (receipt?.status === "ok")
        await this.db.pushDelivery.update({
          where: { id: row.id },
          data: { status: "DELIVERED" },
        });
      else if (receipt)
        await this.fail(
          row.id,
          row.deviceTokenId,
          receipt.details?.error || "PROVIDER_REJECTED",
        );
      else
        await this.db.pushDelivery.update({
          where: { id: row.id },
          data: {
            status:
              Date.now() - row.createdAt.getTime() > 86400000
                ? "FAILED"
                : "SENT",
            availableAt: new Date(Date.now() + 15 * 60000),
            errorCode: "RECEIPT_PENDING",
          },
        });
    }
  }
  async tick() {
    await this.prepare();
    for (let i = 0; i < 50 && (await this.sendOne()); i++);
    await this.checkReceipts();
  }
}
