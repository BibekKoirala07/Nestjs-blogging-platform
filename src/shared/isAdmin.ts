export function isAdmin(req) {
  return req.user.role.toString() == 'ADMIN' ? true : false;
}
