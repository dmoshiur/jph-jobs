import { z } from 'zod';

const password = z.string().min(8).regex(/[A-Z]/, 'Must include uppercase letter').regex(/[0-9]/, 'Must include number');

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email().toLowerCase(),
    phone: z.string().min(6).max(30).optional(),
    password,
    accountType: z.enum(['candidate', 'employer', 'shop-owner']).default('candidate')
  })
});

export const forgotPasswordSchema = z.object({ body: z.object({ email: z.string().email().toLowerCase() }) });
