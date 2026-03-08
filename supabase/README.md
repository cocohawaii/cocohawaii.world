# Supabase Migrations

## Run migrations

### Option 1: Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. **SQL Editor** → New query
3. Paste the contents of `migrations/20250301000000_initial_schema.sql`
4. Run

### Option 2: Supabase CLI
```bash
supabase db push
```

## Migration order
- `20250301000000_initial_schema.sql` – members, raffles, raffle_entries, raffle_claimed_prizes + RLS
