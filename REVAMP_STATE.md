# Revamp — Live State / Handoff

Last updated mid-session. Read this + REVAMP_PLAN.md to resume.

## Branch
`feat/marvel/revamp-ui-admin-style`, based on **origin/main (c874e1f)** after a rebase.
(Earlier mistake: branched from STALE local main 82 commits behind origin. Fixed by
`git rebase --onto origin/main <old-base>`. Always `git fetch` before branching.)

## Committed so far (2 commits on top of origin/main)
1. `feat(ui): add admin-style footer and revamp plan`
   - `src/components/Footer.tsx` (new) — mirrors admin-console footer (DPEA Digital,
     batik PNG, address). Mounted in `src/components/Layout.tsx`.
   - assets: `src/assets/footer-hd.png`, `src/assets/DPEA-Digital2.png`
   - `REVAMP_PLAN.md` (the contract)
2. `feat(ui): phase 0 — admin-console design foundation`
   - `src/styles/theme.ts` — REWRITTEN to admin tokens: brand `#BD1F27`/dark `#8B1620`,
     slate neutrals, Inter font, radius 12, subtle shadows, card-gradient Paper,
     tight buttons, Chip=badge, Table head gradient. `COLORS` export is the token API.
   - `src/main.tsx` — imports `@fontsource/inter` 400/500/600/700 (dep installed).
   - `src/components/PageHeader.tsx` (new) — CONTROL CENTER eyebrow band
     (props: eyebrow, title, subtitle, actions).
   - `src/components/Badge.tsx` (new) — status pill (variant green|amber|red|slate).
   - `src/components/Navbar.tsx` — minimal topbar, 3px brand top border, slate colors.
   - `src/components/Sidebar.tsx` — colors swapped to admin tokens via sed; nested
     RBAC/collapse logic unchanged.

`npx tsc -b` was CLEAN after Phase 0 + `npm install`.

## Phase 1 — IN PROGRESS (4 background agents, uncommitted working-tree edits)
Restyling 29 pages, visual only. Agents must NOT touch theme/shell files.
- Agent A — lists (7): AplikasiListPage, PksiList, Fs2List, InisiatifList,
  ProgramList, RbsiManagementPage, HistorisAplikasiPage
- Agent B — dashboards (2): RbsiDashboardPage, PksiDashboardPage
- Agent C — forms/details (9): AddInisiatif, AddPksi, AddProgram, AplikasiFormPage,
  AplikasiDetailPage, FormasiEfektifDetailPage, InisiatifChecklistPage,
  Fs2Disetujui, PksiDisetujui
- Agent D — admin/master (11): UserList, UserRoleManagement, RolePermissions,
  TeamManagement, FormasiEfektifPage, AuditLogPage, SkpaPage, BidangPage,
  KategoriRbsiPage, Profile, RbsiArsitekturPage

## NEXT STEPS (resume here)
1. Wait for all 4 agents to finish (or check `git status` for their edits).
2. Run authoritative `npx tsc -b --pretty false` — must be clean.
3. Audit: `grep -rn "#[0-9a-fA-F]\{6\}" src/pages` for leaked hardcoded hex;
   confirm PageHeader + Badge are actually used.
4. `git add src/pages` + commit Phase 1 (do NOT commit `nginx.conf` — pre-existing,
   not part of revamp).
5. Preview: `npm run dev` → open https://localhost:5174 → in DevTools console paste:
   `localStorage.setItem('auth_token','dev'); localStorage.setItem('user_info', JSON.stringify({has_role:true,roles:['Admin'],name:'Dev',uuid:'local'})); location.href='/'`
   to bypass SSO and view locally.

## Deferred
- Dashboard pages now exist on origin/main (Agent B covers them) — no longer deferred.
- `nginx.conf` is modified in working tree (pre-existing, NOT mine) — keep out of commits.
