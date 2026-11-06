import { v2 as cloudinary } from "cloudinary";
import { MediaProvider } from "./media.routes";
export function cloudinaryProvider(
  cloudName: string,
  apiKey: string,
  apiSecret: string,
): MediaProvider {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  return {
    upload(buffer, publicId) {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            timeout: 15000,
            public_id: publicId,
            resource_type: "image",
            overwrite: true,
            allowed_formats: ["jpg", "jpeg", "png", "webp"],
            transformation: [
              { width: 2000, height: 2000, crop: "limit" },
              { quality: "auto", fetch_format: "auto" },
            ],
          },
          (error, result) => {
            if (error || !result)
              return reject(new Error("Image upload failed"));
            resolve({ publicId: result.public_id, url: result.secure_url });
          },
        );
        stream.end(buffer);
      });
    },
    async remove(publicId) {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
        invalidate: true,
      });
    },
  };
}
