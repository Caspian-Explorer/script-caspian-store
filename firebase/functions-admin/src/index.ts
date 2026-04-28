import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { onUserCreate } from './on-user-create';
export { claimAdmin } from './claim-admin';
export { ensureAdminClaim } from './ensure-admin-claim';
export { syncAdminClaim } from './sync-admin-claim';
export { runRetentionCleanup } from './retention-cleanup';
