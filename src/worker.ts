interface Env { IMMUNE_KV: KVNamespace; DEEPSEEK_API_KEY?: string; GITHUB_TOKEN?: string; }

const CSP: Record<string, string> = { 'default-src': "'self'", 'script-src': "'self' 'unsafe-inline' 'unsafe-eval'", 'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com", 'font-src': "'self' https://fonts.gstatic.com", 'img-src': "'self' data: https:", 'connect-src': "'self' https://api.deepseek.com https://api.github.com https://*'" };

function json(data: unknown, s = 200) { return new Response(JSON.stringify(data), { status: s, headers: { 'Content-Type': 'application/json', ...CSP } }); }

function getLanding(): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Fleet Immune — Cocapn</title><style>
body{font-family:system-ui,sans-serif;background:#0a0a0f;color:#e0e0e0;margin:0;min-height:100vh}
.container{max-width:800px;margin:0 auto;padding:40px 20px}
h1{color:#ef4444;font-size:2.2em}a{color:#ef4444;text-decoration:none}
.sub{color:#8A93B4;margin-bottom:2em}
.card{background:#16161e;border:1px solid #2a2a3a;border-radius:12px;padding:24px;margin:20px 0}
.card h3{color:#ef4444;margin:0 0 12px 0}
.threat{background:#1a0a0a;border-left:3px solid #ef4444;padding:12px;margin:8px 0;border-radius:0 8px 8px 0}
.threat .sev{font-weight:bold}.sev-high{color:#ef4444}.sev-med{color:#f59e0b}.sev-low{color:#22c55e}
.btn{background:#ef4444;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:bold}
.btn:hover{background:#dc2626}
textarea,select,input{background:#0a0a0f;color:#e0e0e0;border:1px solid #2a2a3a;border-radius:8px;padding:10px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}
.stat{text-align:center;padding:16px;background:#16161e;border-radius:8px;border:1px solid #2a2a3a}
.stat .num{font-size:2em;color:#ef4444;font-weight:bold}.stat .label{color:#8A93B4;font-size:.8em}
</style></head><body><div class="container">
<h1>🛡 Fleet Immune</h1><p class="sub">Collective threat detection and vaccine distribution across the fleet.</p>
<div class="stats"><div class="stat"><div class="num" id="totalReports">0</div><div class="label">Reports</div></div>
<div class="stat"><div class="num" id="activeThreats">0</div><div class="label">Active Threats</div></div>
<div class="stat"><div class="num" id="vaccines">0</div><div class="label">Vaccines</div></div>
<div class="stat"><div class="num" id="coverage">0%</div><div class="label">Coverage</div></div></div>
<div class="card"><h3>Report Anomaly</h3>
<textarea id="anomaly" rows="2" placeholder="Describe the anomaly..." style="width:100%;box-sizing:border-box"></textarea>
<div style="margin-top:12px;display:flex;gap:8px">
<select id="severity"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select>
<input id="vessel" placeholder="Reporting vessel" style="flex:1">
<button class="btn" onclick="report()">Report</button></div></div>
<div id="threats" class="card"><h3>Active Threats</h3><p style="color:#8A93B4">Loading...</p></div>
<div id="vaccineList" class="card"><h3>Vaccines</h3><p style="color:#8A93B4">Loading...</p></div>
<script>
async function load(){try{const r=await fetch('/api/stats');const s=await r.json();
document.getElementById('totalReports').textContent=s.total||0;
document.getElementById('activeThreats').textContent=s.threats||0;
document.getElementById('vaccines').textContent=s.vaccines||0;
document.getElementById('coverage').textContent=(s.coverage||0)+'%';}catch(e){}
try{const r=await fetch('/api/threats');const t=await r.json();
const el=document.getElementById('threats');
if(!t.length){el.innerHTML='<h3>Active Threats</h3><p style="color:#8A93B4">No active threats. Fleet is healthy.</p>';return;}
el.innerHTML='<h3>Active Threats</h3>'+t.map(x=>'<div class="threat"><span class="sev sev-'+x.severity+'">'+x.severity.toUpperCase()+'</span> <strong>'+x.pattern+'</strong><br><span style="color:#8A93B4;font-size:.85em">'+x.count+' reports · '+x.vessels+' vessels affected · '+x.date+'</span></div>').join('');}catch(e){}
try{const r=await fetch('/api/vaccines');const v=await r.json();
const el=document.getElementById('vaccineList');
if(!v.length){el.innerHTML='<h3>Vaccines</h3><p style="color:#8A93B4">No vaccines distributed yet.</p>';return;}
el.innerHTML='<h3>Vaccines</h3>'+v.map(x=>'<div style="padding:8px;background:#0a0f0a;border-left:3px solid #22c55e;margin:8px 0;border-radius:0 8px 8px 0"><strong>'+x.pattern+'</strong><br><span style="color:#22c55e;font-size:.85em">'+x.vaccine+'</span></div>').join('');}catch(e){}}
async function report(){const a=document.getElementById('anomaly').value.trim();if(!a)return;
const s=document.getElementById('severity').value;const v=document.getElementById('vessel').value.trim()||'unknown';
await fetch('/api/report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({anomaly:a,severity:s,vessel:v})});
document.getElementById('anomaly').value='';load();}
load();</script>
<div style="text-align:center;padding:24px;color:#475569;font-size:.75rem"><a href="https://the-fleet.casey-digennaro.workers.dev" style="color:#64748b">The Fleet</a> · <a href="https://cocapn.ai" style="color:#64748b">Cocapn</a></div>
</div></body></html>`;
}

interface Report { anomaly: string; severity: string; vessel: string; ts: string; }
interface Threat { pattern: string; severity: string; count: number; vessels: string[]; date: string; }
interface Vaccine { pattern: string; vaccine: string; confidence: number; }

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/health') return json({ status: 'ok', vessel: 'fleet-immune' });
    if (url.pathname === '/vessel.json') return json({ name: 'fleet-immune', type: 'cocapn-vessel', version: '1.0.0', description: 'Collective fleet threat detection and vaccine distribution', fleet: 'https://the-fleet.casey-digennaro.workers.dev', capabilities: ['threat-detection', 'pattern-clustering', 'vaccine-distribution'] });

    if (url.pathname === '/api/stats') {
      const reports = await env.IMMUNE_KV.get('reports', 'json') as Report[] || [];
      const threats = await env.IMMUNE_KV.get('threats', 'json') as Threat[] || [];
      const vaccines = await env.IMMUNE_KV.get('vaccines', 'json') as Vaccine[] || [];
      const vessels = await env.IMMUNE_KV.get('vessels', 'json') as string[] || [];
      return json({ total: reports.length, threats: threats.length, vaccines: vaccines.length, coverage: vessels.length > 0 ? Math.round((new Set(reports.map(r => r.vessel)).size / Math.max(vessels.length, 1)) * 100) : 0 });
    }

    if (url.pathname === '/api/threats') return json(await env.IMMUNE_KV.get('threats', 'json') || []);
    if (url.pathname === '/api/vaccines') return json(await env.IMMUNE_KV.get('vaccines', 'json') || []);
    if (url.pathname === '/api/vessels' && req.method === 'POST') {
      const { vessel } = await req.json() as { vessel: string };
      const vessels = await env.IMMUNE_KV.get('vessels', 'json') as string[] || [];
      if (!vessels.includes(vessel)) { vessels.push(vessel); await env.IMMUNE_KV.put('vessels', JSON.stringify(vessels)); }
      return json({ registered: true });
    }

    if (url.pathname === '/api/report' && req.method === 'POST') {
      const { anomaly, severity, vessel } = await req.json() as Report;
      const reports = await env.IMMUNE_KV.get('reports', 'json') as Report[] || [];
      reports.push({ anomaly: String(anomaly).substring(0, 500), severity: severity || 'medium', vessel: vessel || 'unknown', ts: new Date().toISOString() });
      if (reports.length > 500) reports.splice(0, reports.length - 500);
      await env.IMMUNE_KV.put('reports', JSON.stringify(reports));
      return json({ reported: true });
    }

    return new Response(getLanding(), { headers: { 'Content-Type': 'text/html;charset=UTF-8', ...CSP } });
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(clusterThreats(env));
  }
};

async function clusterThreats(env: Env): Promise<void> {
  const reports = await env.IMMUNE_KV.get('reports', 'json') as Report[] || [];
  if (reports.length < 3) return;

  // Simple frequency-based clustering
  const clusters: Record<string, { pattern: string; severity: string; count: number; vessels: Set<string>; dates: string[] }> = {};

  for (const r of reports) {
    const normalized = r.anomaly.toLowerCase().trim();
    const key = normalized.substring(0, 80);
    if (!clusters[key]) clusters[key] = { pattern: r.anomaly, severity: r.severity, count: 0, vessels: new Set(), dates: [] };
    clusters[key].count++;
    clusters[key].vessels.add(r.vessel);
    clusters[key].dates.push(r.ts.split('T')[0]);
    // Severity escalation: if any report is high, threat is high
    if (r.severity === 'high') clusters[key].severity = 'high';
    else if (r.severity === 'medium' && clusters[key].severity !== 'high') clusters[key].severity = 'medium';
  }

  const threats: Threat[] = Object.values(clusters)
    .filter(c => c.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
    .map(c => ({ pattern: c.pattern, severity: c.severity, count: c.count, vessels: [...c.vessels].slice(0, 10), date: c.dates[0] }));

  await env.IMMUNE_KV.put('threats', JSON.stringify(threats));

  // Auto-generate vaccines for high-severity threats
  const highThreats = threats.filter(t => t.severity === 'high');
  const existingVaccines = await env.IMMUNE_KV.get('vaccines', 'json') as Vaccine[] || [];
  const existingPatterns = new Set(existingVaccines.map(v => v.pattern.toLowerCase().substring(0, 80)));

  for (const threat of highThreats) {
    if (existingPatterns.has(threat.pattern.toLowerCase().substring(0, 80))) continue;

    const vaccine = generateVaccine(threat);
    existingVaccines.push({ pattern: threat.pattern, vaccine, confidence: Math.min(0.95, 0.5 + threat.count * 0.1) });
  }

  if (existingVaccines.length > 20) existingVaccines.splice(0, existingVaccines.length - 20);
  await env.IMMUNE_KV.put('vaccines', JSON.stringify(existingVaccines));

  // Rotate old reports (keep last 200)
  if (reports.length > 200) {
    await env.IMMUNE_KV.put('reports', JSON.stringify(reports.slice(-200)));
  }
}

function generateVaccine(threat: Threat): string {
  const patterns: Record<string, string> = {
    'timeout': 'Add timeout retry with exponential backoff (3 attempts, 1s/2s/4s). Check circuit breaker threshold.',
    '403': 'Verify API key rotation. Check rate limit headers. Implement request queue with delay.',
    '429': 'Rate limit detected. Implement token bucket with 10 req/s. Add jitter to retry timing.',
    'oom': 'Memory pressure detected. Reduce batch size to 5 items. Add streaming for large responses.',
    'dns': 'DNS resolution failure. Cache DNS results with 60s TTL. Implement fallback endpoint.',
    '422': 'Payload validation failure. Verify request schema. Check SHA freshness for concurrent pushes.',
    'cors': 'CORS block detected. Add origin to allowlist. Verify preflight headers match.',
    'unauthorized': 'Auth failure. Rotate credentials. Check token expiry. Verify permission scope.',
  };

  for (const [key, vaccine] of Object.entries(patterns)) {
    if (threat.pattern.toLowerCase().includes(key)) return vaccine;
  }

  return `Investigate: ${threat.pattern}. Monitor vessel health. Escalate if reports exceed 5 in 24h.`;
}
