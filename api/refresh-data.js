/**
 * ENIA v3 — /api/refresh-data  (opção Vercel)
 * ------------------------------------------------------------------
 * O filesystem das funções serverless é read-only: este endpoint NÃO
 * escreve os JSON. Dispara o workflow do GitHub, que corre o sync e faz
 * commit — mantendo o repositório como fonte única de verdade, seja o
 * deploy em Vercel, Netlify ou Pages.
 *
 * Variáveis de ambiente necessárias (Project Settings → Environment):
 *   GITHUB_TOKEN   token com permissão 'actions: write' no repositório
 *   GITHUB_REPO    ex.: "enia-pt/site"
 *   CRON_SECRET    definido automaticamente pela Vercel nos crons
 *
 * Alternativa sem GitHub: instalar @vercel/blob e escrever news.json
 * no Blob store, servindo-o a partir de /data via rewrite.
 */

export default async function handler(req, res) {
  // A Vercel assina os pedidos de cron com este header.
  const auth = req.headers.authorization;
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ ok: false, error: 'não autorizado' });
  }

  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  if (!repo || !token) {
    return res.status(500).json({ ok: false, error: 'GITHUB_REPO ou GITHUB_TOKEN em falta' });
  }

  const url = `https://api.github.com/repos/${repo}/actions/workflows/radar-daily.yml/dispatches`;

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${token}`,
        'x-github-api-version': '2022-11-28',
        'content-type': 'application/json',
        'user-agent': 'ENIA-Radar/3.0'
      },
      body: JSON.stringify({ ref: 'main' })
    });

    if (!r.ok) throw new Error(`GitHub respondeu ${r.status}: ${await r.text()}`);

    return res.status(200).json({
      ok: true,
      triggered: 'radar-daily.yml',
      at: new Date().toISOString()
    });
  } catch (e) {
    return res.status(502).json({ ok: false, error: e.message });
  }
}
