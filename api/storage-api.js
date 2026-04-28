/**
 * Storage API - File upload/download management
 */

import { uploadToStorage } from '../storage.js';

export async function handleStorageAPI(request, env, ctx, user, path) {
  const method = request.method;
  const url = new URL(request.url);
  const parts = path.split('/');
  const siteId = parts[1];

  if (!siteId) return Response.json({ error: 'Site ID required' }, { status: 400 });

  // Verify site ownership
  const site = await env.DB.prepare(
    'SELECT id FROM sites WHERE id = ? AND user_id = ?'
  ).bind(siteId, user.id).first();

  if (!site) return Response.json({ error: 'Site not found' }, { status: 404 });

  // POST /api/storage/:siteId/upload - upload file
  if (method === 'POST' && parts[2] === 'upload') {
    return handleUpload(request, env, siteId, url);
  }

  // DELETE /api/storage/:siteId/file - delete file
  if (method === 'DELETE' && parts[2] === 'file') {
    return handleDelete(request, env, siteId, url);
  }

  return Response.json({ error: 'Not found' }, { status: 404 });
}

async function handleUpload(request, env, siteId, url) {
  const storageConfig = await env.KV.get(`site:storage:${siteId}`, 'json');
  if (!storageConfig) return Response.json({ error: 'Storage not configured' }, { status: 503 });

  const contentType = request.headers.get('content-type') || 'application/octet-stream';
  const filePath = url.searchParams.get('path') || 'uploads/';
  const fileName = url.searchParams.get('name') || 'file';

  const fullPath = `${filePath}${fileName}`;
  const body = await request.arrayBuffer();

  const fileUrl = await uploadToStorage(storageConfig, fullPath, body, contentType);

  return Response.json({ success: true, url: fileUrl, path: fullPath }, { status: 201 });
}

async function handleDelete(request, env, siteId, url) {
  const storageConfig = await env.KV.get(`site:storage:${siteId}`, 'json');
  if (!storageConfig) return Response.json({ error: 'Storage not configured' }, { status: 503 });

  const filePath = url.searchParams.get('path');
  if (!filePath) return Response.json({ error: 'File path required' }, { status: 400 });

  const { supabase_url, service_key, bucket } = storageConfig;

  const response = await fetch(`${supabase_url}/storage/v1/object/${bucket}/${filePath}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${service_key}`,
      'apikey': service_key,
    }
  });

  if (!response.ok) {
    return Response.json({ error: 'Delete failed' }, { status: 502 });
  }

  return Response.json({ success: true });
}
