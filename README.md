# 알프스 영업비 정산

영업 담당자가 영수증 사진을 올리면 금액·날짜·항목이 채워지고, 대표가 월별로 승인·지급하는 휴대폰용 앱입니다.
알프스 웹사이트와 별개로, 따로 배포해 씁니다.

- 담당자: 영수증 사진(촬영·캡처) 올리기 → 금액·항목 확인 → 저장. 이번 달 합계와 건별 상태(확인 대기·승인·반려·지급 완료)를 봅니다.
- 대표: '전체 정산' 탭에서 사람별·항목별 합계, 건별 승인·반려·지급 완료, 일괄 처리, 월별 정산표(CSV) 내려받기.
- 항목: 주차비, 유류·교통, 식대, 접대비, 물품비, 홍보비, 택배·퀵, 세미나·행사, 숙박, 기타 (`src/App.jsx` 의 `CATS` 에서 바꿉니다)

## 처음 한 번 설정

### 1. Firebase 프로젝트 (무료 요금제로 충분)
1. https://console.firebase.google.com → 프로젝트 추가 (예: alfs-expense)
2. Authentication → 시작하기 → 로그인 방법 → **Google** 사용 설정
3. Firestore Database → 데이터베이스 만들기 (위치 asia-northeast3 서울) → **규칙** 탭에 `firestore.rules` 내용을 통째로 붙여 넣고 게시
   - 규칙 안 `isAdmin()` 의 이메일이 대표 계정입니다. 다른 Google 계정을 쓰면 바꿔서 게시하세요.
4. 프로젝트 설정 → 일반 → 내 앱 → 웹 앱(</>) 추가 → 나오는 `firebaseConfig` 값을 아래 Vercel 환경 변수에 넣습니다.

### 2. GitHub 저장소
GitHub에서 새 저장소(예: alfs-expense)를 만들고, 이 폴더 안의 파일·폴더를 전부 올립니다 (Add file → Upload files 에 끌어다 놓기).

### 3. Vercel 배포
1. https://vercel.com → Add New → Project → 위 저장소 Import (Framework: Vite 자동 인식, Root Directory 는 비워 둠)
2. Environment Variables 에 추가
   - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - 선택: `ANTHROPIC_API_KEY` (영수증 자동 읽기. 없으면 금액을 직접 입력)
3. Deploy → 나온 주소(예: alfs-expense.vercel.app)를 Firebase → Authentication → 설정 → **승인된 도메인**에 추가

### 4. 담당자에게 안내
- 주소를 보내고 각자 Google 계정으로 로그인. 처음 한 번 정산표에 보일 이름을 적습니다.
- 휴대폰 브라우저 메뉴에서 '홈 화면에 추가'를 누르면 앱 아이콘으로 바로 열립니다.
- 카카오톡 안에서 열면 Google 로그인이 막히므로 '기본 브라우저로 열기'를 누릅니다.

## 동작 방식
- Firebase 값이 없으면 체험 모드(이 브라우저에만 저장)로 동작합니다.
- 영수증 사진은 1280px JPEG(약 190KB)로 줄여 Firestore `claims/{uid}/receipts/{id}` 에 저장합니다. Firebase Storage(유료 요금제 필요)는 쓰지 않습니다.
- 담당자는 '확인 대기'로만 올리고 대기 중일 때만 삭제할 수 있습니다. 상태 변경은 대표만 할 수 있도록 서버 규칙으로 막혀 있습니다.
- 영수증 자동 읽기: `api/read-receipt.js` (Vercel 서버리스 함수, 모델 기본값 claude-haiku-5-5, `ANTHROPIC_MODEL` 로 변경)

## 개발
`npm install` → `npm run dev` (로컬) · `npm run build` (배포 빌드)
