/**
 * Auth middleware - re-exports from api/auth.js
 */
import { requireAuth as _requireAuth } from './api/auth.js';
export const requireAuth = _requireAuth;
