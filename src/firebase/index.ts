export {
  initCaspianFirebase,
  getDefaultCaspianFirebase,
  type CaspianFirebase,
  type InitFirebaseOptions,
} from './client';
export { caspianCollections, type CaspianCollections } from './collections';
export { CASPIAN_FIRESTORE_RULES, CASPIAN_STORAGE_RULES } from './rules';
export { CASPIAN_FIRESTORE_INDEXES } from './indexes';
export { readFirebaseConfigFromEnv, describeFirebaseConfigSource } from './env-config';
