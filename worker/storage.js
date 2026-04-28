/**
 * Supabase Storage Integration
 * Auto-manages 18 accounts x 2 projects = 36 buckets
 */

const SUPABASE_MANAGEMENT_API = 'https://api.supabase.com';

export async function allocateStorage(env, siteId) {
  // Find available Supabase account/bucket slot
  const accounts = await env.KV.get('supabase:accounts', 'json') || [];
  
  for (const account of accounts) {
    for (const project of account.projects) {
      // 1 bucket per project = 1 site (isolation model; 18 accounts x 2 projects = 36 sites max)
      if (project.bucket_count < 1) {
        // Allocate this slot
        const bucketName = `cloudpress-${siteId}`;
        await createSupabaseBucket(project, bucketName);
        
        project.bucket_count++;
        project.sites = project.sites || [];
        project.sites.push(siteId);
        
        await env.KV.put('supabase:accounts', JSON.stringify(accounts));
        
        return {
          supabase_url: project.url,
          anon_key: project.anon_key,
          service_key: project.service_key,
          bucket: bucketName,
          project_id: project.id,
          account_id: account.id,
        };
      }
    }
  }

  throw new Error('No available Supabase storage slots. Please add more accounts.');
}

export async function initializeSupabaseAccounts(env) {
  const existingAccounts = await env.KV.get('supabase:accounts', 'json');
  if (existingAccounts && existingAccounts.length > 0) return existingAccounts;

  // Initialize 18 account slots structure
  const accounts = [];
  for (let i = 1; i <= 18; i++) {
    accounts.push({
      id: `account_${i}`,
      email: null, // To be configured by admin
      configured: false,
      projects: [
        { id: null, url: null, anon_key: null, service_key: null, bucket_count: 0, sites: [] },
        { id: null, url: null, anon_key: null, service_key: null, bucket_count: 0, sites: [] },
      ]
    });
  }

  await env.KV.put('supabase:accounts', JSON.stringify(accounts));
  return accounts;
}

export async function configureSupabaseAccount(env, accountIndex, projectIndex, config) {
  const accounts = await env.KV.get('supabase:accounts', 'json') || [];
  
  if (!accounts[accountIndex]) throw new Error('Account not found');
  
  accounts[accountIndex].configured = true;
  accounts[accountIndex].email = config.email;
  accounts[accountIndex].projects[projectIndex] = {
    ...accounts[accountIndex].projects[projectIndex],
    id: config.project_id,
    url: config.project_url,
    anon_key: config.anon_key,
    service_key: config.service_key,
    bucket_count: 0,
    sites: [],
  };

  await env.KV.put('supabase:accounts', JSON.stringify(accounts));
  return accounts[accountIndex];
}

async function createSupabaseBucket(project, bucketName) {
  const response = await fetch(`${project.url}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${project.service_key}`,
      'apikey': project.service_key,
    },
    body: JSON.stringify({
      id: bucketName,
      name: bucketName,
      public: true,
      fileSizeLimit: 52428800, // 50MB per file
      allowedMimeTypes: [
        'image/*', 'video/*', 'audio/*',
        'application/pdf', 'text/*',
        'application/zip', 'application/x-tar',
      ]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to create bucket: ${err}`);
  }

  return await response.json();
}

export async function uploadToStorage(storageConfig, path, data, contentType) {
  const { supabase_url, service_key, bucket } = storageConfig;

  const response = await fetch(`${supabase_url}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      'Authorization': `Bearer ${service_key}`,
      'apikey': service_key,
      'x-upsert': 'true',
    },
    body: data,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${await response.text()}`);
  }

  return `${supabase_url}/storage/v1/object/public/${bucket}/${path}`;
}

export async function deleteStorageSite(env, siteId) {
  const storageConfig = await env.KV.get(`site:storage:${siteId}`, 'json');
  if (!storageConfig) return;

  // Delete all files in bucket
  const { supabase_url, service_key, bucket } = storageConfig;

  try {
    // List all files
    const listResp = await fetch(`${supabase_url}/storage/v1/object/list/${bucket}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${service_key}`,
        'apikey': service_key,
      },
      body: JSON.stringify({ prefix: '', limit: 1000 })
    });

    if (listResp.ok) {
      const files = await listResp.json();
      if (files.length > 0) {
        await fetch(`${supabase_url}/storage/v1/object/${bucket}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${service_key}`,
            'apikey': service_key,
          },
          body: JSON.stringify({ prefixes: files.map(f => f.name) })
        });
      }
    }

    // Delete bucket
    await fetch(`${supabase_url}/storage/v1/bucket/${bucket}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${service_key}`,
        'apikey': service_key,
      }
    });
  } catch (e) {
    console.error('Storage cleanup error:', e);
  }

  // Update account slot
  const accounts = await env.KV.get('supabase:accounts', 'json') || [];
  for (const account of accounts) {
    for (const project of account.projects) {
      if (project.sites && project.sites.includes(siteId)) {
        project.sites = project.sites.filter(s => s !== siteId);
        project.bucket_count = Math.max(0, project.bucket_count - 1);
      }
    }
  }
  await env.KV.put('supabase:accounts', JSON.stringify(accounts));
  await env.KV.delete(`site:storage:${siteId}`);
}

export async function getFromStorage(env, siteId, path) {
  const storageConfig = await env.KV.get(`site:storage:${siteId}`, 'json');
  if (!storageConfig) return null;

  const { supabase_url, anon_key, bucket } = storageConfig;
  const resp = await fetch(`${supabase_url}/storage/v1/object/public/${bucket}/${path}`, {
    headers: { 'apikey': anon_key }
  });

  if (!resp.ok) return null;
  return resp;
}

export async function putToStorage(env, siteId, path, data, contentType) {
  const storageConfig = await env.KV.get(`site:storage:${siteId}`, 'json');
  if (!storageConfig) throw new Error('Storage not configured');
  return uploadToStorage(storageConfig, path, data, contentType);
}
