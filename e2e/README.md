# E2E 테스트 가이드

## 테스트 실행 방법

### 기본 테스트 실행
```bash
# 모든 E2E 테스트 실행
yarn test:e2e

# 특정 브라우저에서만 실행
yarn test:e2e --project=chromium

# UI 모드로 실행 (시각적으로 테스트 확인)
yarn test:e2e:ui

# 헤드리스 모드 해제 (브라우저 창 보기)
yarn test:e2e --headed

# 특정 테스트 파일만 실행
yarn test:e2e e2e/simple.spec.ts

# 테스트 결과 리포트 보기
yarn test:e2e:report
```

### 디버깅
```bash
# 디버그 모드로 실행
yarn test:e2e --debug

# 스테핑 모드 (한 단계씩 실행)
yarn test:e2e --headed --slowMo=1000
```

## 테스트 파일 설명

### `simple.spec.ts`
- 기본적인 페이지 로딩과 네비게이션 테스트
- 애플리케이션이 정상적으로 시작되는지 확인

### `navigation.spec.ts`
- 사이드바 네비게이션 기능 테스트
- 각 페이지로의 이동 확인

### `project-management.spec.ts`
- 프로젝트 생성, 수정, 삭제 기능 테스트
- 버전 관리 기능 테스트

### `backtest.spec.ts`
- 백테스트 설정 및 실행 테스트
- 백테스트 결과 확인 및 이력 관리

### `strategy-editor.spec.ts`
- ReactFlow 기반 전략 편집기 테스트
- 노드 추가, 연결, 수정 기능

### `dashboard.spec.ts`
- 대시보드 표시 및 성능 지표 테스트
- 프로젝트 정렬 및 필터링 기능

## 테스트 작성 가이드

### 좋은 셀렉터 사용
```typescript
// 좋음: data-testid 사용
await page.locator('[data-testid="project-card"]')

// 피하기: 텍스트 기반 (변경될 수 있음)
await page.locator('text=프로젝트 카드')
```

### 안정적인 테스트 작성
```typescript
// 요소가 보일 때까지 기다리기
await expect(page.locator('[data-testid="result"]')).toBeVisible()

// 네트워크 응답 기다리기
await page.waitForResponse(response => response.url().includes('/api/'))

// 적절한 타임아웃 설정
await page.waitForSelector('[data-testid="data"]', { timeout: 10000 })
```

## 주의사항

1. **개발 서버 실행**: 테스트 실행 전에 `yarn dev`로 개발 서버가 실행 중이어야 합니다.
2. **포트 설정**: 기본적으로 `http://127.0.0.1:5173`을 사용합니다.
3. **localStorage**: 일부 테스트는 localStorage를 클리어하므로 실제 데이터에 영향을 줄 수 있습니다.
4. **병렬 실행**: CI 환경에서는 테스트가 순차적으로 실행됩니다.

## 문제 해결

### 테스트 실패 시
1. 스크린샷 확인: `test-results/` 폴더
2. 비디오 확인: 실패한 테스트의 비디오 파일
3. trace 확인: `yarn test:e2e:report`에서 trace 보기

### 성능 이슈
- `--workers=1` 옵션으로 병렬 실행 비활성화
- `--timeout=60000` 옵션으로 타임아웃 증가