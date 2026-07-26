const Turf = require("./turf.model");
const User = require("../user/user.model");

const ApiError = require("../../utils/ApiError");

const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../../config/cloudinary");

// ==========================================
// Create Turf
// ==========================================

const createTurf = async (
  ownerId,
  data,
  files
) => {

  // ========================================
  // Check Owner
  // ========================================

  const owner = await User.findById(ownerId);

  if (!owner) {
    throw new ApiError(404, "Owner not found");
  }

  if (owner.role !== "owner") {
    throw new ApiError(
      403,
      "Only owners can create turfs"
    );
  }

  if (!owner.ownerDetails?.isApproved) {
    throw new ApiError(
      403,
      "Owner account is not approved"
    );
  }

  // ========================================
  // Validate Images
  // ========================================

  if (!files || files.length === 0) {
    throw new ApiError(
      400,
      "At least one image is required"
    );
  }

  if (files.length > 10) {
    throw new ApiError(
      400,
      "Maximum 10 images are allowed"
    );
  }

  // ========================================
  // Duplicate Turf
  // ========================================

  const existingTurf =
    await Turf.findOne({
      owner: ownerId,
      name: data.name,
      isDeleted: false,
    });

  if (existingTurf) {
    throw new ApiError(
      409,
      "Turf with this name already exists"
    );
  }

  // ========================================
  // Upload Images
  // ========================================

  const images = [];

  try {

    for (const file of files) {

      const uploaded =
        await uploadToCloudinary(
          file.buffer,
          "turfx/turfs"
        );

      images.push({
        public_id: uploaded.public_id,
        url: uploaded.secure_url,
      });

    }

  } catch (error) {

    // Rollback uploaded images

    for (const image of images) {
      await deleteFromCloudinary(
        image.public_id
      );
    }

    throw new ApiError(
      500,
      "Failed to upload turf images"
    );

  }

  // ========================================
  // Create Turf
  // ========================================

  const turf = await Turf.create({

    owner: ownerId,

    name: data.name,

    description: data.description,

    images,

    sports: data.sports,

    pricing: data.pricing,

    slotDuration:
      data.slotDuration || 60,

    maxPlayers:
      data.maxPlayers || 10,

    workingHours:
      data.workingHours,

    contact:
      data.contact,

    facilities:
      data.facilities,

    address:
      data.address,

    location:
      data.location,

  });

  return turf;

};
// ==========================================
// Update Turf
// ==========================================

const updateTurf = async (
  ownerId,
  turfId,
  data,
  files = [],
  removeImages = []
) => {

  const turf = await Turf.findById(turfId);

  if (!turf || turf.isDeleted) {
    throw new ApiError(404, "Turf not found");
  }

  // ========================================
  // Owner Check
  // ========================================

  if (turf.owner.toString() !== ownerId.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to update this turf"
    );
  }

  // ========================================
  // Duplicate Name Check
  // ========================================

  if (
    data.name &&
    data.name !== turf.name
  ) {

    const existingTurf =
      await Turf.findOne({
        owner: ownerId,
        name: data.name,
        _id: {
          $ne: turfId,
        },
        isDeleted: false,
      });

    if (existingTurf) {
      throw new ApiError(
        409,
        "Turf name already exists"
      );
    }

  }

  // ========================================
  // Remove Images
  // ========================================

  if (removeImages.length > 0) {

    const remainingImages =
      turf.images.length -
      removeImages.length;

    if (remainingImages < 1) {
      throw new ApiError(
        400,
        "At least one image is required"
      );
    }

    for (const publicId of removeImages) {

      await deleteFromCloudinary(
        publicId
      );

      turf.images =
        turf.images.filter(
          (image) =>
            image.public_id !== publicId
        );

    }

  }

  // ========================================
  // Upload New Images
  // ========================================

  if (files && files.length > 0) {

    if (
      turf.images.length +
        files.length >
      10
    ) {
      throw new ApiError(
        400,
        "Maximum 10 images are allowed"
      );
    }

    const uploadedImages = [];

    try {

      for (const file of files) {

        const uploaded =
          await uploadToCloudinary(
            file.buffer,
            "turfx/turfs"
          );

        uploadedImages.push({
          public_id:
            uploaded.public_id,
          url:
            uploaded.secure_url,
        });

      }

      turf.images.push(
        ...uploadedImages
      );

    } catch (error) {

      for (const image of uploadedImages) {
        await deleteFromCloudinary(
          image.public_id
        );
      }

      throw new ApiError(
        500,
        "Failed to upload images"
      );

    }

  }

  // ========================================
  // Update Fields
  // ========================================

  if (data.name)
    turf.name = data.name;

  if (data.description)
    turf.description =
      data.description;

  if (data.sports)
    turf.sports = data.sports;

  if (data.pricing) {

    turf.pricing = {
      ...turf.pricing,
      ...data.pricing,
    };

  }

  if (data.slotDuration)
    turf.slotDuration =
      data.slotDuration;

  if (data.maxPlayers)
    turf.maxPlayers =
      data.maxPlayers;

  if (data.workingHours) {

    turf.workingHours = {
      ...turf.workingHours,
      ...data.workingHours,
    };

  }

  if (data.contact) {

    turf.contact = {
      ...turf.contact,
      ...data.contact,
    };

  }

  if (data.facilities) {

    turf.facilities = {
      ...turf.facilities,
      ...data.facilities,
    };

  }

  if (data.address) {

    turf.address = {
      ...turf.address,
      ...data.address,
    };

  }

  if (data.location) {
    turf.location =
      data.location;
  }

  await turf.save();

  return turf;

};
// ==========================================
// Get All Turfs
// ==========================================

const getAllTurfs = async (query) => {

  const {
    page = 1,
    limit = 10,
    search,
    city,
    sport,
    minPrice,
    maxPrice,
    rating,
    featured,
    sort = "-createdAt",
  } = query;

  const filter = {
    isDeleted: false,
    isApproved: true,
    isActive: true,
  };

  // ========================================
  // Search
  // ========================================

  if (search) {
    filter.$text = {
      $search: search,
    };
  }

  // ========================================
  // City
  // ========================================

  if (city) {
    filter["address.city"] = new RegExp(
      city,
      "i"
    );
  }

  // ========================================
  // Sport
  // ========================================

  if (sport) {
    filter.sports = sport;
  }

  // ========================================
  // Price
  // ========================================

  if (minPrice || maxPrice) {

    filter["pricing.weekday"] = {};

    if (minPrice) {
      filter["pricing.weekday"].$gte =
        Number(minPrice);
    }

    if (maxPrice) {
      filter["pricing.weekday"].$lte =
        Number(maxPrice);
    }

  }

  // ========================================
  // Rating
  // ========================================

  if (rating) {
    filter.averageRating = {
      $gte: Number(rating),
    };
  }

  // ========================================
  // Featured
  // ========================================

  if (featured === "true") {
    filter.isFeatured = true;
  }

  // ========================================
  // Pagination
  // ========================================

  const skip =
    (Number(page) - 1) *
    Number(limit);

  const turfs =
    await Turf.find(filter)
      .populate(
        "owner",
        "name avatar"
      )
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

  const total =
    await Turf.countDocuments(
      filter
    );

  return {
    turfs,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(
        total / Number(limit)
      ),
    },
  };

};

// ==========================================
// Get Turf By ID
// ==========================================

const getTurfById = async (
  turfId
) => {

  const turf =
    await Turf.findOne({
      _id: turfId,
      isDeleted: false,
      isApproved: true,
      isActive: true,
    }).populate(
      "owner",
      "name avatar contact"
    );

  if (!turf) {
    throw new ApiError(
      404,
      "Turf not found"
    );
  }

  // Increase View Count

  turf.totalViews += 1;

  await turf.save();

  return turf;

};
// ==========================================
// Get My Turfs
// ==========================================

const getMyTurfs = async (ownerId) => {

  const turfs = await Turf.find({
    owner: ownerId,
    isDeleted: false,
  }).sort("-createdAt");

  return turfs;

};

// ==========================================
// Get Nearby Turfs
// ==========================================

const getNearbyTurfs = async (
  lat,
  lng,
  distance = 5000
) => {

  const turfs = await Turf.find({
    isDeleted: false,
    isApproved: true,
    isActive: true,

    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [
            Number(lng),
            Number(lat),
          ],
        },

        $maxDistance: Number(distance),
      },
    },
  }).populate(
    "owner",
    "name avatar"
  );

  return turfs;

};

// ==========================================
// Delete Turf (Soft Delete)
// ==========================================

const deleteTurf = async (
  ownerId,
  turfId
) => {

  const turf = await Turf.findById(
    turfId
  );

  if (!turf || turf.isDeleted) {
    throw new ApiError(
      404,
      "Turf not found"
    );
  }

  if (
    turf.owner.toString() !==
    ownerId.toString()
  ) {
    throw new ApiError(
      403,
      "Unauthorized"
    );
  }

  turf.isDeleted = true;

  await turf.save();

  return {
    message:
      "Turf deleted successfully",
  };

};

// ==========================================
// Restore Turf
// ==========================================

const restoreTurf = async (
  turfId
) => {

  const turf =
    await Turf.findById(
      turfId
    );

  if (!turf) {
    throw new ApiError(
      404,
      "Turf not found"
    );
  }

  turf.isDeleted = false;

  await turf.save();

  return turf;

};

// ==========================================
// Approve Turf
// ==========================================

const approveTurf = async (
  turfId
) => {

  const turf =
    await Turf.findById(
      turfId
    );

  if (!turf) {
    throw new ApiError(
      404,
      "Turf not found"
    );
  }

  turf.isApproved = true;

  await turf.save();

  return turf;

};

// ==========================================
// Reject Turf
// ==========================================

const rejectTurf = async (
  turfId
) => {

  const turf =
    await Turf.findById(
      turfId
    );

  if (!turf) {
    throw new ApiError(
      404,
      "Turf not found"
    );
  }

  turf.isApproved = false;

  await turf.save();

  return turf;

};

// ==========================================
// Module Exports
// ==========================================

module.exports = {
  createTurf,
  updateTurf,

  getAllTurfs,
  getTurfById,

  getMyTurfs,
  getNearbyTurfs,

  deleteTurf,

  approveTurf,
  rejectTurf,
  restoreTurf,
};