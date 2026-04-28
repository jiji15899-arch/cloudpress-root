# CloudPress — WordPress Hosting on Cloudflare Workers

Enterprise-grade WordPress hosting platform built on Cloudflare's global network.

## 아키텍처

```
사용자 브라우저
     │
     ▼
Cloudflare Anycast (전세계 300+ PoP)
     │
     ├── app.cloudpress.app  →  대시보드 Worker (handleDashboard)
     ├── admin.cloudpress.app →  관리자 Worker (handleAdmin)
     └── *.yourdomain.com   →  WordPress Site Worker (handleWordPress)
                                    │
                              ┌─────┴──────┐
                              │            │
                           D1 DB      Supabase Storage
                        (WordPress    (미디어/파일/테마)
                         데이터)
                              │
                           KV Store
                         (캐시/세션/설정)
```

## 시작하기

### 1. 필수 조건
- Cloudflare 계정 (Workers Paid Plan 권장)
- Wrangler CLI 설치: `npm install -g wrangler`
- Node.js 18+

### 2. D1 데이터베이스 생성
```bash
wrangler d1 create cloudpress-main
```
출력된 `database_id`를 `wrangler.toml`의 `database_id`에 입력.

### 3. KV Namespace 생성
```bash
wrangler kv:namespace create KV
wrangler kv:namespace create KV --preview
```
출력된 `id`와 `preview_id`를 `wrangler.toml`에 입력.

### 4. 데이터베이스 마이그레이션
```bash
wrangler d1 execute cloudpress-main --file=./migrations/001_init.sql
```

### 5. wrangler.toml 업데이트
```toml
[[d1_databases]]
binding = "DB"
database_name = "cloudpress-main"
database_id = "실제-D1-ID-입력"  # ← 여기

[[kv_namespaces]]
binding = "KV"
id = "실제-KV-ID-입력"           # ← 여기
preview_id = "preview-KV-ID"     # ← 여기
```

### 6. 배포
```bash
wrangler deploy
```

### 7. DNS 설정 (Cloudflare 대시보드)
```
app.cloudpress.app    → Worker Route
admin.cloudpress.app  → Worker Route
```

---

## Supabase 계정 설정 (18계정 × 2프로젝트 = 36버킷)

관리자 패널(`admin.cloudpress.app`) → Supabase 탭에서 각 계정 설정:

| 계정 | 프로젝트 1 | 프로젝트 2 | 최대 사이트 |
|------|-----------|-----------|------------|
| 계정 1 | project-a | project-b | 2개 |
| 계정 2 | project-c | project-d | 2개 |
| ... | ... | ... | ... |
| 계정 18 | project-ag | project-ah | 2개 |
| **합계** | **36 프로젝트** | | **36 사이트** |

각 계정에서:
1. [supabase.com](https://supabase.com) 에서 새 계정 생성
2. 프로젝트 2개 생성 (무료 플랜: 계정당 2개)
3. 각 프로젝트의 URL, anon key, service_role key 입력

---

## 관리자 계정 초기 설정

첫 번째 사용자를 관리자로 설정:
```bash
wrangler d1 execute cloudpress-main --command="
  UPDATE users SET role='admin' WHERE email='your@email.com';
"
```

---

## 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `ADMIN_DOMAIN` | 대시보드 도메인 | `app.cloudpress.app` |
| `SUPERADMIN_DOMAIN` | 관리자 패널 도메인 | `admin.cloudpress.app` |
| `ENVIRONMENT` | 환경 구분 | `production` |

---

## 핵심 기능

### WordPress 런타임
- Cloudflare Workers에서 WordPress 페이지 서빙
- PHP 버전별 선택 (7.4, 8.0, 8.1, 8.2, 8.3)
- D1에 WordPress 데이터 저장 (posts, pages, users, options 등)
- Supabase에 미디어 파일 저장
- KV 기반 페이지 캐시 (TTL 설정 가능)

### 보안 (WAF + DDoS)
- SQL 인젝션 자동 차단
- XSS 패턴 감지
- 로그인 브루트포스: 15분당 10회 제한
- 속도 제한: IP당 분당 300req
- DDoS: IP당 1000req 초과 시 1시간 자동 차단
- 민감 파일 보호: wp-config.php, .env, .git 등
- 악성 봇 자동 차단

### 도메인 관리
- 사이트당 다중 도메인 연결 (Primary + Alias)
- Cloudflare DNS 자동 관리
- 외부 도메인 네임서버 안내

### 퍼지 캐시
- 전체 캐시 즉시 삭제
- 사이트별 캐시 격리

---

## 파일 구조

```
cloudpress/
├── worker/
│   ├── index.js            # 메인 엔트리포인트
│   ├── wordpress-runtime.js # WP 라우팅
│   ├── wp-renderer.js       # WP 페이지 렌더링
│   ├── waf.js              # WAF/DDoS 보호
│   ├── storage.js          # Supabase 스토리지
│   ├── db.js               # D1 테이블 관리
│   ├── cloudflare.js       # CF API 연동
│   ├── auth.js             # 인증 미들웨어
│   ├── dashboard.js        # 대시보드 서버
│   ├── dashboard-html.js   # 대시보드 SPA HTML
│   ├── admin.js            # 관리자 패널
│   └── api/
│       ├── index.js        # API 라우터
│       ├── auth.js         # 로그인/회원가입
│       ├── sites.js        # 사이트 CRUD
│       ├── dns.js          # DNS 관리
│       ├── domains.js      # 도메인 관리
│       ├── settings.js     # 설정 (CF API, Supabase)
│       └── storage-api.js  # 파일 업로드
├── migrations/
│   └── 001_init.sql        # DB 스키마
├── scripts/
│   └── setup.js            # 초기 설정 스크립트
├── wrangler.toml           # Cloudflare Workers 설정
└── package.json
```

---

## 개발 (로컬)

```bash
# 로컬 개발 서버
wrangler dev --local

# D1 로컬 실행
wrangler d1 execute cloudpress-main --local --file=./migrations/001_init.sql
```

---

## 플랜 설정

KV에서 사용자 플랜 제한 설정:
```bash
wrangler kv:key put --namespace-id=YOUR_KV_ID "user:plan:USER_ID" '{"name":"pro","max_sites":10,"max_domains":30,"bandwidth_gb":200,"storage_gb":50}'
```

---

## 라이선스
MIT License — CloudPress
