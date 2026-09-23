const TAVILY_URL = 'https://api.tavily.com/search';

async function tavilySearch(query) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(TAVILY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'basic',
      include_answer: true,
      max_results: 5,
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) return null;
  const json = await response.json();
  return {
    answer: json.answer || null,
    results: (json.results || []).map((r) => ({ title: r.title, url: r.url, content: r.content })),
  };
}

// Three queries per IPO, run once and cached forever — keeps this within the shared Tavily budget
// while giving every rubric section (legal, anchor/LM, valuation, financials) real coverage.
export async function researchIpo(name, isSme) {
  const queries = [
    `${name} IPO promoter director SEBI case litigation red flags India`,
    `${name} IPO anchor investors ${isSme ? 'lead manager track record market maker' : 'quality institutional investors'} India`,
    `${name} IPO financial results revenue profit peer valuation P/E ratio comparison India`,
  ];

  const results = await Promise.all(queries.map((q) => tavilySearch(q).catch(() => null)));
  const found = results.filter(Boolean);
  if (!found.length) return null;

  return queries
    .map((query, i) => {
      const r = results[i];
      if (!r) return null;
      const lines = [`Query: "${query}"`];
      if (r.answer) lines.push(`Summary: ${r.answer}`);
      r.results.forEach((item, j) => {
        lines.push(`[${j + 1}] ${item.title} — ${item.url}\n${(item.content || '').slice(0, 500)}`);
      });
      return lines.join('\n');
    })
    .filter(Boolean)
    .join('\n\n---\n\n');
}
