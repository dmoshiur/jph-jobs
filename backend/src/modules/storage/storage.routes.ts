import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { ok } from '../../utils/api-response.js';
import { ApiError } from '../../utils/errors.js';
import { createSignedUpload, isCloudinaryConfigured, cloudinaryUrl } from '../../firebase/cloudinary.js';

/**
 * Cloudinary-backed media authorization.
 *
 * The backend never proxies bytes. It issues short-lived signed upload params
 * (POST /storage/sign) that the trusted client uses to upload directly to
 * Cloudinary. The returned `public_id` is then persisted on the owning document
 * (company logo, CV, ad image, ...).
 */
export const storageRouter = Router();

const FOLDERS: Record<string, string> = {
  'company-logo': 'jphjobs/company/logos',
  'company-cover': 'jphjobs/company/covers',
  'company-doc': 'jphjobs/company/documents',
  'business-photo': 'jphjobs/business/photos',
  cv: 'jphjobs/candidates/cv',
  'ad-image': 'jphjobs/advertisements',
  avatar: 'jphjobs/avatars'
};

const signSchema = z.object({
  body: z.object({
    purpose: z.enum(['company-logo', 'company-cover', 'company-doc', 'business-photo', 'cv', 'ad-image', 'avatar']),
    publicId: z.string().max(200).optional()
  })
});

storageRouter.post('/sign', requireAuth, validate(signSchema), asyncHandler(async (req, res) => {
  if (!isCloudinaryConfigured()) {
    throw new ApiError(503, 'Image storage is not configured. Set CLOUDINARY_* environment variables.');
  }
  const folder = FOLDERS[req.body.purpose];
  const signed = createSignedUpload(folder, req.body.publicId);
  return ok(res, signed, 'Signed upload parameters');
}));

// Resolve a stored public_id to a delivery URL (optionally transformed).
storageRouter.get('/url', requireAuth, asyncHandler(async (req, res) => {
  const publicId = String(req.query.publicId ?? '');
  if (!publicId) throw new ApiError(400, 'publicId is required');
  return ok(res, { url: cloudinaryUrl(publicId) }, 'Delivery URL');
}));
