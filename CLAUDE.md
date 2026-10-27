# 알프스(ALFS) 웹사이트 — Claude Code 작업 안내

## 프로젝트
- 회사: 알프스 / ALFS(Alpha Food Store), 대표 이소영, 개인사업자
- 사업: 미네랄·건강식품 총판 유통(샵인샵 파트너샵 공급) + 소상공인 SNS·AI 에이전트 자동화 마케팅 컨설팅
- 첫 제품: 오륜미네랄 (제조 유디아미네랄, 기타가공품 1,000ml)
- 대상: 20~30대도 좋아할 세련된 톤, 파트너샵 원장·셀러·소비자

## 구조
- `src/config/site.js` — 연락처·채널·사업자 정보·폼 수신 주소. 하드코딩하지 말고 여기서 읽을 것
- `src/pages/*` — 라우트별 페이지 (App.jsx에서 연결)
- `src/components/` — Header(메뉴 탭), Footer, ConsultSheet(플로팅 상담), ChannelList, ConsultForm, CtaBand, EngineLoop(SVG)
- `src/styles/global.css` — 디자인 토큰과 전체 스타일 (CSS 변수, 프레임워크 없음)
- `src/lib/asset.js` — public 파일 경로는 반드시 `asset('images/x.webp')`로 (미리보기 빌드의 상대 경로 대응)
- 이미지: `public/images/*.webp`
- 우리가게 진단: `src/diagnosis/questions.js`(24문항 · 구조 점수 7요소 `VALUE_FACTORS` · 업종별 맞춤 1문항), `src/diagnosis/engine.js`(구조 점수 `valueScore` = (품질향상×2.5+재구매율×4.5+확장성×3.5)÷(원가×2.5+재고×1+유통비×2+(6−시장성)×4), 영역 점수·강점·없는 것·보완·실행 계획·상품군·미네랄 적합도)
- 로그인·저장: Firebase. `src/lib/firebase.js`(설정, `VITE_FIREBASE_*`), `src/lib/auth.jsx`(Google 로그인 · 값이 없으면 체험 모드), `src/lib/store.js`(Firestore `users/{uid}/diagnoses`), `firestore.rules`(본인만 접근)
- 첫 화면: 새로 열면 항상 홈(`src/components/HomeFirst.jsx`, `?stay`로 예외)
- 보호 화면: `RequireAuth`로 감싼 `/diagnosis/new`, `/diagnosis/result/:id`, `/my`. 나머지 페이지는 공개
- 제품: `/products`(오륜미네랄) · `/products/enzyme`(효소세상, 준비 중). 탭 목록은 `src/components/ProductTabs.jsx`
- 첫 화면 3D 'ALFS': `src/components/Alfs3D.jsx` (@remotion/svg-3d-engine 으로 글자에 두께를 주고 회전, 브라우저 애니메이션·동작 줄이기 설정 시 정지)
- 로고·OG: `public/brand/*`, `public/og-image.jpg`, 주소는 `vite.config.js`의 `__SITE_URL__` 치환
- 홍보 영상: `video/`(Remotion 별도 프로젝트) → 결과물 `public/video/*` → `src/components/PromoVideo.jsx`가 오륜미네랄 첫 화면에 재생
- 영상 만들기: `/video-maker` → 첫 화면은 오륜미네랄 샘플 영상 파일(`public/video/*`) 그대로. 새 상품은 `src/videomaker/adScene.js`(참고 코드 제품 광고 템플릿을 캔버스로 옮김), `CutResult.jsx`+`cutout.js`(자동 누끼, 결과만 표시), `ocr.js`(설명서 사진 글자), `recorder.js`, `saveFile.js`(PC 다른 이름으로 저장 · 휴대폰 공유 창 저장), `copywriter.js`(기본 도우미) + `api/generate-copy.js`(Claude, `ANTHROPIC_API_KEY`) + `copyRules.js`(금지어·글자수·AI 지시문). 템플릿 타이밍을 바꾸면 `video/scripts/make-ad-bgm.py`로 음악도 다시 만든다
- 영업비 정산: `/expense` (사이트 메뉴·푸터 없이 앱 화면만, App.jsx에서 분기). `src/pages/Expense.jsx` + `src/styles/expense.css`(남색 톤 전용 토큰 `--x*`, 사용자 요청) + `src/lib/expenseStore.js`(Firestore `claims/{uid}`, `items`, `receipts`) + `api/read-receipt.js`(영수증 자동 읽기, `ANTHROPIC_API_KEY`). 대표 계정은 `firestore.rules`의 `isExpenseAdmin()` 이메일 목록으로 정한다
- 다운로드: `src/lib/download.js` (html2canvas + jsPDF, 버튼을 누를 때만 불러옴)

## 규칙
- 오륜미네랄 문구에 질병 예방·치료, 기능성 효능, 흡수율 비교, 효능 후기 금지 (식품표시광고법). 수상·특허·가문 이력은 제품(오륜미네랄)이 아니라 **제조사 유디아미네랄**의 것이다. 수상·특허가 나오는 모든 자리(배지, 영상, 이력, 상세페이지) 바로 옆에 '제조사 유디아미네랄' 표기를 함께 둔다. '개발사', '~기준' 같은 모호한 표현은 쓰지 않는다
- 공급가·판매장려금 금액 같은 거래 조건은 공개 페이지에 쓰지 않고 "상담 시 안내"로 둔다 (계약서 비밀유지 조항)
- 새 색을 만들지 말고 :root 토큰을 쓴다. 사진은 `.cocoon` 프레임 안에 넣는다
- 대문자 영문 라벨, 문장마다 붙는 화살표, 모든 섹션 페이드인 같은 장식은 넣지 않는다
- 모바일(390px)과 키보드 포커스를 항상 확인한다
- 진단 결과는 본인만 본다. 관리자 열람 기능을 만들 때는 별도 동의와 정책이 먼저 필요하다
- 영상 문구도 같은 광고 기준을 따른다. 영상을 바꾸면 webm·mp4·poster 세 파일을 모두 다시 만든다
- 진단 문구에도 미네랄 효능 표현 금지. 점수는 '참고용 자가진단'이라는 안내를 유지한다

## 명령
- `npm run dev` 개발 서버 · `npm run build` 배포 빌드 · `npm run build:preview` 해시 라우터 정적 미리보기
