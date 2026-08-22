import app from './app.js';
import { env } from './config/env.js';
import { bootstrap } from './config/bootstrap.js';

// Ensure the root admin / core roles exist before accepting traffic.
void bootstrap().then(() => {
  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`JPH Jobs backend listening on http://0.0.0.0:${env.PORT}${env.API_PREFIX}`);
  });
});
