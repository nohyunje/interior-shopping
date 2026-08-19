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

## 검증

```bash
pnpm build
```
