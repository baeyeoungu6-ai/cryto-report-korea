const dateFormatter = new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" });

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path} not found`);
  return response.json();
}

function renderReportCards(articles, limit = 3) {
  const grid = document.querySelector("#reportGrid");
  if (!grid) return;

  const selected = articles.slice(0, limit);
  if (!selected.length) return;

  grid.innerHTML = selected
    .map((article) => {
      const date = dateFormatter.format(new Date(article.date));
      return `
        <a class="report-card" href="${article.url}">
          <div>
            <div class="report-meta">
              <span>${date}</span>
              <span>${article.symbol}</span>
              <span>업비트 ${article.rank}위</span>
            </div>
            <h3>${article.title}</h3>
            <p>${article.summary}</p>
          </div>
          <div class="metric-list">
            <div>현재가 <span>${article.priceText}</span></div>
            <div>24시간 거래대금 <span>${article.volumeText}</span></div>
            <div>24시간 등락률 <span>${article.changeText}</span></div>
          </div>
        </a>
      `;
    })
    .join("");
}

function renderFeaturedReport(articles) {
  const featured = document.querySelector("#featuredReport");
  if (!featured) return;

  const article = articles[0];
  if (!article) {
    featured.innerHTML = `
      <span class="featured-label">오늘의 리포트</span>
      <p>아직 발행된 리포트가 없습니다.</p>
    `;
    return;
  }

  featured.innerHTML = `
    <a href="${article.url}">
      <span class="featured-label">오늘의 리포트</span>
      <strong>${article.koreanName} (${article.symbol})</strong>
      <span>업비트 상승률 ${article.rank}위 · ${article.changeText} · 거래대금 ${article.volumeText}</span>
    </a>
  `;
}

function renderReportTable(articles) {
  const table = document.querySelector("#reportsTable");
  if (!table) return;

  if (!articles.length) {
    table.innerHTML = `<div class="empty-state"><h3>발행된 리포트가 없습니다.</h3><p>일일 생성 작업이 실행되면 목록이 채워집니다.</p></div>`;
    return;
  }

  table.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>발행일</th>
          <th>업비트 순위</th>
          <th>코인</th>
          <th>현재가</th>
          <th>24시간 거래대금</th>
          <th>등락률</th>
        </tr>
      </thead>
      <tbody>
        ${articles
          .map(
            (article) => `
              <tr>
                <td>${dateFormatter.format(new Date(article.date))}</td>
                <td>${article.rank}위</td>
                <td><a href="${article.url}">${article.koreanName} (${article.symbol})</a></td>
                <td>${article.priceText}</td>
                <td>${article.volumeText}</td>
                <td>${article.changeText}</td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderRankList(rankings) {
  const list = document.querySelector("#rankList");
  if (!list) return;

  if (!rankings.length) {
    list.innerHTML = `<div class="rank-placeholder">순위 데이터가 아직 없습니다.</div>`;
    return;
  }

  list.innerHTML = rankings
    .slice(0, 10)
    .map((item) => {
      return `
        <div class="rank-row">
          <span class="rank-index">${item.rank}</span>
          <div class="coin-name">
            <strong>${item.koreanName}</strong>
            <span>${item.symbol}</span>
          </div>
          <div class="rank-metrics">
            <strong>${item.changeText}</strong>
            <span>거래대금 ${item.volumeText}</span>
          </div>
          <div class="rank-price">
            <span>현재가</span>
            <strong>${item.priceText}</strong>
          </div>
        </div>
      `;
    })
    .join("");
}

async function init() {
  try {
    const articles = await fetchJson("/data/articles.json");
    renderFeaturedReport(articles);
    renderReportCards(articles, document.body.dataset.reportLimit ? Number(document.body.dataset.reportLimit) : 3);
    renderReportTable(articles);
  } catch (error) {
    console.warn(error);
  }

  try {
    const rankings = await fetchJson("/data/rankings.json");
    renderRankList(rankings);
  } catch (error) {
    console.warn(error);
  }
}

init();
