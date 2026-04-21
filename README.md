# 알트코인 리포트 코리아

업비트 KRW 마켓 상승률 순위를 기준으로 매일 하나의 코인 리포트를 생성하는 Netlify용 정적 사이트입니다.

## 로컬 확인

```powershell
python -m http.server 4173
```

브라우저에서 `http://localhost:4173/`을 열면 됩니다.

## 일일 글 생성

```powershell
npm.cmd run generate
```

스크립트는 업비트 API에서 KRW 마켓 티커를 가져오고, 기존에 발행된 코인을 제외한 상위 상승률 코인 1개를 `posts/`에 HTML로 생성합니다. 홈 화면은 `data/articles.json`의 최신 3개 글과 `data/rankings.json`의 상승률 Top 10을 보여줍니다.

## GitHub Actions

`.github/workflows/daily-upbit-post.yml`이 매일 한국시간 오전 9시 10분에 실행됩니다. 생성된 `data/articles.json`, `posts/*.html` 변경분은 자동 커밋됩니다.

## Netlify

Netlify에서 이 저장소를 연결하고 publish directory를 `.`으로 두면 됩니다. `netlify.toml`에 같은 설정이 들어 있습니다.

## 레퍼럴 링크 교체

`referral.html`의 아래 placeholder를 실제 링크로 바꿔야 합니다.

- `YOUR_BINANCE_REF`
- `YOUR_OKX_REF`

이미지 파일은 루트의 `futuressign.webp`, `binance-event-link.webp`, `okx-event-link.webp`를 사용합니다.
