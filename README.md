# whos-next

A small group rotation picker. Pick a subset of names, hit "choose", and the app
returns whose turn is next — rotating fairly across calls and persisting state
so the rotation survives reloads and redeploys.

## Stack

- **Server**: Go + Gin
- **Client**: React + Vite (in `client/`)
- **Database**: Supabase (Postgres + Row-Level Security)
- **Deploy**: Railway (built from `Dockerfile`)

## Environment variables

| Variable          | Required | Notes                                   |
| ----------------- | -------- | --------------------------------------- |
| `SUPABASE_URL`    | yes      | Your Supabase project URL.              |
| `SUPABASE_KEY`    | yes      | Supabase anon key.                      |
| `ADMIN_PASSWORD`  | yes      | Gates name creation from the UI.        |
| `PORT`            | no       | Server port. Defaults to `4000`.        |

Copy `.env.example` to `.env` for local dev. In Railway, set them in the project's
Variables panel.

## Local development

Install client deps once:

```sh
make client-install
```

Then run the server and the Vite dev server in two shells:

```sh
make server      # Go server on :4000
make client-dev  # Vite dev server, proxies /api to :4000
```

## Production build

Builds the client into `public/` and compiles the Go binary:

```sh
make build
```

## Tests

```sh
make test
```

Static-file tests skip themselves if `public/` hasn't been built.
