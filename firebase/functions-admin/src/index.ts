import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { onUserCreate } from './on-user-create';
export { claimAdmin } from './claim-admin';
export { runRetentionCleanup } from './retention-cleanup';
export { runEmailOnOrderCreate, runEmailOnOrderUpdate } from './order-email-triggers';
export { runEmailOnContactCreate } from './contact-email-triggers';
export { sendTestEmail } from './send-test-email';
