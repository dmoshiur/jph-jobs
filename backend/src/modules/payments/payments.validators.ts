import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    packageId: z.string().min(1),
    purpose: z.enum(['JOB_PACKAGE', 'SUBSCRIPTION', 'ADVERTISEMENT']),
    jobId: z.string().optional(),
    metadata: z.record(z.unknown()).optional()
  })
});
