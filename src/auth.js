function getHttpAuth() {
  const username = process.env.VRT_HTTP_USER;
  const password = process.env.VRT_HTTP_PASS;
  if (!username || !password) return null;

  const origin = process.env.VRT_HTTP_ORIGIN
    ? new URL(process.env.VRT_HTTP_ORIGIN).origin
    : null;

  return { username, password, origin };
}

function authAppliesTo(url, auth) {
  if (!auth) return false;
  if (!auth.origin) return true;
  try {
    return new URL(url).origin === auth.origin;
  } catch {
    return false;
  }
}

function authHeader(auth) {
  const token = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
  return `Basic ${token}`;
}

module.exports = { getHttpAuth, authAppliesTo, authHeader };
