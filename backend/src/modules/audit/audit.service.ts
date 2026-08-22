import type { Request } from 'express';
import { prisma } from '../../database/prisma.js';
import { requestIp } from '../../middleware/request-context.js';

interface AuditInput {
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: unknown;
  newValue?: unknown;
}

export async function audit(req: Request, input: AuditInput) {
  await prisma.auditLog.create({
    data: {
      adminId: req.user?.id,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      oldValue: input.oldValue as object | undefined,
      newValue: input.newValue as object | undefined,
      ip: requestIp(req),
      userAgent: req.headers['user-agent']
    }
  });
}
