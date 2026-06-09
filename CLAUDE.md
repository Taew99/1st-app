# DailyShare MVP

짧게 공유하고, 깊게 저장하는 일상·아이디어 기록 앱.

## 기술 스택

- React Native + Expo SDK 55 (Expo Router)
- TypeScript
- Supabase (Auth, PostgreSQL, Storage)
- TanStack Query + Zustand + Zod

## 프로젝트 구조

```
app/                    # Expo Router 화면
  (auth)/               # 로그인, 회원가입
  (tabs)/               # 하단 탭 (feed, write, vault, my)
  post/                 # 공개 게시물 작성, 인용
  vault/                # 자유 기록 작성, 수정
  question/             # 오늘의 질문, 카테고리 설정
src/
  components/           # UI 컴포넌트
  hooks/                # TanStack Query 훅
  lib/                  # supabase 클라이언트, 이미지 업로드
  stores/               # Zustand 스토어 (auth)
  types/                # DB 타입 정의
  utils/                # 날짜 유틸
supabase/
  migrations/           # SQL 마이그레이션 (001, 002)
  seed/                 # 테스트 데이터
```

## 환경변수 (.env)

```
EXPO_PUBLIC_SUPABASE_URL=https://nsxegrtfwylcvzjiljmp.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_PROJECT_ID=
```

## 개발 명령어

```bash
npm install --legacy-peer-deps
npx expo start --tunnel    # Expo Go로 실기기 테스트
```

## 주요 제약사항

- `public_posts.body` 최대 100자
- `private_entries.body` 최소 200자
- 공개 게시물 original 타입은 `image_url` 필수
- 공개 게시물은 user_id + post_date 기준 하루 1개
- `private_entries` RLS: 본인만 조회/수정/삭제 가능
- 이미지 업로드: expo-image-manipulator로 최대 1080px 리사이즈, 품질 0.7, 썸네일 400px 분리

## 현재 개발 브랜치

`claude/daily-sharing-app-mvp-PXZQn`

## Supabase

- SQL 마이그레이션: `supabase/migrations/` 폴더의 001, 002 파일을 Supabase SQL Editor에서 실행
- Storage 버킷: `post-images` (public)
- 경로 규칙: `{user_id}/{post_id}/image.jpg`, `{user_id}/{post_id}/thumb.jpg`

## 주의사항

- expo-crypto, expo-notifications, expo-device는 Expo Go 호환성 문제로 제거됨 (네이티브 빌드 시 재추가)
- Push 알림은 현재 stub 처리 (src/lib/notifications.ts)
- 모든 expo-* 패키지는 SDK 55 버전으로 통일
