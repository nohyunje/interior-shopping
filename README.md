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
```

`SESSION_SECRET`은 충분히 긴 무작위 문자열을 사용해야 합니다. `.env.local`은 Git에 포함되지 않습니다.

## Vercel 배포 준비

1. Vercel에서 이 GitHub 저장소를 Import합니다.
2. Framework Preset은 `Next.js`, Package Manager는 `pnpm`을 사용합니다.
3. 위 네 개의 환경 변수를 Production, Preview, Development 환경에 등록합니다.
4. 배포 후 `NEXT_PUBLIC_SITE_URL`을 실제 Production 도메인으로 갱신하고 다시 배포합니다.

### CMS 영구 저장소 주의사항

현재 CMS 데이터는 서버의 `data/cms.json`, 업로드 이미지는 `public/uploads`에 저장됩니다. 이 구조는 영구 디스크가 있는 Windows/macOS/Linux Node.js 서버에서는 정상 동작하지만, Vercel Functions의 파일시스템은 배포 간 영구 저장소가 아닙니다.

따라서 Vercel에서 관리자 CMS를 실제 운영하려면 배포 전에 다음 저장소 연결이 필요합니다.

- 프로젝트·카테고리·핫스팟·설정: Vercel Postgres, Neon 또는 Supabase
- 이미지: Vercel Blob, Cloudinary 또는 S3 호환 스토리지

스토리지 연결 전에도 공개 페이지와 빌드는 배포할 수 있지만, 관리자에서 변경한 데이터와 업로드 파일은 영구 보존되지 않습니다.

Vercel 환경에서는 이를 조용히 성공한 것처럼 처리하지 않습니다. 공개 페이지는 기본 데이터를 읽어 표시하지만 CMS 저장과 이미지 업로드 API는 영구 저장소가 연결될 때까지 HTTP `503`을 반환합니다.

### 권장 영구 저장 구조

- Supabase Postgres: `categories`, `projects`, `project_images`, `hotspots`, `site_settings`
- Supabase Storage 또는 Vercel Blob: 원본 이미지, 로고, 파비콘, OG 이미지
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
- [ ] Supabase DB 연결 및 스키마 생성
- [ ] Vercel Blob 또는 Supabase Storage 연결
- [ ] Production 환경변수 등록
- [ ] 실제 도메인으로 `NEXT_PUBLIC_SITE_URL` 설정
- [ ] Preview 배포에서 로그인·저장·업로드 통합 테스트

## 검증

```bash
pnpm build
```
