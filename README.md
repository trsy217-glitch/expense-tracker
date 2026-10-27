# 알프스(ALFS) 웹사이트

총판 유통 · 파트너샵 입점 · 소상공인 AI 에이전트 마케팅 컨설팅을 소개하는 멀티페이지 웹앱입니다.
React + Vite + React Router로 만들었고, 서버 없이 Vercel·Netlify에 바로 배포할 수 있습니다.

## 페이지 구성

| 주소 | 메뉴 | 내용 |
| --- | --- | --- |
| `/` | 홈 | 핵심 메시지, 하는 일 3갈래, 재구매 엔진, 제품·채널·AI 마케팅 미리보기 |
| `/company` | 회사 소개 | 문제 → 해법(Sell·Content·Data·Scale), 비교표, 운영 중인 인프라, 약속 |
| `/distribution` | 총판·유통 | 유통 경로, 4개 판매 채널, 90일 파일럿, 성장 로드맵 |
| `/products` | 제품 (오륜미네랄 탭) | 후킹 카피, 원료 순환 이야기, 가문 이력·수상, 섭취법, 제품 정보 |
| `/products/enzyme` | 제품 (효소세상 탭, 준비 중) | 탭만 있는 자리. `src/pages/EnzymeTab.jsx`를 채우면 됩니다 |
| `/video-maker` | 영상 만들기 | 업주가 상품 사진·문구를 넣으면 브라우저에서 바로 홍보영상(MP4/WebM) 생성 · 로그인 없음 |
| `/ai-marketing` | AI 마케팅 | 소상공인 고민, AI 에이전트 6종, 4주 진행 과정, 플랜 3종 |
| `/partner` | 파트너 입점 | 대상 매장, 입점 패키지, 입점 5단계, FAQ, 입점 신청서 |
| `/contact` | 상담 | 채널 목록 + 상담 신청서 |
| `/diagnosis` | 가게 진단 | 무료 진단 소개 (누구나 볼 수 있음) |
| `/login` | 로그인 | 로그인 · 회원가입 · 비밀번호 재설정 |
| `/diagnosis/new` | 진단하기 | 8단계 진단 입력 (로그인 필요) |
| `/diagnosis/result/:id` | 진단 결과 | 점수·강점·없는 것·보완·실행계획·상품군 + PDF/이미지 다운로드 (본인만) |
| `/my` | 내 진단 기록 | 지난 진단 목록과 점수 변화 (본인만) |

모든 페이지 오른쪽 아래에 **상담하기** 버튼이 떠 있고, 누르면 카카오톡·네이버 톡톡·인스타·유튜브·전화·이메일 채널이 열립니다.

## 시작하기

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ 폴더에 배포용 파일 생성
```

## 우리가게 진단 기능

- 사이트 전체는 누구나 볼 수 있고, **진단하기·결과·내 기록만 로그인**이 필요합니다.
- 업종 11개(카페, 건강식품·웰니스샵, 피부·에스테틱, 헬스·필라테스, 식당, 미용실, 스파·찜질, 약국·건강원, 식품 소매, 온라인 셀러, 클래스·공방) 중 하나를 고르면 업종 맞춤 문항 2개가 더해집니다.
- 8단계: 기본 정보 → 시장 상황 → 매출 추이 → 온라인 홍보 → 오프라인 홍보 → 고객 상황 → 상품군 → 내 가게 조건. 대부분 버튼 선택, 일부만 단답.
- 결과: 7개 영역 점수(방사형 차트), 강점 · 없는 것 · 부족해서 보완할 것, 이번 주/한 달/석 달 실행 계획, 시장·매출 요약, 구조 점수, 상품군 분석(입문 상품·재구매·원가 구조·경쟁 + 상품 단계), 미네랄 샵인샵 적합도, 알프스 연결 제안.
- 문항과 점수, 진단 문구는 `src/diagnosis/questions.js`, 분석 규칙은 `src/diagnosis/engine.js`에서 고칩니다.
- 작성 중인 답변은 기기에 자동 임시 저장되고, 결과는 PDF(A4)와 PNG로 내려받을 수 있습니다.

### 로그인·저장 연결

Firebase(Google 계정 로그인 + Firestore)를 씁니다. 설정 방법은 아래 '로그인 · 진단 저장 (Firebase · Google 계정)'을 보세요.

## 오륜미네랄 홍보 영상 (10초 · 5초)

- 오륜미네랄 페이지 첫 화면에서 소리 없이 자동 반복 재생됩니다. 왼쪽 아래 버튼으로 멈출 수 있고, 기기에서 '움직임 줄이기'를 켠 사람에게는 첫 화면만 보입니다.
- 사이트에는 10초 버전이 나옵니다: `public/video/oryun-promo-10s.webm`, `oryun-promo-10s.mp4`, `oryun-promo-poster.webp`
- 배경음악이 들어간 10초 버전: `public/video/oryun-promo-10s-music.mp4` (SNS·카톡 공유·매장 화면용). 음악은 `video/scripts/make-bgm.py`로 직접 합성한 오리지널 음원이라 저작권 걱정 없이 쓸 수 있습니다.
- 5초 버전(`oryun-promo.webm`, `oryun-promo.mp4`)도 함께 있습니다. SNS 광고처럼 짧게 쓸 때 사용하세요.
- 두 버전은 같은 장면이고 길이만 다릅니다. 10초 버전은 문구가 더 천천히 하나씩 나오고, 마무리 문구 때 빛이 한 번 더 지나갑니다.
- 영상 코드: `video/src/OryunPromo.tsx` (Remotion). 문구는 맨 위 `FEATURES`, 색은 `MAIN`·`GOLD` 등에서 바꿉니다.
- 다시 만들기:

```bash
cd video
npm install
npm run studio        # 브라우저에서 미리보기·수정
npm run render        # 10초 MP4
npm run render:webm   # 10초 WebM
npm run render:5s     # 5초 MP4 (render:5s:webm 은 5초 WebM)
npm run bgm           # 배경음악 다시 만들기 (python3, numpy, scipy 필요)
npm run render:music  # 배경음악 넣은 10초 MP4
npm run poster        # 첫 화면 이미지
```

- 병 이미지(`video/public/oryun-bottle.png`)는 제품 사진에서 배경을 지운 것입니다. 더 선명한 누끼 PNG가 있으면 같은 이름으로 바꾸고 `RATIO`(가로÷세로)를 맞추세요.
- 글꼴은 Pretendard(SIL OFL)를 `video/public/fonts`에 넣어 두어 인터넷 없이도 렌더링됩니다.

## 홍보영상 만들기 (`/video-maker`)

- **처음 화면 = 오륜미네랄 샘플**: 처음 만든 홍보영상 파일(`public/video/oryun-promo-10s-music.mp4`, `oryun-promo-10s.webm`)을 그대로 재생합니다. 템플릿으로 다시 그리지 않습니다.
- **새 상품 = 자동생성 템플릿** (`src/videomaker/adScene.js`)
  - 참고 코드(Remotion 6초·1280×720 제품 광고)를 캔버스로 그대로 옮겼습니다. Remotion으로 렌더한 원본과 같은 프레임을 나란히 놓고 확인했습니다.
  - 배경 방사형 그라데이션, 회전 빛줄기, 뒤 큰 영문 글자, 제품 스프링 등장, 착지 번쩍, 빛 쓸기·반짝이, 양옆 큰 문구, 밑줄, 왼쪽 아래 안내가 들어갑니다.
  - 세로 9:16에서는 문구가 제품 위·아래로 갑니다. 10초는 같은 연출을 천천히 늘린 것입니다.
- **자동으로 채워지는 것**
  - 사진을 올리면 누끼를 땁니다(`CutEditor.jsx`, `cutout.js`).
  - 상품 색을 뽑아 배경색을 정합니다(`colorFromImage`). 흰색·회색 위주 상품이면 기본 '숲' 색을 씁니다.
  - 문구 칸을 채웁니다: 작은 글자(NEW), 왼쪽 문구, 오른쪽 문구, 영문 글자, 안내 문구. 다른 문구 조합 3개도 함께 보여 줍니다.
- **문구 생성**
  - 배포 사이트에 `ANTHROPIC_API_KEY`가 있으면 `api/generate-copy.js`가 상품 사진, 설명, 설명서 사진을 Claude에게 보내 문구를 받습니다.
  - 없으면 브라우저 기본 도우미(`copywriter.js`)가 업종을 알아보고 업종별 문구 조합을 넣습니다. 설명서 사진은 OCR(`ocr.js`)로 읽습니다.
  - 효능·질병·최상급 표현은 `copyRules.js`에서 걸러냅니다.
- **누끼 모델 파일**
  - `public/models/isnet-q.00~09.bin`: 정밀 누끼 모델(IS-Net, 8비트로 줄인 것, 합쳐 46MB)을 GitHub 웹 업로드가 막히지 않게 10조각(각 4.6MB)으로 나눈 것입니다. 브라우저가 이어 붙여 씁니다.
  - `public/models/u2netp.onnx`(4.4MB): 예비 모델입니다.
- **글자 읽기(OCR) 파일**: 저장소에 두지 않습니다. tesseract.js 기본값대로 처음 쓸 때 jsDelivr CDN에서 받습니다.
- **영상 속 상품 크기**: 50~150%.
- **음악**: `public/video-maker/bgm-ad-6s.mp3`, `bgm-ad-10s.mp3`. 템플릿 타이밍(착지·문구·밑줄)에 맞춰 `video/scripts/make-ad-bgm.py 6` / `10`으로 만든 오리지널 음원입니다.
- **저장**: '영상 만들기'를 누르면 실제 시간으로 녹화합니다. 크롬·엣지·사파리는 MP4, 파이어폭스는 WebM으로 저장됩니다.

## 로고 · 공유 미리보기(OG)

- 헤더 로고: `public/brand/alfs-mark.webp`(심볼) + `alfs-word.webp`(글자), 하단 로고: `alfs-logo.webp`
- 파비콘: `public/favicon.png`, `apple-touch-icon.png`
- 공유 미리보기 이미지: `public/og-image.jpg` (1200×630, 검정 배경 금빛 로고)
- 카카오톡·페이스북은 OG 이미지를 전체 주소로만 읽습니다. Vercel에서는 운영 도메인이 자동으로 들어가고, 개인 도메인을 쓰면 Vercel 환경 변수에 `VITE_SITE_URL=https://내도메인` 을 넣으세요.
- 카카오톡은 미리보기를 저장해 두므로, 바꾼 뒤에는 [카카오 공유 디버거](https://developers.kakao.com/tool/debugger/sharing)에서 캐시를 지우세요.

## 꼭 바꿔야 할 정보 — `src/config/site.js`

- `company`: 사업자등록번호, 통신판매업 신고번호, 주소, 전화, 이메일 (사이트 하단에 표시. 전자상거래법상 필수)
- `channels`: 카카오톡 채널 채팅 URL(`https://pf.kakao.com/_채널ID/chat`), 네이버 톡톡, 인스타그램, 유튜브 주소. 비워 두면 그 채널은 숨겨집니다.
- `commerce`: 스마트스토어·쿠팡 상품 주소를 넣으면 제품 페이지에 구매 버튼이 생깁니다.
- `formEndpoint`: 상담 신청서를 구글 시트로 받으려면 `docs/google-apps-script.gs` 안내대로 배포한 URL을 넣으세요. 비워 두면 신청 내용을 카카오톡이나 이메일로 보내는 방식으로 동작합니다.

## 배포 (Vercel)

1. GitHub에 이 폴더를 올립니다.
2. vercel.com → New Project → 저장소 선택 → Framework: Vite → Deploy
3. `vercel.json`이 새로고침 시 404를 막아 줍니다.

## 디자인 메모

- 색은 제품 재료에서 가져왔습니다: 누에고치(silk) · 뽕잎(leaf) · 오디(berry) · 미네랄 물방울(drop) · 라벨 금박(gold). 토큰은 `src/styles/global.css` 맨 위에 있습니다.
- 시그니처는 사진을 담는 **누에고치 모양 타원 프레임**(`.cocoon`)입니다. 다른 장식은 줄였습니다.
- 글꼴: 한글 Pretendard, 영문 워드마크·숫자 Unbounded.
- 모션은 페이지 진입 때 한 번만 일어나고, `prefers-reduced-motion` 설정을 따릅니다.

## 광고 문구 주의 (식품표시광고법)

오륜미네랄은 **기타가공품(일반식품)** 입니다. 질병 예방·치료, 뼈·면역·혈액 같은 기능성, 흡수율 비교 표현을 넣지 마세요. 원본 자료에 있던 질병 관련 인용, 증상 목록, 효능 후기는 일부러 제외했습니다. 수상·특허는 오륜미네랄이 아니라 제조사 유디아미네랄의 이력이므로, 나오는 자리마다 '제조사 유디아미네랄'을 함께 표기합니다.

## Claude Code로 이어서 작업하기

이 폴더에서 `claude`를 실행하면 `CLAUDE.md`를 읽고 프로젝트 구조를 이해한 상태로 시작합니다. 예:

- "제품 페이지에 미네랄카페 레시피 섹션을 3개 카드로 추가해줘"
- "상담 신청을 Firestore 에 저장하도록 바꿔줘"
- "효소 제품 페이지를 /product/enzyme 으로 하나 더 만들어줘"


## 로그인 · 진단 저장 (Firebase · Google 계정)

로그인과 회원가입은 **Google 계정 하나로** 합니다. 처음 로그인이 곧 회원가입입니다. 진단 결과는 Firestore `users/{uid}/diagnoses` 에 저장되고, `firestore.rules` 로 본인만 읽고 지울 수 있습니다. Firebase 값이 없으면 '체험 모드'(이 브라우저에만 저장)로 동작합니다.

1. https://console.firebase.google.com 에서 **프로젝트 만들기** (이름 예: alfs)
2. **Authentication → 시작하기 → 로그인 방법 → Google → 사용 설정**, 지원 이메일 선택 → 저장
3. **Authentication → 설정 → 승인된 도메인**에 사이트 주소 추가 (예: `alfs-xxxx.vercel.app`, 나중에 붙일 도메인)
4. **Firestore Database → 데이터베이스 만들기** (위치 `asia-northeast3` 서울, 프로덕션 모드) → **규칙** 탭에 `firestore.rules` 내용을 붙여 넣고 **게시**
5. **프로젝트 설정(톱니) → 내 앱 → 웹(</>) 앱 추가** → 나오는 `firebaseConfig` 값을 Vercel **Settings → Environment Variables** 에 넣기
   - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` (필수)
   - `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID` (선택)
6. Vercel 에서 **Redeploy**

카카오톡 안 브라우저에서는 Google 이 로그인을 막기 때문에, 로그인 화면이 '기본 브라우저로 열기' 버튼을 보여 줍니다.

## 우리가게 진단 — 구조 점수

문항은 24개(업종 맞춤 1개 포함)입니다. 핵심은 "팔수록 남는 사업인가?"를 보는 7문항입니다.

VScore = (품질향상×2.5 + 재구매율×4.5 + 확장성×3.5) ÷ (원가×2.5 + 재고×1 + 유통비×2 + (6−시장성)×4)

- 각 항목은 1~5점입니다. 1.8 이상이면 팔수록 남는 구조, 1.2~1.8은 남는 구조, 0.9~1.2는 본전 구조, 0.9 미만은 팔수록 힘든 구조입니다.
- 리포트에 항목별 점수, 계산식, '한 단계만 바꿨을 때 점수가 가장 많이 오르는 항목 3개'를 보여 줍니다.
- 코드: `src/diagnosis/questions.js`(`VALUE_FACTORS`, 문항), `src/diagnosis/engine.js`(`valueScore`), `src/components/Report.jsx`(`ValueScore`)

## 첫 화면

사이트를 새로 열면 PC·모바일 모두 홈 화면부터 보여 줍니다(`src/components/HomeFirst.jsx`). 특정 페이지로 바로 보내는 홍보 링크는 주소 끝에 `?stay`를 붙이세요. 예: `/video-maker?stay`

## 영업비 정산 (/expense)

영업 담당자가 영수증 사진을 올리고, 대표가 월별로 승인·지급하는 내부 도구입니다. 사이트 메뉴에는 없고 `사이트주소/expense` 로 들어옵니다.

- 로그인: 사이트와 같은 Google 로그인(Firebase). 처음 들어온 담당자는 정산표에 보일 이름을 한 번 적습니다.
- 대표 계정: `firestore.rules` 의 `isExpenseAdmin()` 안 이메일. 바꾼 뒤 Firebase 콘솔 → Firestore → 규칙에 다시 붙여 넣고 게시합니다.
- 영수증 자동 읽기: Vercel 환경 변수 `ANTHROPIC_API_KEY` 가 있으면 `/api/read-receipt` 가 금액·날짜·가게·항목을 채웁니다. 없으면 직접 입력합니다.
- 영수증 사진은 1280px JPEG(약 190KB)로 줄여 Firestore `claims/{uid}/receipts/{id}` 에 저장합니다 (Firebase Storage 불필요).
- 담당자는 '확인 대기'로만 올리고 대기 중일 때만 삭제할 수 있습니다. 승인·반려·지급 완료는 대표만 바꿉니다.
