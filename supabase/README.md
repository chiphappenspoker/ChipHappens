# Supabase setup (ChipHappens Phase 2)

## Prerequisites

- Supabase CLI is installed as a dev dependency (`npm install`).
- A Supabase project (create one at [supabase.com](https://supabase.com) if needed).

## Link to your remote project (one-time)

From the project root:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

Use your **Project ref** from Supabase Dashboard → Settings → General (or the subdomain in your project URL, e.g. `buhmynyqymryrjnqdiqt` from `https://buhmynyqymryrjnqdiqt.supabase.co`).  
When prompted, enter your **database password** (Settings → Database).

## Apply migrations (database from scratch)

Push all migrations to the linked remote database:

```bash
npm run supabase:db:push
```

Or (accept prompt non-interactively):

```bash
echo "Y" | npx supabase db push
```

If the CLI says "Remote migration versions not found in local migrations directory", the remote has different migration history. Repair and push:

```bash
npx supabase migration repair --status reverted <remote_version_1> <remote_version_2> ...
npm run supabase:db:push
```

This runs, in order:

1. **20260228000000_initial_schema.sql** – tables: `profiles`, `groups`, `group_members`, `game_sessions`, `game_players`; `updated_at` triggers (no auth trigger; profiles are created from the client).
2. **20260228000001_rls.sql** – enables RLS and creates all policies (including `profiles_insert_own` for client-side profile creation).

## Reset remote database (optional)

To wipe the remote DB and re-apply all migrations:

```bash
npm run supabase:db:reset
```

**Warning:** This deletes all data in the linked project’s database.

## Local development (optional)

To run Supabase locally:

```bash
npx supabase start
```

Then link to the local project and push migrations as above, or use the local DB URL in your app.

## Email templates (signup confirmation, etc.)

The default Supabase signup confirmation email does not mention ChipHappens. To use a branded subject and body:

- **Local / self-hosted:** Already configured in `config.toml` and `supabase/templates/confirmation.html`. Restart after changing: `supabase stop && supabase start`.
- **Hosted Supabase (Dashboard):** Go to [Authentication → Email Templates](https://supabase.com/dashboard/project/_/auth/templates). Under **Confirm signup**, set:
  - **Subject:** e.g. `Confirm your ChipHappens signup`
  - **Body:** Copy the HTML from `supabase/templates/confirmation.html` (keep the variables `{{ .ConfirmationURL }}`, etc.). Save.

Other templates (invite, recovery, magic link, etc.) can be customized the same way in `config.toml` and Dashboard.
