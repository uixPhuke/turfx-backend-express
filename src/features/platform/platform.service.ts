import { Prisma, PrismaClient } from "@prisma/client";
import { ReservationError } from "../reservations/reservation.service";

export class PlatformService {
  constructor(private db: PrismaClient) {}
  async admin(actor: string) {
    if (
      !(await this.db.userRole.findFirst({
        where: { userId: actor, role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      }))
    ) {
      throw new ReservationError(403, "Administrator access required");
    }
  }
  async manage(actor: string, venueId: string) {
    const member = await this.db.venueMember.findFirst({
      where: {
        venueId,
        userId: actor,
        isActive: true,
        role: { in: ["OWNER", "MANAGER"] },
        venue: { deletedAt: null },
      },
    });
    if (!member)
      throw new ReservationError(403, "Venue management access required");
  }
  async apply(
    actor: string,
    input: {
      businessName: string;
      taxIdentifier?: string;
      documents: Prisma.InputJsonValue;
    },
  ) {
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id=${actor}::uuid FOR UPDATE`;
      const pending = await tx.ownerApplication.findFirst({
        where: { applicantId: actor, status: "PENDING" },
      });
      if (pending)
        throw new ReservationError(409, "An application is already pending");
      return tx.ownerApplication.create({
        data: { ...input, applicantId: actor },
      });
    });
  }
  async reviewApplication(
    actor: string,
    applicationId: string,
    approved: boolean,
    notes: string,
  ) {
    await this.admin(actor);
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "OwnerApplication" WHERE id=${applicationId}::uuid FOR UPDATE`;
      const row = await tx.ownerApplication.findUnique({
        where: { id: applicationId },
      });
      if (!row || row.status !== "PENDING")
        throw new ReservationError(409, "Application is not pending");
      const application = await tx.ownerApplication.update({
        where: { id: applicationId },
        data: {
          status: approved ? "APPROVED" : "REJECTED",
          reviewerId: actor,
          reviewedAt: new Date(),
          reviewNotes: notes,
        },
      });
      if (approved)
        await tx.userRole.upsert({
          where: { userId_role: { userId: row.applicantId, role: "OWNER" } },
          update: {},
          create: { userId: row.applicantId, role: "OWNER" },
        });
      await tx.auditLog.create({
        data: {
          actorId: actor,
          action: "owner.review",
          entityType: "OwnerApplication",
          entityId: applicationId,
          metadata: { approved, notes },
        },
      });
      return application;
    });
  }
  async createVenue(
    actor: string,
    input: {
      name: string;
      description: string;
      address: Prisma.InputJsonValue;
      timezone: string;
      latitude: number;
      longitude: number;
    },
  ) {
    if (
      !(await this.db.userRole.findUnique({
        where: { userId_role: { userId: actor, role: "OWNER" } },
      }))
    ) {
      throw new ReservationError(403, "Approved owner account required");
    }
    try {
      new Intl.DateTimeFormat("en", { timeZone: input.timezone }).format();
    } catch {
      throw new ReservationError(400, "Invalid venue timezone");
    }
    return this.db.$transaction(async (tx) => {
      const venue = await tx.venue.create({
        data: { ...input, ownerId: actor },
      });
      await tx.venueMember.create({
        data: { venueId: venue.id, userId: actor, role: "OWNER" },
      });
      return venue;
    });
  }
  async createFacility(
    actor: string,
    input: {
      venueId: string;
      name: string;
      description?: string;
      amenities: Prisma.InputJsonValue;
    },
  ) {
    await this.manage(actor, input.venueId);
    return this.db.facility.create({ data: input });
  }
  async createResource(
    actor: string,
    input: {
      facilityId: string;
      name: string;
      mode: "EXCLUSIVE" | "CAPACITY_BASED";
      capacity: number;
      slotMinutes: number;
      currency: string;
      sportIds: string[];
    },
  ) {
    const facility = await this.db.facility.findUnique({
      where: { id: input.facilityId },
    });
    if (!facility) throw new ReservationError(404, "Facility not found");
    await this.manage(actor, facility.venueId);
    const { sportIds, ...fields } = input;
    if (
      (await this.db.sport.count({
        where: { id: { in: sportIds }, isActive: true },
      })) !== new Set(sportIds).size
    ) {
      throw new ReservationError(400, "Invalid sports catalogue selection");
    }
    return this.db.$transaction(async (tx) => {
      const resource = await tx.resource.create({ data: fields });
      await tx.resourceSport.createMany({
        data: [...new Set(sportIds)].map((sportId) => ({
          resourceId: resource.id,
          sportId,
        })),
      });
      return resource;
    });
  }
  async resourceAccess(actor: string, resourceId: string) {
    const row = await this.db.resource.findUnique({
      where: { id: resourceId },
      include: { facility: true },
    });
    if (!row) throw new ReservationError(404, "Resource not found");
    await this.manage(actor, row.facility.venueId);
    return row;
  }
  async hours(
    actor: string,
    resourceId: string,
    hours: { weekday: number; opensMinute: number; closesMinute: number }[],
  ) {
    await this.resourceAccess(actor, resourceId);
    for (const hour of hours)
      if (hour.opensMinute >= hour.closesMinute)
        throw new ReservationError(400, "Invalid operating interval");
    return this.db.$transaction(async (tx) => {
      await tx.operatingHour.deleteMany({ where: { resourceId } });
      return tx.operatingHour.createMany({
        data: hours.map((hour) => ({ ...hour, resourceId })),
      });
    });
  }
  async price(
    actor: string,
    resourceId: string,
    amountMinor: number,
    priority: number,
    configuration: Prisma.InputJsonValue,
  ) {
    await this.resourceAccess(actor, resourceId);
    return this.db.pricingRule.create({
      data: { resourceId, amountMinor, priority, configuration },
    });
  }
  async session(
    actor: string,
    input: {
      resourceId: string;
      startsAt: Date;
      endsAt: Date;
      capacity: number;
    },
  ) {
    const resource = await this.resourceAccess(actor, input.resourceId);
    if (
      resource.mode !== "CAPACITY_BASED" ||
      input.capacity > resource.capacity ||
      input.endsAt <= input.startsAt
    ) {
      throw new ReservationError(400, "Invalid shared session");
    }
    return this.db.capacitySession.create({ data: input });
  }
  async reviewVenue(actor: string, venueId: string, approved: boolean) {
    await this.admin(actor);
    return this.db.$transaction(async (tx) => {
      const venue = await tx.venue.update({
        where: { id: venueId },
        data: { status: approved ? "APPROVED" : "REJECTED" },
      });
      await tx.auditLog.create({
        data: {
          actorId: actor,
          action: "venue.review",
          entityType: "Venue",
          entityId: venueId,
          metadata: { approved },
        },
      });
      return venue;
    });
  }
}
