export function getConfig(env) {
  return {
    adminDomain: env.ADMIN_DOMAIN || 'app.cloudpress.app',
    superAdminDomain: env.SUPERADMIN_DOMAIN || 'admin.cloudpress.app',
  };
}

export function isWordPressDomain(host, env) {
  const adminDomain = env.ADMIN_DOMAIN || 'app.cloudpress.app';
  const superAdminDomain = env.SUPERADMIN_DOMAIN || 'admin.cloudpress.app';
  return host !== adminDomain && host !== `www.${adminDomain}` && host !== superAdminDomain;
}
