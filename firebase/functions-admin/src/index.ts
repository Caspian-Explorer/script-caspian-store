import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { onUserCreate } from './on-user-create';
export { claimAdmin } from './claim-admin';
export { runRetentionCleanup } from './retention-cleanup';
