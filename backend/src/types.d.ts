declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        status: string;
        roles: string[];
        permissions: string[];
        sessionId?: string;
      };
    }
  }
}

export {};
