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
```

## 🔄 CI/CD 설정

### GitHub Secrets 설정

GitHub 저장소의 Settings > Secrets and variables > Actions에서 다음 환경변수를 설정해주세요:

#### 🔑 필수 환경변수

```bash
# AWS 인증 정보
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-northeast-2

# S3 및 CloudFront 설정
S3_BUCKET_NAME=your-s3-bucket-name
CLOUDFRONT_DISTRIBUTION_ID=your-cloudfront-distribution-id
CLOUDFRONT_DOMAIN=your-domain.com
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
