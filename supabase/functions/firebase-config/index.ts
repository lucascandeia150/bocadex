const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const body = {
    apiKey: Deno.env.get('FIREBASE_API_KEY') ?? '',
    messagingSenderId: Deno.env.get('FIREBASE_MESSAGING_SENDER_ID') ?? '',
    appId: Deno.env.get('FIREBASE_APP_ID') ?? '',
    vapidKey: Deno.env.get('FIREBASE_VAPID_KEY') ?? '',
    projectId: (() => {
      try {
        const sa = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') ?? '{}');
        return sa.project_id ?? '';
      } catch { return ''; }
    })(),
  };
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});