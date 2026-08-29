export const hasRole = (role: string, userRoles: string[] = []) =>
    userRoles.includes(role);

export const hasPermission = (
  userPermissions: string[],
  permission: string | string[],
) => {
  if (Array.isArray(permission)) {
    return permission.some((p) => userPermissions.includes(p));
  }
  return userPermissions.includes(permission);
};