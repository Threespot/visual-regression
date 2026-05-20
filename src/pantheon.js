// Pantheon sandbox environments (*.pantheonsite.io) show a one-time
// "hosted in a sandbox environment" interstitial. Clicking through sets
// `Deterrence-Bypass=1`. Pre-seeding the cookie skips the warning so the
// first navigation lands on the real page.
function pantheonBypassCookies(url) {
  let hostname;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return [];
  }
  if (!hostname.endsWith('.pantheonsite.io')) return [];
  return [
    { name: 'Deterrence-Bypass', value: '1', domain: hostname, path: '/' },
  ];
}

module.exports = { pantheonBypassCookies };
