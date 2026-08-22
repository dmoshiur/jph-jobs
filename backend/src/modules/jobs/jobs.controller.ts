import { asyncHandler } from '../../utils/async-handler.js';
import { created, ok } from '../../utils/api-response.js';
import { audit } from '../audit/audit.service.js';
import * as service from './jobs.service.js';

export const list = asyncHandler(async (req, res) => ok(res, await service.listJobs(req.query as any), 'Jobs'));
export const detail = asyncHandler(async (req, res) => ok(res, await service.getJob(req.params.id), 'Job detail'));
export const create = asyncHandler(async (req, res) => {
  const job = await service.createJob(req.user!.id, req.body);
  await audit(req, { action: 'jobs.create', resource: 'jobs', resourceId: job.id, newValue: job });
  return created(res, job, 'Job submitted for review');
});
export const update = asyncHandler(async (req, res) => {
  const isPrivileged = req.user!.permissions.includes('jobs.edit') || req.user!.roles.includes('root-admin');
  const job = await service.updateJob(req.user!.id, isPrivileged, req.params.id, req.body);
  await audit(req, { action: 'jobs.edit', resource: 'jobs', resourceId: job.id, newValue: job });
  return ok(res, job, 'Job updated');
});
