# 웹 시뮬레이터 기동 가이드

## 사전 요구사항

| 항목 | 버전 |
|------|------|
| Node.js | 20 이상 |
| pnpm | 9 이상 |

pnpm이 없으면 먼저 설치:
```bash
npm install -g pnpm
```

---

## 기동 명령어

### 전체 동시 실행 (권장)

```bash
cd projects/web-simulator
pnpm install        # 최초 1회 또는 패키지 변경 시
pnpm dev            # 프론트(5173) + 백엔드(3001) 동시 실행
```

브라우저에서 `http://localhost:5173` 접속

---

### 개별 실행

```bash
# 백엔드만 (포트 3001)
pnpm --filter server dev

# 프론트엔드만 (포트 5173)
pnpm --filter @sim/app dev
```

---

### 프로덕션 빌드

```bash
# 전체 패키지 빌드
pnpm build

# 빌드 결과물로 프론트 미리보기
pnpm --filter @sim/app preview   # http://localhost:4173

# 빌드된 서버 실행
pnpm --filter server start       # http://localhost:3001
```

---

### 타입 검사

```bash
# 전체 패키지 타입 검사
pnpm lint

# 패키지별 타입 검사
pnpm --filter @sim/elements lint
pnpm --filter @sim/engine lint
pnpm --filter @sim/app lint
pnpm --filter server lint
```

---

## 포트 정리

| 프로세스 | 포트 | URL |
|---------|------|-----|
| 프론트엔드 (Vite) | 5173 | http://localhost:5173 |
| 백엔드 (Express) | 3001 | http://localhost:3001/api/health |
| 프론트 빌드 미리보기 | 4173 | http://localhost:4173 |

> 프론트엔드의 `/api/*` 요청은 Vite proxy를 통해 자동으로 3001 포트로 전달됩니다.

---

## 패키지 구조

```
web-simulator/
├── package.json            # 루트 — dev/build/lint 스크립트
├── pnpm-workspace.yaml     # monorepo 패키지 등록
├── packages/
│   ├── elements/           # @sim/elements  — Lit Web Components (부품)
│   ├── sim-engine/         # @sim/engine    — 시뮬레이션 엔진 (Web Worker)
│   └── app/                # @sim/app       — 프론트엔드 SPA (Vite)
└── server/                 # server         — Express REST API
```

---

## 자주 쓰는 명령어 요약

```bash
pnpm install                      # 의존성 설치
pnpm dev                          # 개발 서버 전체 기동
pnpm build                        # 전체 빌드
pnpm lint                         # 전체 타입 검사
pnpm --filter <패키지명> <스크립트>  # 특정 패키지만 실행
```

패키지명 목록: `server` / `@sim/app` / `@sim/elements` / `@sim/engine`
