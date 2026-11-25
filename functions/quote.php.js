// West Ontario Paving quote form handler (Cloudflare Pages Function, ITRS 2026-11-25).
// Replaces the HostPapa quote.php: same fields, honeypot, validation and thank-you / error pages.
// Mail goes out through Microsoft Graph (app-only sendMail) from office@ to office@, Reply-To = customer.
// Secrets (Pages > Settings > Variables, encrypted): GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET.
// Graph app: dedicated 'West Ontario Paving Website Form' (Mail.Send application permission only; Exchange ApplicationAccessPolicy limits it to office@).
import { tollFree } from '../src/data/site.js';

const TO = 'office@westontariopaving.com';
const SENDER = 'office@westontariopaving.com';
const OFFICE_EMAIL = 'office@westontariopaving.com';

// Best-effort per-isolate rate limit: max 5 submissions per IP per 10 minutes.
const RL_WINDOW_MS = 10 * 60 * 1000;
const RL_MAX = 5;
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < RL_WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > RL_MAX;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function page(msg, ok) {
  const title = ok ? 'Thanks, we got your request' : 'Something went wrong';
  const html = `<!doctype html><html lang=en><head><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><meta name=robots content=noindex><title>${title} | West Ontario Paving</title>`
    + `<style>body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#f5f3ef;color:#231F20;margin:0;display:grid;place-items:center;min-height:100vh;padding:24px}main{max-width:560px}h1{font-size:2rem;margin:0 0 .5em}a.b{display:inline-block;margin-top:1.2em;background:#C8161D;color:#fff;padding:.9em 1.4em;border-radius:999px;text-decoration:none;font-weight:600}</style></head>`
    + `<body><main><img src='/logo.svg' alt='West Ontario Paving' width=180><h1>${title}</h1><p>${esc(msg)}</p><p>Prefer to talk? Call <a href='tel:${tollFree.tel}'>${tollFree.num}</a>.</p><a class=b href='/'>Back to the home page</a></main></body></html>`;
  return new Response(html, {
    status: ok ? 200 : 400,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  });
}

let cachedToken = null; // { value, exp }
async function graphToken(env) {
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.value;
  const body = new URLSearchParams({
    client_id: env.GRAPH_CLIENT_ID,
    client_secret: env.GRAPH_CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });
  const r = await fetch(`https://login.microsoftonline.com/${env.GRAPH_TENANT_ID}/oauth2/v2.0/token`, { method: 'POST', body });
  if (!r.ok) throw new Error(`token ${r.status} ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  cachedToken = { value: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return cachedToken.value;
}

async function sendMail(env, message) {
  let last = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const token = await graphToken(env);
      const r = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(SENDER)}/sendMail`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, saveToSentItems: false }),
      });
      if (r.status === 202) return true;
      last = `sendMail ${r.status} ${(await r.text()).slice(0, 300)}`;
      if (r.status === 401) cachedToken = null;
      if (r.status < 500 && r.status !== 429 && r.status !== 401) break;
    } catch (e) {
      last = String(e);
    }
    await new Promise((res) => setTimeout(res, 400 * (attempt + 1)));
  }
  console.error('WOP quote form: mail failed:', last);
  return false;
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return new Response(null, { status: 303, headers: { Location: '/request-a-quote/' } });
  }
  let fd;
  try {
    fd = await request.formData();
  } catch {
    return page('Please go back and fill in your name, a valid email address, your phone number and your city.', false);
  }
  // PHP turned spaces in field names into underscores; accept both spellings.
  const raw = (k) => String(fd.get(k) ?? fd.get(k.replace(/ /g, '_')) ?? '');
  const f = (k) => raw(k).replace(/[\r\n]+/g, ' ').trim();

  if (f('website') !== '') return page('Thanks. We will be in touch within one business day.', true); // honeypot

  const name = f('Name'), email = f('Email'), phone = f('Phone'), type = f('Type of work');
  const city = f('City'), addr = f('Address'), int = f('Main intersection'), time = f('Best time to call');
  const msg = raw('Message').trim();
  const emailOk = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[A-Za-z]{2,}$/.test(email) && email.length <= 254;
  if (!name || !phone || !city || !emailOk) {
    return page('Please go back and fill in your name, a valid email address, your phone number and your city.', false);
  }
  if (msg.length > 5000 || (msg.match(/https?:\/\//gi) || []).length > 3 || name.length > 200 || addr.length > 300) {
    return page('Please shorten your message and remove links, then try again.', false);
  }

  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (ip && limited(ip)) {
    return page(`Too many requests from your connection. Please call us at ${tollFree.num} or email ${OFFICE_EMAIL}.`, false);
  }

  const when = new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto', dateStyle: 'medium', timeStyle: 'short' });
  const lines = [
    'New quote request from westontariopaving.com', '',
    `Name: ${name}`, `Email: ${email}`, `Phone: ${phone}`, `Type of work: ${type}`,
    `Address: ${addr}`, `City: ${city}, Ontario`, `Main intersection: ${int}`, `Best time to call: ${time}`, '',
    'Project details:', msg === '' ? '(none)' : msg, '',
    `Sent ${when} ET from IP ${ip}`,
  ];
  const subject = `Website quote request - ${name.slice(0, 60)} - ${city.slice(0, 40)}`;
  const message = {
    subject,
    body: { contentType: 'Text', content: lines.join('\n') },
    from: { emailAddress: { address: SENDER, name: 'West Ontario Paving website' } },
    toRecipients: [{ emailAddress: { address: TO } }],
    replyTo: [{ emailAddress: { address: email, name: name.slice(0, 60) } }],
    internetMessageHeaders: [{ name: 'X-WOP-Form', value: 'quote' }],
  };

  if (!env.GRAPH_CLIENT_SECRET) {
    console.error('WOP quote form: Graph secrets missing');
    return page(`Your request could not be sent. Please call us at ${tollFree.num} or email ${OFFICE_EMAIL}.`, false);
  }
  const ok = await sendMail(env, message);
  console.log(`WOP quote form: ok=${ok ? 1 : 0} ip=${ip}`);
  return ok
    ? page(`Thanks, ${name}. Your request is with our office and we will get back to you within one business day.`, true)
    : page(`Your request could not be sent. Please call us at ${tollFree.num} or email ${OFFICE_EMAIL}.`, false);
}
