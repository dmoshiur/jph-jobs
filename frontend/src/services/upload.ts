import { api } from './api';

type UploadPurpose =
  | 'company-logo'
  | 'company-cover'
  | 'company-doc'
  | 'business-photo'
  | 'cv'
  | 'ad-image'
  | 'avatar';

interface SignedUpload {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
  uploadUrl: string;
}

export interface UploadResult {
  publicId: string;
  url: string;
  resourceType: string;
  format?: string;
  bytes?: number;
}

/**
 * Upload a file to Cloudinary using signed params minted by our backend.
 * The returned `publicId` should be persisted on the owning record.
 */
export async function uploadToCloudinary(file: File, purpose: UploadPurpose): Promise<UploadResult> {
  const signed = await api.post<SignedUpload>('/storage/sign', { purpose });

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', signed.apiKey);
  form.append('timestamp', String(signed.timestamp));
  form.append('signature', signed.signature);
  form.append('folder', signed.folder);

  const res = await fetch(signed.uploadUrl, { method: 'POST', body: form });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error((detail as { error?: { message?: string } })?.error?.message || 'Upload failed');
  }
  const data = await res.json();
  return {
    publicId: data.public_id as string,
    url: data.secure_url as string,
    resourceType: data.resource_type as string,
    format: data.format,
    bytes: data.bytes
  };
}
