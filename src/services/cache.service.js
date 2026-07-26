// src/services/cache.service.js

const redisService = require("./redis.service");

// ==========================================
// Cache TTL (seconds)
// ==========================================

const TTL = {

  SHORT: 60,          // 1 min

  MEDIUM: 300,        // 5 mins

  LONG: 1800,         // 30 mins

  VERY_LONG: 86400,   // 24 hrs

};

// ==========================================
// Cache Keys
// ==========================================

const KEYS = {

  turf: (id) => `turf:${id}`,

  turfList: (query) =>
    `turfs:${JSON.stringify(query)}`,

  slot: (id) => `slot:${id}`,

  slotAvailability: (turfId, date) =>
    `slot:${turfId}:${date}`,

  booking: (id) =>
    `booking:${id}`,

  user: (id) =>
    `user:${id}`,

  owner: (id) =>
    `owner:${id}`,

  wallet: (id) =>
    `wallet:${id}`,

  coupon: (code) =>
    `coupon:${code}`,

  dashboard: () =>
    "dashboard",

  analytics: () =>
    "analytics",

  notifications: (userId) =>
    `notifications:${userId}`,

};

// ==========================================
// Cache Service
// ==========================================

class CacheService {

  // =============================
  // Generic
  // =============================

  async get(key) {
    return redisService.getJSON(key);
  }

  async set(key, value, ttl = TTL.MEDIUM) {
    return redisService.setJSON(
      key,
      value,
      ttl
    );
  }

  async remove(key) {
    return redisService.del(key);
  }

  // =============================
  // Turf
  // =============================

  async cacheTurf(id, turf) {

    return this.set(
      KEYS.turf(id),
      turf,
      TTL.LONG
    );

  }

  async getCachedTurf(id) {

    return this.get(
      KEYS.turf(id)
    );

  }

  async invalidateTurf(id) {

    return this.remove(
      KEYS.turf(id)
    );

  }

  // =============================
  // User
  // =============================

  async cacheUser(id, user) {

    return this.set(
      KEYS.user(id),
      user,
      TTL.LONG
    );

  }

  async getCachedUser(id) {

    return this.get(
      KEYS.user(id)
    );

  }

  async invalidateUser(id) {

    return this.remove(
      KEYS.user(id)
    );

  }

  // =============================
  // Owner
  // =============================

  async cacheOwner(id, owner) {

    return this.set(
      KEYS.owner(id),
      owner,
      TTL.LONG
    );

  }

  async getCachedOwner(id) {

    return this.get(
      KEYS.owner(id)
    );

  }

  async invalidateOwner(id) {

    return this.remove(
      KEYS.owner(id)
    );

  }

  // =============================
  // Booking
  // =============================

  async cacheBooking(id, booking) {

    return this.set(
      KEYS.booking(id),
      booking,
      TTL.MEDIUM
    );

  }

  async getCachedBooking(id) {

    return this.get(
      KEYS.booking(id)
    );

  }

  async invalidateBooking(id) {

    return this.remove(
      KEYS.booking(id)
    );

  }

  // =============================
  // Slot
  // =============================

  async cacheSlotAvailability(
    turfId,
    date,
    slots
  ) {

    return this.set(

      KEYS.slotAvailability(
        turfId,
        date
      ),

      slots,

      TTL.SHORT

    );

  }

  async getCachedSlotAvailability(
    turfId,
    date
  ) {

    return this.get(

      KEYS.slotAvailability(
        turfId,
        date
      )

    );

  }

  async invalidateSlotAvailability(
    turfId,
    date
  ) {

    return this.remove(

      KEYS.slotAvailability(
        turfId,
        date
      )

    );

  }

  // =============================
  // Dashboard
  // =============================

  async cacheDashboard(data) {

    return this.set(

      KEYS.dashboard(),

      data,

      TTL.SHORT

    );

  }

  async getDashboard() {

    return this.get(

      KEYS.dashboard()

    );

  }

  async invalidateDashboard() {

    return this.remove(

      KEYS.dashboard()

    );

  }

  // =============================
  // Analytics
  // =============================

  async cacheAnalytics(data) {

    return this.set(

      KEYS.analytics(),

      data,

      TTL.MEDIUM

    );

  }

  async getAnalytics() {

    return this.get(

      KEYS.analytics()

    );

  }

  async invalidateAnalytics() {

    return this.remove(

      KEYS.analytics()

    );

  }

  // =============================
  // Notification
  // =============================

  async cacheNotifications(
    userId,
    notifications
  ) {

    return this.set(

      KEYS.notifications(userId),

      notifications,

      TTL.SHORT

    );

  }

  async getNotifications(
    userId
  ) {

    return this.get(

      KEYS.notifications(userId)

    );

  }

  async invalidateNotifications(
    userId
  ) {

    return this.remove(

      KEYS.notifications(userId)

    );

  }

}

module.exports = new CacheService();