// src/services/mandi/firebase.service.js
// Lazy Firebase Admin init for phone-auth login. The service account comes
// from FIREBASE_SERVICE_ACCOUNT (JSON string, base64, or a file path).
// Empty/unset = Firebase login disabled (dev falls back to console OTP).
import fs from 'fs';
import config from '@configs/app.config.js';
import { Logger } from '@src/utils/logger.js';

let adminModule = null;
let adminApp = null;

export function firebaseEnabled() {
  return Boolean(config.get('firebaseServiceAccount'));
}

export async function getFirebaseAuth() {
  if (!firebaseEnabled()) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not configured');
  }
  if (!adminApp) {
    // firebase-admin v12 classic API: admin.initializeApp / admin.credential.cert / app.auth()
    adminModule = (await import('firebase-admin')).default;
    const raw = config.get('firebaseServiceAccount');
    // Accept a file path (absolute or relative to the app root) or raw/base64 JSON.
    const looksLikePath = !raw.includes('{') && (raw.trim().startsWith('/') || fs.existsSync(raw.trim()));
    const keyJson = looksLikePath
      ? fs.readFileSync(raw.trim(), 'utf8')
      : (raw.includes('{') ? raw : Buffer.from(raw, 'base64').toString('utf8'));
    adminApp = adminModule.initializeApp(
      { credential: adminModule.credential.cert(JSON.parse(keyJson)) },
      'mandi-trip'
    );
    Logger.info('Firebase Admin initialized');
  }
  return adminApp.auth();
}
