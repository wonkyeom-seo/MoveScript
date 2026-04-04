# MoveScript

MoveScript는 안무 장면을 곡 타임라인 위에 배치하고, 사람 위치와 등장/퇴장 상태를 편집한 뒤, owner viewer 또는 public share 링크로 재생할 수 있는 Next.js App Router 기반 웹 앱입니다.

## Stack

- Next.js 15.5.14 + App Router + TypeScript
- Tailwind CSS
- Firebase Authentication
- Supabase Postgres + Storage
- Zod + Zustand
- OpenNext Cloudflare adapter

## Included

- `/auth/sign-in`, `/auth/sign-up`
- `/dashboard`
- `/projects/new`
- `/projects/[projectId]`
- `/projects/[projectId]/viewer`
- `/share/[shareId]`
- Firebase ID token 검증 + 앱 전용 httpOnly session cookie
- Supabase relational schema + storage upload flow
- 무한 보드 느낌의 DOM 기반 whiteboard
- 씬 추가, 씬 복제, 다른 프로젝트 씬 import
- 씬/인원 autosave, 보드 transform persistence
- owner viewer / public viewer
- SQL migration
- seed script
- unit/component test baseline + Playwright skeleton

## Environment

`.env.local`에 아래 값을 채우세요. 예시는 [README.md](/Users/mama/Desktop/dev/MoveScript/README.md)와 함께 있는 [.env.example](/Users/mama/Desktop/dev/MoveScript/.env.example)에 있습니다.

- `NEXT_PUBLIC_APP_URL`
- `SESSION_SECRET`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_STORAGE_BUCKET`

## Setup

1. Install dependencies.

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill the Firebase + Supabase values.
3. Run the SQL migration in [supabase/migrations/20260404093000_init.sql](/Users/mama/Desktop/dev/MoveScript/supabase/migrations/20260404093000_init.sql).
4. Configure Firebase Authentication providers:
   - Email/Password
   - Google
5. Start the app:

```bash
npm run dev
```

6. Optional demo seed:

```bash
npm run seed
```

## Scripts

- `npm run dev`: local Next dev server
- `npm run lint`: ESLint
- `npm run typecheck`: TypeScript check
- `npm run test`: Vitest unit/component tests
- `npm run test:e2e`: Playwright
- `npm run seed`: demo user/project/scene seed
- `npm run preview`: OpenNext Cloudflare preview
- `npm run deploy`: OpenNext Cloudflare deploy

## Cloudflare Note

현재 이 저장소의 앱 코드 자체는 Node 18 환경에서 타입체크와 린트를 통과하도록 맞췄지만, 2026-04-04 기준 `wrangler@4.80.0`와 OpenNext 관련 도구는 Node 20 이상을 요구합니다. Cloudflare preview/deploy는 Node 20 환경에서 실행하는 것을 전제로 하세요.

## Auth Flow

1. Client가 Firebase로 로그인합니다.
2. Firebase ID token을 `POST /api/auth/session`으로 전송합니다.
3. 서버가 Google secure token JWKS로 토큰을 검증합니다.
4. 앱 DB의 `users` 레코드를 upsert합니다.
5. 서버가 앱 전용 signed session cookie를 발급합니다.
6. 이후 private route와 write API는 Firebase client state가 아니라 session cookie + ownership check만 신뢰합니다.

## Data Model

- `users`
- `projects`
- `songs`
- `scenes`
- `character_defs`
- `scene_people`

프로젝트별로 곡은 1개이며, 씬은 순차적이고 겹치지 않게 저장됩니다. 인물의 stable identity는 `character_defs.stable_key`로 유지됩니다.

## Tests

현재 포함된 테스트는 다음을 다룹니다.

- 좌표계 변환과 zoom anchor 계산
- playback interpolation
- Firebase token claim validation
- Zod payload validation
- whiteboard pan / drag interaction
- viewer read-only surface baseline

Playwright 테스트는 실제 Firebase/Supabase 환경이 준비된 경우에만 `E2E_RUN_FULL=true`로 실행하도록 스켈레톤을 넣었습니다.

## Important Limitations

- 협업 편집은 v1 범위에 포함되지 않습니다.
- 공유 링크 재생성 UI는 넣지 않았고 enable/disable만 지원합니다.
- Cloudflare preview/deploy는 Node 20 툴체인을 전제로 합니다.
- Supabase는 custom Firebase auth를 직접 알 수 없으므로, 실제 소유권 enforcement는 서버 API 레이어가 담당합니다.
