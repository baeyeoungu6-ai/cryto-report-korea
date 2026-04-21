import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");
const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
}).format(new Date());

const articlePath = path.join(root, "data", "articles.json");
const rankingPath = path.join(root, "data", "rankings.json");
const postsDir = path.join(root, "posts");

const marketNameOverrides = {
  BTC: "비트코인",
  ETH: "이더리움",
  XRP: "리플",
  SOL: "솔라나",
  DOGE: "도지코인",
  ADA: "에이다",
  TRX: "트론",
  AVAX: "아발란체",
  LINK: "체인링크",
  DOT: "폴카닷",
  BCH: "비트코인캐시",
  SUI: "수이",
  NEAR: "니어프로토콜",
  APT: "앱토스",
  ETC: "이더리움클래식"
};

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "altcoin-korea-report/1.0"
    }
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

async function loadArticles() {
  try {
    return JSON.parse(await readFile(articlePath, "utf8"));
  } catch {
    return [];
  }
}

function chunk(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

function formatWon(value, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits
  }).format(value);
}

function formatVolume(value) {
  if (value >= 1_0000_0000_0000) return `${(value / 1_0000_0000_0000).toFixed(2)}조원`;
  if (value >= 1_0000_0000) return `${(value / 1_0000_0000).toFixed(1)}억원`;
  return formatWon(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function hasFinalConsonant(value) {
  const last = [...value].at(-1);
  if (!last) return false;
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

function topicParticle(value) {
  return hasFinalConsonant(value) ? "은" : "는";
}

function instrumentalParticle(value) {
  return hasFinalConsonant(value) ? "으로" : "로";
}

function slugFor(date, symbol) {
  return `${date}-${symbol.toLowerCase()}.html`;
}

function navHtml() {
  return `
    <header class="site-header">
      <a class="brand" href="/"><span class="brand-mark"><img src="/alt.webp" alt=""></span><span>알트코인 리포트</span></a>
      <nav class="nav-links" aria-label="주요 메뉴">
        <a href="/">홈</a>
        <a href="/reports.html">리포트</a>
        <a href="/about.html">소개</a>
        <a href="/privacy.html">개인정보처리방침</a>
        <a href="/disclaimer.html">면책고지</a>
      </nav>
    </header>`;
}

function buildArticleHtml(article) {
  const title = escapeHtml(article.title);
  const summary = escapeHtml(article.summary);
  const name = escapeHtml(article.koreanName);
  const symbol = escapeHtml(article.symbol);
  const topic = topicParticle(article.koreanName);
  const volumeParticle = instrumentalParticle(article.volumeText);

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title} | 알트코인 리포트 코리아</title>
    <meta name="description" content="${summary}">
    <link rel="icon" type="image/webp" href="/alt.webp">
    <link rel="apple-touch-icon" href="/alt.webp">
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
    ${navHtml()}
    <main class="post-main">
      <article>
        <p class="eyebrow">Upbit daily rank ${article.rank}</p>
        <h1>${title}</h1>
        <p class="hero-text">${summary}</p>
        <dl>
          <div>
            <dt>업비트 순위</dt>
            <dd>${article.rank}위</dd>
          </div>
          <div>
            <dt>마켓</dt>
            <dd>${symbol}</dd>
          </div>
          <div>
            <dt>현재가</dt>
            <dd>${article.priceText}</dd>
          </div>
          <div>
            <dt>24시간 등락률</dt>
            <dd>${article.changeText}</dd>
          </div>
        </dl>
        <h2>오늘의 순위 해석</h2>
        <p>${name}${topic} 오늘 업비트 KRW 마켓 24시간 상승률 기준 ${article.rank}위입니다. 등락률은 ${article.changeText}, 현재가는 ${article.priceText}, 거래대금은 ${article.volumeText}${volumeParticle} 집계됐습니다.</p>
        <p>상위권 거래대금은 시장 참여자의 관심이 집중됐다는 뜻이지만, 동시에 단기 매수와 매도 주문이 빠르게 충돌하는 구간일 수 있습니다. 순위가 높을수록 진입 가격, 손절 가격, 분할 매수 기준을 먼저 정해두는 것이 중요합니다.</p>
        <h2>매매 전 체크 포인트</h2>
        <p>첫째, 업비트 호가창에서 특정 가격대에 매수 또는 매도 물량이 과도하게 쌓였는지 확인합니다. 둘째, 비트코인과 이더리움의 방향이 같은지 확인합니다. 셋째, 거래대금이 유지되는지 또는 단기 이벤트 후 빠르게 식는지 확인합니다.</p>
        <p>이 글은 자동 생성된 시장 브리프이며 투자 권유가 아닙니다. 코인 거래는 원금 손실 가능성이 크므로 거래 전 실시간 가격과 공지사항을 직접 확인해야 합니다.</p>
        <a class="post-cta" href="/referral.html">거래소 혜택 확인</a>
      </article>
    </main>
  </body>
</html>
`;
}

async function getRankedMarkets() {
  const markets = await fetchJson("https://api.upbit.com/v1/market/all?isDetails=false");
  const krwMarkets = markets
    .filter((market) => market.market.startsWith("KRW-"))
    .map((market) => ({ ...market, symbol: market.market.replace("KRW-", "") }));

  const tickers = [];
  for (const group of chunk(krwMarkets, 80)) {
    const url = `https://api.upbit.com/v1/ticker?markets=${group.map((market) => market.market).join(",")}`;
    tickers.push(...(await fetchJson(url)));
  }

  const marketByCode = new Map(krwMarkets.map((market) => [market.market, market]));
  return tickers
    .map((ticker) => ({ ticker, market: marketByCode.get(ticker.market) }))
    .filter((item) => item.market)
    .sort((a, b) => b.ticker.signed_change_rate - a.ticker.signed_change_rate);
}

function toRanking(item, index) {
  const symbol = item.market.symbol;
  const koreanName = marketNameOverrides[symbol] || item.market.korean_name;
  const changeRate = item.ticker.signed_change_rate * 100;
  return {
    rank: index + 1,
    symbol,
    koreanName,
    priceText: formatWon(item.ticker.trade_price, item.ticker.trade_price < 100 ? 2 : 0),
    volumeText: formatVolume(item.ticker.acc_trade_price_24h),
    changeText: `${changeRate >= 0 ? "+" : ""}${changeRate.toFixed(2)}%`
  };
}

async function main() {
  const existing = await loadArticles();
  const ranked = await getRankedMarkets();
  if (!ranked.length) throw new Error("No KRW market ticker found from Upbit.");

  const rankings = ranked.slice(0, 10).map(toRanking);
  if (dryRun) {
    console.log(JSON.stringify({ today, top10: rankings }, null, 2));
    return;
  }

  await mkdir(path.dirname(rankingPath), { recursive: true });
  await writeFile(rankingPath, `${JSON.stringify(rankings, null, 2)}\n`, "utf8");

  const hasToday = existing.some((article) => article.date === today);
  if (hasToday && !force) {
    console.log(`Article for ${today} already exists. Rankings updated.`);
    return;
  }

  const usedSymbols = new Set(existing.filter((article) => force ? article.date !== today : true).map((article) => article.symbol));
  const selectedIndex = ranked.findIndex((item) => !usedSymbols.has(item.market.symbol));
  const selected = selectedIndex >= 0 ? ranked[selectedIndex] : ranked[0];
  const selectedRank = selectedIndex >= 0 ? selectedIndex + 1 : 1;
  const symbol = selected.market.symbol;
  const koreanName = marketNameOverrides[symbol] || selected.market.korean_name;
  const topic = topicParticle(koreanName);
  const changeRate = selected.ticker.signed_change_rate * 100;
  const article = {
    date: today,
    symbol,
    koreanName,
    rank: selectedRank,
    title: `${koreanName}(${symbol}) 업비트 상승률 ${selectedRank}위 리포트`,
    summary: `${koreanName}${topic} 오늘 업비트 KRW 마켓 상승률 ${selectedRank}위입니다. 가격, 거래대금, 단기 체크 포인트를 정리했습니다.`,
    priceText: formatWon(selected.ticker.trade_price, selected.ticker.trade_price < 100 ? 2 : 0),
    volumeText: formatVolume(selected.ticker.acc_trade_price_24h),
    changeText: `${changeRate >= 0 ? "+" : ""}${changeRate.toFixed(2)}%`,
    url: `/posts/${slugFor(today, symbol)}`
  };

  const nextArticles = [article, ...existing.filter((item) => item.date !== today)].slice(0, 365);
  await mkdir(postsDir, { recursive: true });
  await writeFile(path.join(postsDir, slugFor(today, symbol)), buildArticleHtml(article), "utf8");
  await writeFile(articlePath, `${JSON.stringify(nextArticles, null, 2)}\n`, "utf8");
  console.log(`Generated ${article.url}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
