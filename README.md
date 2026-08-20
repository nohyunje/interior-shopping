# Interior Shopping

인테리어 이미지의 핫스팟과 실제 상품 구매 링크를 연결하는 Next.js 기반 큐레이션 서비스입니다.

## 로컬 실행

```bash
pnpm install
pnpm dev
```

관리자 화면은 `/admin`에서 접근합니다.

## 환경 변수

`.env.example`을 `.env.local`로 복사한 뒤 실제 값을 입력합니다.

```env
ADMIN_ID=admin
ADMIN_PASSWORD=replace-with-a-strong-password
SESSION_SECRET=replace-with-a-long-random-secret
NEXT_PUBLIC_SITE_URL=https://your-domain.example
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
SUPABASE_STORAGE_BUCKET=cms-assets
```

`SESSION_SECRET`은 충분히 긴 무작위 문자열을 사용해야 합니다. `.env.local`은 Git에 포함되지 않습니다.

## Vercel 배포 준비

1. Vercel에서 이 GitHub 저장소를 Import합니다.
2. Framework Preset은 `Next.js`, Package Manager는 `pnpm`을 사용합니다.
3. 위 일곱 개의 환경 변수를 Production, Preview, Development 환경에 등록합니다.
4. 배포 후 `NEXT_PUBLIC_SITE_URL`을 실제 Production 도메인으로 갱신하고 다시 배포합니다.

### Supabase CMS 영구 저장소

Supabase 환경변수가 있으면 CMS 데이터는 Supabase Postgres, 업로드 이미지는 `cms-assets` Storage 버킷에 영구 저장됩니다. 환경변수가 없는 로컬 개발 환경에서는 기존 JSON 저장 방식을 그대로 사용할 수 있습니다.

새 Supabase 프로젝트의 SQL Editor에서 다음 마이그레이션을 한 번 실행합니다.

```text
supabase/migrations/20260820000100_cms.sql
```

마이그레이션은 `categories`, `projects`, `project_images`, `hotspots`, `site_settings` 테이블, 원자적 저장 함수 `cms_replace`, 공개 이미지 버킷을 생성하고 현재 샘플 콘텐츠를 넣습니다.

Vercel에서 Supabase 설정이 빠졌다면 저장과 공개 데이터 API는 실패하도록 닫혀 있어 임시 데이터가 저장된 것처럼 오인하지 않습니다.

### 권장 영구 저장 구조

- Supabase Postgres: `categories`, `projects`, `project_images`, `hotspots`, `site_settings`
- Supabase Storage: 원본 이미지, 로고, 파비콘, OG 이미지
- DB에는 이미지 바이너리 대신 Storage의 공개 URL과 파일 메타데이터만 저장
- 프로젝트·이미지·핫스팟 순서는 각각 `sort_order` 정수 컬럼으로 관리
- 관리자 계정은 DB가 아닌 Vercel 환경변수 `ADMIN_ID`, `ADMIN_PASSWORD`로만 관리
- Supabase Service Role Key는 서버 Route Handler에서만 사용하고 `NEXT_PUBLIC_` 접두사를 사용하지 않음

## 배포 전 체크리스트

- [x] Next.js App Router 프로덕션 빌드 통과
- [x] `/admin` 서버 세션 검사 및 비로그인 로그인 화면
- [x] 관리자 API와 이미지 업로드 API의 401 보호
- [x] HttpOnly, SameSite=Strict, Production Secure 세션 쿠키
- [x] 관리자 ID·비밀번호·세션 키 환경변수 필수화
- [x] `.env` 및 CMS 런타임 데이터 Git 제외
- [x] Vercel용 pnpm/Sharp 설치 설정
- [x] `vercel.json`의 Next.js build/install 명령 확인
- [x] Supabase DB 저장 계층 및 스키마 구현
- [x] Supabase Storage 업로드 계층 구현
- [ ] Production 환경변수 등록
- [ ] 실제 도메인으로 `NEXT_PUBLIC_SITE_URL` 설정
- [ ] Preview 배포에서 로그인·저장·업로드 통합 테스트

## 검증

```bash
pnpm build
```
