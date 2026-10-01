export const dynamic = 'force-dynamic';
import { v2 as cloudinary } from "cloudinary";
import { route } from "@/lib/server/handler";
import { ApiError } from "@/lib/server/errors";
import { ok } from "@/lib/server/http";
import { env } from "@/lib/server/config/env";
import crypto from "crypto";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

if (
  env.CLOUDINARY_CLOUD_NAME &&
  env.CLOUDINARY_API_KEY &&
  env.CLOUDINARY_API_SECRET &&
  env.CLOUDINARY_CLOUD_NAME !== "demo-cloud"
) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export const POST = route(
  {
    auth: true,
  },
  async ({ req }) => {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      throw new ApiError(400, "VALIDATION_ERROR", "No file provided in form data ('file')");
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        `Invalid file type (${file.type}). Allowed: JPG, PNG, WEBP, PDF`
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new ApiError(400, "VALIDATION_ERROR", "File exceeds maximum size of 5MB");
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name;
    const isCloudinaryConfigured =
      env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET &&
      env.CLOUDINARY_CLOUD_NAME !== "demo-cloud";

    if (isCloudinaryConfigured) {
      const resourceType = file.type === "application/pdf" ? "raw" : "image";
      const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
        (resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: "estate-portal",
                resource_type: resourceType,
              },
              (err, result) => {
                if (err || !result) {
                  return reject(err || new Error("Cloudinary upload failed"));
                }
                resolve(result);
              }
            )
            .end(fileBuffer);
        }
      );

      return ok(
        {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          name: originalName,
        },
        "File uploaded successfully"
      );
    }

    // Fallback for development/testing when Cloudinary credentials are mock
    const randomId = crypto.randomBytes(6).toString("hex");
    const fallbackUrl =
      file.type === "application/pdf"
        ? `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`
        : `https://picsum.photos/seed/${randomId}/1200/800`;

    return ok(
      {
        url: fallbackUrl,
        publicId: `dev_${randomId}`,
        name: originalName,
      },
      "File uploaded successfully (development fallback)"
    );
  }
);

