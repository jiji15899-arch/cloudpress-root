/**
 * Dashboard Handler
 * Serves the CloudPress user dashboard
 */

import { getDashboardHTML } from './dashboard-html.js';

export async function handleDashboard(request, env, ctx) {
  const url = new URL(request.url);

  // Serve dashboard HTML for all non-API routes
  return new Response(getDashboardHTML(), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.cloudflare.com https://*.supabase.co;",
    }
  });
}
