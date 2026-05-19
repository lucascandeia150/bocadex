// FCM HTTP v1 push sender. Auth: admin via JWT, or shared call from other functions via SERVICE_ROLE.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = ''; for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function pemToDer(pem: string): Uint8Array {
  const b64 = pem.replace(/-----BEGIN [^-]+-----/g, '').replace(/-----END [^-]+-----/g, '').replace(/\s+/g, '');
  const bin = atob(b64); const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

let cachedToken: { token: string; exp: number } | null = null;
async function getAccessToken(sa: { client_email: string; private_key: string }): Promise<string> {
  if (cachedToken && cachedToken.exp > Math.floor(Date.now() / 1000) + 60) return cachedToken.token;
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  };
  const enc = new TextEncoder();
  const data = `${b64url(enc.encode(JSON.stringify(header)))}.${b64url(enc.encode(JSON.stringify(payload)))}`;
  const key = await crypto.subtle.importKey(
    'pkcs8', pemToDer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(data));
  const jwt = `${data}.${b64url(sig)}`;
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const json = await resp.json();
  if (!resp.ok) throw new Error('OAuth failed: ' + JSON.stringify(json));
  cachedToken = { token: json.access_token, exp: now + (json.expires_in ?? 3600) };
  return cachedToken.token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const saRaw = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
    if (!saRaw) throw new Error('FIREBASE_SERVICE_ACCOUNT não configurado');
    const sa = JSON.parse(saRaw);

    const body = await req.json().catch(() => ({}));
    const { title, body: msgBody, data = {}, target = 'all', user_id, tokens: explicitTokens } = body;
    if (!title || !msgBody) {
      return new Response(JSON.stringify({ error: 'title e body são obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Authorize: either admin user, or internal call with service-role secret in dedicated header.
    const authHeader = req.headers.get('Authorization') ?? '';
    const internalSecret = req.headers.get('x-internal-secret') ?? '';
    const isInternal = internalSecret.length > 0 && internalSecret === SERVICE_ROLE;
    let createdBy: string | null = null;
    if (!isInternal) {
      const supaUser = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace('Bearer ', '');
      const { data: claims, error } = await supaUser.auth.getClaims(token);
      if (error || !claims?.claims) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const uid = claims.claims.sub as string;
      const { data: roles } = await supaUser.from('user_roles').select('role').eq('user_id', uid).eq('role', 'admin');
      if (!roles || roles.length === 0) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      createdBy = uid;
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    let tokens: string[] = Array.isArray(explicitTokens) ? explicitTokens : [];
    let targetUserIds: string[] = [];
    if (tokens.length === 0) {
      let q = admin.from('device_tokens').select('token, user_id');
      if (target === 'user' && user_id) q = q.eq('user_id', user_id);
      const { data: rows, error: rErr } = await q;
      if (rErr) throw rErr;
      tokens = (rows ?? []).map((r: { token: string }) => r.token);
      targetUserIds = Array.from(new Set(((rows ?? []) as { user_id: string | null }[])
        .map((r) => r.user_id).filter((u): u is string => !!u)));
    }
    if (target === 'user' && user_id) targetUserIds = [user_id];

    // Persist into user_notifications history
    if (targetUserIds.length > 0) {
      const click_url = (data && (data as Record<string, unknown>).click_url) as string | undefined;
      const rows = targetUserIds.map((uid) => ({
        user_id: uid, title, body: msgBody, click_url: click_url ?? null, data,
      }));
      await admin.from('user_notifications').insert(rows);
    }

    if (tokens.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, failed: 0, info: 'sem tokens' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accessToken = await getAccessToken(sa);
    const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
    let sent = 0, failed = 0;
    const invalidTokens: string[] = [];

    await Promise.all(tokens.map(async (t) => {
      const message = {
        message: {
          token: t,
          notification: { title, body: msgBody },
          webpush: {
            notification: { title, body: msgBody, icon: '/icon-192.png', badge: '/icon-192.png' },
            fcm_options: data?.click_url ? { link: data.click_url } : undefined,
          },
          data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
        },
      };
      const r = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
      if (r.ok) { sent++; } else {
        failed++;
        const errJson = await r.json().catch(() => ({}));
        const code = errJson?.error?.details?.[0]?.errorCode || errJson?.error?.status;
        if (code === 'UNREGISTERED' || code === 'NOT_FOUND' || code === 'INVALID_ARGUMENT') invalidTokens.push(t);
      }
    }));

    if (invalidTokens.length > 0) {
      await admin.from('device_tokens').delete().in('token', invalidTokens);
    }

    await admin.from('push_logs').insert({
      title, body: msgBody, data, target, sent_count: sent, failed_count: failed, created_by: createdBy,
    });

    return new Response(JSON.stringify({ ok: true, sent, failed, total: tokens.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});