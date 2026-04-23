import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { runEmailOnOrderCreate, runEmailOnOrderUpdate } from './order-email-triggers';
export { runEmailOnContactCreate } from './contact-email-triggers';
export { sendTestEmail } from './send-test-email';
