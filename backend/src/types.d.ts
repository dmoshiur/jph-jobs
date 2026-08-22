import type { UserStatus } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        status: UserStatus;
        roles: string[];
        permissions: string[];
        sessionId?: string;
      };
    }
  }
}

export {};
