# Stabilization Notes

## v0.1.0-stable – Production Baseline
- First successful Vercel production deploy
- Prisma generation stabilized for cached builds
- Next.js 16 + ESLint 9 compatibility confirmed


## 1. Stabilization Summary

- Project underwent a post-MVP stabilization pass to unblock builds and deployment
- No new features were added
- Focus was on type safety, dependency alignment, and configuration correctness

## 2. Key Changes Applied

- Next.js App Router API route handler signatures updated to align with current typing requirements (`async context.params`)
- Prisma query filters updated to use generated enum types (`InvoiceStatus`, `CallOutcome`) instead of raw strings
- Dependency alignment completed between `package.json` and `package-lock.json`
- `eslint-config-next` updated to match Next.js version
- TypeScript configuration adjusted (`jsx: preserve`, cleaned up includes)
- `next.config.js` updated to move `serverActions` out of `experimental` block
- Vercel cron jobs removed from active configuration
- `mapVapiOutcome` function return type strengthened from `string` to union type

## 3. Cron Jobs (Intentionally Disabled)

- All Vercel cron jobs removed from `vercel.json`
- Removal due to Vercel Hobby plan limitations on cron frequency and execution
- Cron-based automation (e.g., `/api/cron/process-calls`) is deferred
- The endpoint remains functional and can be triggered manually

### Conditions for Re-enabling Cron

- Upgrade to Vercel Pro plan, or
- Migration to an external scheduler:
  - GitHub Actions (scheduled workflows)
  - Upstash QStash
  - Railway cron jobs
  - Dedicated queue worker

## 4. Security & Dependency Notes

- Critical vulnerabilities resolved by upgrading Next.js to patched stable version (14.2.35)
- Remaining moderate/high audit warnings are dev-tooling related
- These warnings are non-blocking for MVP deployment
- Remaining warnings should be addressed after MVP stabilization
- Avoid aggressive upgrades during active development to prevent breaking changes

## 5. Guardrails Going Forward

- Do not reintroduce cron jobs without addressing deployment plan constraints
- Do not run `npm audit fix --force` without validation and testing
- Validate all dependency upgrades in a separate branch before merging
- Treat this commit as the baseline for future feature work
- Run `npm run build` locally before pushing changes
- Maintain Prisma enum usage in all database queries (no string fallbacks)
