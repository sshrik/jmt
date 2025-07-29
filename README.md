# 🚀 JMT (Just Make Trading)

> **투자 전략 백테스트 플랫폼**  
> 노코드 환경에서 투자 전략을 설계하고, 30년 히스토리 데이터로 백테스트하는 플랫폼

[![CI Status](https://github.com/sshrik/jmt/workflows/🧪%20Continuous%20Integration/badge.svg)](https://github.com/sshrik/jmt/actions)
[![Deploy Status](https://github.com/sshrik/jmt/workflows/🚀%20Deploy%20Production/badge.svg)](https://github.com/sshrik/jmt/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![Mantine](https://img.shields.io/badge/Mantine-v7-339af0)](https://mantine.dev/)

## 🎯 플랫폼 개요

JMT는 개인 투자자를 위한 **노코드 투자 전략 설계 및 백테스트 플랫폼**입니다. 복잡한 프로그래밍 지식 없이도 직관적인 UI를 통해 투자 전략을 설계하고, 과거 데이터를 활용한 백테스트로 전략의 유효성을 검증할 수 있습니다.

### ✨ 주요 기능

- **🎨 이중 전략 에디터**: 룰 기반 + 플로우차트 방식
- **📊 30년 히스토리 데이터**: Yahoo Finance 연동 실제 주식 데이터
- **🧪 자동 백테스트**: 수수료, 슬리피지 반영한 정확한 시뮬레이션
- **📈 성과 대시보드**: 실제 백테스트 결과 기반 프로젝트 순위
- **🌙 다크모드**: 완전한 테마 시스템 지원
- **💾 데이터 영속성**: 로컬 스토리지 + 백업/복원 기능
- **🗂️ 버전 관리**: Git과 유사한 전략 버전 관리 시스템

## 🏗️ 기술 스택

### Frontend

- **React 18** + **TypeScript** + **Vite**
- **Mantine UI v7** (테마 시스템)
- **React Flow** (플로우차트 에디터)
- **Recharts** (차트 및 시각화)
- **TanStack Router** (라우팅)

### Data & APIs

- **Yahoo Finance** (yahoo-finance2)
- **Local Storage** (데이터 영속성)
- **AWS S3 + CloudFront** (배포)

### Development & CI/CD

- **ESLint** + **TypeScript** (코드 품질)
- **GitHub Actions** (CI/CD)
- **Angular 커밋 컨벤션**

## 🚀 빠른 시작

### 1️⃣ 개발 환경 설정

```bash
# 저장소 클론
git clone https://github.com/sshrik/jmt.git
cd jmt

# Node.js 20+ 버전 설정 (nvm 사용)
nvm use  # .nvmrc 파일 기반 자동 설정
# 또는 수동으로 버전 지정
nvm use 20
# 또는 최신 LTS 설치
nvm install --lts
nvm use --lts

# 의존성 설치 (Node.js 20+ 필요)
yarn install

# 개발 서버 실행
yarn dev
```

### 2️⃣ 사용 가능한 스크립트

```bash
# 개발 서버 실행
yarn dev

# 프로덕션 빌드
yarn build

# 타입 체크
yarn tsc --noEmit

# ESLint 검사
yarn lint

# 프리뷰 (빌드 후)
yarn preview

# 테스트 실행
yarn test
```

### 3️⃣ 테스트 시스템

JMT는 **TypeScript 기반의 포괄적인 테스트 스위트**를 제공합니다:

```bash
# 전체 테스트 실행 (기본 + 종합)
yarn test

# 개별 테스트 실행
npx tsx tests/backtest.test.ts        # 기본 백테스트 테스트
npx tsx tests/comprehensive.test.ts   # 종합 테스트
```

#### 📁 테스트 구조

```
tests/
├── utils/
│   ├── mockData.ts          # 테스트용 주가 데이터
│   ├── testHelpers.ts       # 조건/액션 실행 함수
│   └── formulaCalculator.ts # 수식 계산기
├── backtest.test.ts         # 기본 백테스트 테스트
└── comprehensive.test.ts    # 종합 테스트 (모든 조건/액션)
```

#### ✅ 테스트 커버리지

- **📋 조건 타입 (4/4)**: `always`, `close_price_change`, `high_price_change`, `low_price_change`
- **🎯 액션 타입 (14/14)**: 모든 매수/매도/수식 기반 액션
- **🧮 수식 계산**: 양수/음수/절댓값 케이스, 동적 매매
- **🔄 복합 시나리오**: 연속 거래, 포트폴리오 추적
- **⚠️ 에러 처리**: 자금 부족, 잘못된 파라미터

## 🔄 CI/CD 설정

### GitHub Variables 설정

GitHub 저장소의 **Settings > Secrets and variables > Actions > Variables**에서 다음 환경변수를 설정해주세요:

#### 🔑 필수 환경변수

**Variables (일반 환경변수)**

```bash
# AWS 리전
AWS_REGION=ap-northeast-2

# S3 및 CloudFront 설정
S3_BUCKET_NAME=your-s3-bucket-name
CLOUDFRONT_DISTRIBUTION_ID=your-cloudfront-distribution-id
CLOUDFRONT_DOMAIN=your-domain.com
```

**Secrets (민감한 정보)**

```bash
# AWS 인증 정보
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

#### 🛠️ AWS 설정 가이드

1. **S3 버킷 생성**

   ```bash
   # AWS CLI로 S3 버킷 생성
   aws s3 mb s3://your-bucket-name

   # 정적 웹사이트 호스팅 활성화
   aws s3 website s3://your-bucket-name \
     --index-document index.html \
     --error-document index.html
   ```

2. **CloudFront 배포 생성**
   - Origin: S3 버킷
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Compress Objects: Yes
   - Price Class: Use Only U.S., Canada and Europe

3. **IAM 사용자 권한**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:PutObjectAcl",
           "s3:GetObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::your-bucket-name",
           "arn:aws:s3:::your-bucket-name/*"
         ]
       },
       {
         "Effect": "Allow",
         "Action": [
           "cloudfront:CreateInvalidation",
           "cloudfront:GetInvalidation"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

### 🔄 워크플로우 설명

#### 1. **CI (Continuous Integration)**

- **트리거**: Push to main/develop, Pull Request
- **작업**: 빌드, 린트, 타입 체크, 보안 감사
- **결과**: 코드 품질 보장

#### 2. **Preview Deployment**

- **트리거**: Pull Request 생성/업데이트
- **작업**: 프로덕션 빌드 + S3 업로드 (프리뷰 경로) + CloudFront 무효화
- **결과**: PR 댓글에 프리뷰 링크 자동 생성
- **환경**: Production S3 + CloudFront
- **URL 형식**: `https://your-domain.com/pr-{number}/`

#### 3. **Production Deployment**

- **트리거**: Push to main 브랜치
- **작업**: 프로덕션 빌드 + 루트 경로 배포 + 헬스 체크
- **결과**: 라이브 사이트 업데이트
- **환경**: Production S3 + CloudFront
- **URL**: `https://your-domain.com/`

## 📁 프로젝트 구조

```
src/
├── 📄 routes/              # 페이지 컴포넌트
│   ├── __root.tsx         # 루트 레이아웃
│   ├── index.tsx          # 대시보드
│   ├── projects/          # 프로젝트 관련 페이지
│   ├── settings.tsx       # 환경설정
│   └── flowchart.tsx      # 주식 추이 확인
├── 🧩 components/         # 재사용 컴포넌트
│   ├── layout/           # 레이아웃 컴포넌트
│   ├── strategy/         # 전략 에디터
│   └── backtest/         # 백테스트 시스템
├── 🗄️ stores/            # 상태 관리
├── 🔗 hooks/             # 커스텀 훅
├── 🛠️ utils/             # 유틸리티 함수
└── 📏 types/             # TypeScript 타입 정의
```

## 🗂️ 버전 관리 시스템

JMT는 Git과 유사한 **전략 버전 관리 시스템**을 제공합니다. 전략을 수정할 때마다 버전을 생성하고, 이전 버전으로 되돌릴 수 있습니다.

### ✨ 주요 기능

#### 📝 **자동/수동 버전 생성**

```typescript
// 자동 버전 생성 (변경사항이 있을 때만)
const autoVersion = VersionStore.createAutoVersionIfChanged(
  project,
  strategy,
  "조건 블록 추가"
);

// 수동 버전 생성
const version = VersionStore.createVersion(project, strategy, {
  description: "새로운 매매 전략 v2.0",
  author: "사용자",
  isAutoSaved: false,
});
```

#### 🔍 **버전 비교 및 차이점 추적**

```typescript
const comparison = VersionStore.compareVersions(version1, version2);
console.log(comparison.hasChanges); // true/false
console.log(comparison.strategyChanges); // 변경사항 배열
```

#### ↩️ **버전 되돌리기**

```typescript
const revertedVersion = VersionStore.revertToVersion(
  project,
  targetVersionId,
  "이전 전략으로 되돌리기"
);
```

#### 🛠️ **유틸리티 함수들**

```typescript
// 최신 버전 가져오기
const latest = VersionStore.getLatestVersion(project);

// 백테스트 결과가 있는 버전들
const tested = VersionStore.getVersionsWithBacktest(project);

// 자동 저장 버전 정리 (최신 10개만 유지)
const cleaned = VersionStore.cleanupAutoSavedVersions(project, 10);
```

### 🖥️ **UI 컴포넌트**

#### 버전 목록 (`VersionList`)

- 📊 버전별 백테스트 성과 표시
- 🏷️ 자동저장/수동저장 구분
- ⏰ 상대적 시간 표시 ("3분 전", "어제")
- 🎯 버전별 액션 (전환, 되돌리기, 복제, 삭제)

#### 버전 생성 모달 (`CreateVersionModal`)

- 📝 버전 설명 및 작성자 입력
- ⚠️ 변경사항 없음 경고
- 🤖 자동 저장 옵션
- 🧪 백테스트 자동 실행 옵션

#### 버전 비교 (`VersionComparison`)

- 📊 변경사항 시각화 (추가/제거/수정)
- 📋 상세 차이점 표시
- 🔍 JSON 뷰어로 전략 구조 비교

### 🏷️ **버전 네이밍**

- **자동 생성**: `v0.1`, `v0.2`, `v1.0`, `v1.1` ...
- **시맨틱 버전**: 최신 버전 + 0.1씩 증가
- **중복 방지**: 기존 버전명과 중복되지 않도록 자동 처리

### 📈 **실사용 예시**

```typescript
// 1. 전략 에디터에서 조건 블록 추가
// → 자동 버전 생성: "v1.1"

// 2. 백테스트 실행
// → 버전에 백테스트 결과 저장

// 3. 전략 수정 후 수동 버전 생성
const newVersion = VersionStore.createVersion(project, strategy, {
  description: "RSI 지표 추가 및 수익률 개선",
  author: "트레이더",
  shouldRunBacktest: true,
});

// 4. 이전 성과가 좋았던 v1.0으로 되돌리기
const revertedVersion = VersionStore.revertToVersion(
  project,
  "version-1.0-id",
  "수익률이 좋았던 v1.0으로 복원"
);
```

## 🎨 사용자 가이드

### 1️⃣ 프로젝트 생성

1. 대시보드에서 "새 프로젝트" 클릭
2. 프로젝트 이름과 설명 입력
3. 자동으로 편집 페이지로 이동

### 2️⃣ 전략 설계

- **룰 기반**: 조건-액션 쌍으로 논리적 구성
- **플로우차트**: 드래그앤드롭으로 시각적 설계
- **실시간 동기화**: 두 방식 간 자동 변환

### 3️⃣ 백테스트 실행

1. "백테스트" 탭 이동
2. 종목, 기간, 초기 투자금 설정
3. "백테스트 실행" 클릭
4. 결과 자동 저장 및 대시보드 반영

## 🤝 기여하기

### 📋 Pull Request 가이드

1. **브랜치 생성**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **개발 및 테스트**

   ```bash
   # 개발 진행
   yarn dev

   # 커밋 전 검사
   yarn tsc --noEmit
   yarn lint
   yarn build
   ```

3. **커밋 컨벤션**

   ```bash
   # Angular 스타일 커밋 메시지
   git commit -m "feat(component): add new feature description"
   git commit -m "fix(bug): resolve issue with specific component"
   git commit -m "docs(readme): update installation guide"
   ```

4. **Pull Request 생성**
   - PR 템플릿을 따라 상세히 작성
   - CI 통과 확인
   - 프리뷰 링크에서 동작 검증

### 🎯 커밋 타입

- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드 시스템 수정

## 📊 릴리즈 정보

### 🎉 v1.0.0 (2024.12.18)

- 완전한 투자 전략 플랫폼 출시
- 이중 에디터 시스템 (룰 기반 + 플로우차트)
- 30년 히스토리 데이터 지원
- 자동 백테스트 결과 저장
- 다크모드 완전 지원

자세한 내용은 [FEATURE_SPEC.md](./FEATURE_SPEC.md)를 참조하세요.

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](./LICENSE) 파일을 참조하세요.

## 👨‍💻 개발자

**[@sshrik](https://github.com/sshrik)**

- GitHub: https://github.com/sshrik
- 이메일: sshrik@example.com

---

## 🔗 관련 링크

- [📚 사용자 가이드](./FEATURE_SPEC.md)
- [🐛 이슈 신고](https://github.com/sshrik/jmt/issues)
- [🔄 기여하기](https://github.com/sshrik/jmt/pulls)
- [📊 프로젝트 보드](https://github.com/sshrik/jmt/projects)

**JMT와 함께 더 나은 투자 전략을 만들어보세요!** 🚀✨
