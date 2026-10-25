import { setupServer } from 'msw/node';
import { authHandlers } from './handlers/auth';
import { metaHandlers } from './handlers/meta';
import { profileHandlers } from './handlers/profiles';
import { quotaHandlers } from './handlers/quota';

export const server = setupServer(...metaHandlers, ...authHandlers, ...profileHandlers, ...quotaHandlers);
