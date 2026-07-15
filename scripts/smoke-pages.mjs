const rawBase = process.argv[2] || process.env.PAGES_URL;
if (!rawBase) throw new Error("Pass the deployed Pages URL as the first argument or PAGES_URL.");
const base = new URL(rawBase.endsWith("/") ? rawBase : `${rawBase}/`);

async function request(path, { binary = false, minBytes = 1, marker } = {}) {
  const url = new URL(path, base);
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const body = binary ? new Uint8Array(await response.arrayBuffer()) : await response.text();
  if (body.length < minBytes) throw new Error(`${url}: response is only ${body.length} bytes.`);
  if (marker && !String(body).includes(marker)) throw new Error(`${url}: missing marker ${JSON.stringify(marker)}.`);
  console.log(`${url.pathname}: ${body.length} bytes`);
  return body;
}

await request("./", { minBytes: 500, marker: "把真实资料变成可编辑 PowerPoint" });
await request("benchmark/", { minBytes: 4000, marker: "先看成品" });
await request("examples/ai-frontier-2026/gpt-5-6.html", { minBytes: 4000, marker: "三种轨道" });
await request("examples/ai-frontier-2026/gpt-5-6-mobile.png", { binary: true, minBytes: 10000 });
const pptx = await request("examples/executive-business-review-starter/executive-business-review-editable.pptx", {
  binary: true,
  minBytes: 50000,
});
if (pptx[0] !== 0x50 || pptx[1] !== 0x4b) throw new Error("Public PPTX is not an OOXML ZIP payload.");
const quality = JSON.parse(await request("examples/executive-business-review-starter/quality-report.json", {
  minBytes: 1000,
  marker: '"status"',
}));
if (!["pending", "passed", "warning", "blocked"].includes(quality.status)) {
  throw new Error(`Quality report has invalid status: ${quality.status}`);
}
await request("social-preview.png", { binary: true, minBytes: 20000 });
await request("sitemap.xml", { minBytes: 500, marker: "<urlset" });
console.log(`Pages smoke passed: ${base}`);
