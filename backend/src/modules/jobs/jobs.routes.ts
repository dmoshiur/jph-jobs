import { Router } from 'express';
import { requireAnyPermission, requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './jobs.controller.js';
import { createJobSchema, idParamSchema, listJobsSchema, updateJobSchema } from './jobs.validators.js';

export const jobsRouter = Router();
jobsRouter.get('/', validate(listJobsSchema), controller.list);
jobsRouter.get('/:id', validate(idParamSchema), controller.detail);
jobsRouter.post('/', requireAuth, requireAnyPermission(['jobs.create']), validate(createJobSchema), controller.create);
jobsRouter.patch('/:id', requireAuth, requireAnyPermission(['jobs.edit', 'jobs.create']), validate(updateJobSchema), controller.update);
