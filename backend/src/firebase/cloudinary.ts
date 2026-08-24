/**
 * Cloudinary integration — replaces the previous S3/object-storage layer.
 *
 * The backend never receives raw file bytes. Instead it issues *signed upload
 * parameters* to the trusted client, which uploads directly to Cloudinary. The
 * resulting `public_id` / secure URL is then stored on the relevant document
 * (company logo, CV, advertisement image, etc.).
 */
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

let configured = false;

export function isCloudinaryConfigured() {
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

function ensureConfigured() {
  if (configured) return;
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true
  });
  configured = true;
}

export interface SignedUpload {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
  uploadUrl: string;
}

/**
 * Produce signed parameters the client uses for a direct, authenticated upload.
 */
export function createSignedUpload(folder: string, publicId?: string): SignedUpload {
  ensureConfigured();
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign: Record<string, string | number> = { timestamp, folder };
  if (publicId) paramsToSign.public_id = publicId;
  const signature = cloudinary.utils.api_sign_request(paramsToSign, env.CLOUDINARY_API_SECRET!);
  return {
    timestamp,
    signature,
    apiKey: env.CLOUDINARY_API_KEY!,
    cloudName: env.CLOUDINARY_CLOUD_NAME!,
    folder,
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/auto/upload`
  };
}

/**
 * Build a delivery URL for a stored Cloudinary public id (optionally transformed).
 */
export function cloudinaryUrl(publicId?: string | null, options?: Record<string, unknown>) {
  if (!publicId) return null;
  if (/^https?:\/\//.test(publicId)) return publicId; // already a full URL
  ensureConfigured();
  return cloudinary.url(publicId, { secure: true, ...options });
}

/** Best-effort deletion of an asset (used when replacing/removing media). */
export async function destroyAsset(publicId?: string | null) {
  if (!publicId || /^https?:\/\//.test(publicId)) return;
  ensureConfigured();
  await cloudinary.uploader.destroy(publicId).catch(() => undefined);
}
