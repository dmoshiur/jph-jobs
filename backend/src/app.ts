import express from 'express';
import morgan from 'morgan';
import { env, isProduction } from './config/env.js';
import { csrfProtection } from './middleware/auth.js';
import { errorHandler } from './middleware/error-handler.js';
import { applySecurity } from './middleware/security.js';
import { apiRouter } from './routes/index.js';
import { fail } from './utils/api-response.js';

const app = express();
applySecurity(app);
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(csrfProtection);
app.use(env.API_PREFIX, apiRouter);
app.use((_req, res) => fail(res, 'Not found', {}, 404));
app.use(errorHandler);

export default app;
