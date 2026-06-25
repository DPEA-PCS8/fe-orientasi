# UI Revamp Plan — Admin-Console Aesthetic

Goal: restyle `fe-orientasi` (React 19 + MUI 7) to match the visual language of
`sso/admin-console` (`Admin.Web`). Cleaner, tighter, slate-based, less "big".
Keep all existing logic (routing, RBAC, nested menus). **Visual only.**

Reference design system lives at:
`/Users/marvelkrent/Developer/projects/orientasi/sso/admin-console/Admin.Web/wwwroot/css/`
(`tokens.css`, `custom.css`, `components/*.css`) and `Views/Shared/_Layout.cshtml`.

---

## Design tokens (single source of truth — DO NOT hardcode elsewhere)

Defined in `src/styles/theme.ts` (`COLORS` + MUI theme). Agents consume via
`theme.palette.*` / `useTheme()` / the `COLORS` export — never raw hex.

| Token            | Value                                   |
|------------------|-----------------------------------------|
| brand            | `#BD1F27`                               |
| brand-dark       | `#8B1620`                               |
| brand gradient   | `linear-gradient(135deg,#BD1F27,#8B1620)` |
| ink              | `#0F172A`                               |
| text             | `#334155`                               |
| muted            | `#64748B`                               |
| subtle           | `#94A3B8`                               |
| border           | `#E2E8F0`                               |
| border-input     | `#CBD5E1`                               |
| soft (bg)        | `#F8FAFC`                               |
| white            | `#FFFFFF`                               |
| shadow-card      | `0 12px 24px rgba(15,23,42,0.08)`       |
| shadow-nav       | `0 10px 22px rgba(15,23,42,0.08)`       |
| font             | Inter (400/500/600/700)                 |

Radius: cards `16px`(1rem), buttons `~10px`(0.65rem), inputs/badges `~9px`(0.55rem).
Spacing: tight. Buttons height `2.5rem`, padding `0 1.25rem`. Fonts small
(body `0.875rem`, labels `0.72rem`, headings restrained).

### Status badge colors
- green: text `#15803D` border `#BBF7D0` bg `#F0FDF4`
- amber: text `#B45309` border `#FDE68A` bg `#FFFBEB`
- red:   text `#B91C1C` border `#FECACA` bg `#FEF2F2`
- slate: text `#475569` border `#E2E8F0` bg `#F8FAFC`

---

## Phase 0 — Foundation (DONE BY ORCHESTRATOR, serial). The contract.

Agents must NOT touch these files. They are the stable base.

- [ ] `src/styles/theme.ts` — rewrite `COLORS` + theme to tokens above.
      Component overrides: `MuiPaper`=card (gradient white→soft, 1px slate border,
      shadow-card), `MuiButton`=tight slate/brand, `MuiChip`=badge, `MuiTableHead`
      =gradient slate, smaller radius/typography. Remove heavy glass blur.
- [ ] Inter webfont via `@fontsource/inter` (imported in `main.tsx`).
- [ ] `src/components/PageHeader.tsx` — full-bleed band: eyebrow (uppercase brand,
      e.g. "CONTROL CENTER"), `h1` title, optional subtitle. Props: `eyebrow`,
      `title`, `subtitle`.
- [ ] `src/components/Navbar.tsx` — minimal topbar: logo left, notif + avatar right,
      `border-top: 3px brand`, white/85 blur, subtle shadow.
- [ ] `src/components/Sidebar.tsx` — restyle to `admin-side-nav` look (card surface,
      slate hover, brand-tint active, heading `Menu` uppercase). KEEP nested
      permission logic + collapse behavior.
- [ ] `src/components/Badge.tsx` — `<Badge variant="green|amber|red|slate">`.
- [ ] `src/components/Footer.tsx` — DONE (mirrors admin footer).

Commit Phase 0 before spawning agents.

---

## Phase 1 — Page polish (PARALLEL agents, after Phase 0 committed)

Each agent: restyle ONLY its assigned pages. Read this file + `theme.ts` first.

### Agent A — List pages
`AplikasiListPage, PksiList, Fs2List, InisiatifList, ProgramList,
RbsiManagementPage, HistorisAplikasiPage`
Apply: `PageHeader`, admin card/table head gradient, list toolbar, `Badge` for status.

### Agent B — Dashboards
`RbsiDashboardPage, PksiDashboardPage`
Apply: stat cards (gradient card + small label + big number), chart containers
on admin card surface.

### Agent C — Forms & details
`AddInisiatif, AddPksi, AddProgram, AplikasiFormPage, AplikasiDetailPage,
FormasiEfektifDetailPage, InisiatifChecklistPage, Fs2Disetujui, PksiDisetujui`
Apply: `PageHeader`, admin form inputs, secondary buttons, back-link.

### Agent D — Admin & master data
`UserList, UserRoleManagement, RolePermissions, TeamManagement,
FormasiEfektifPage, AuditLogPage, SkpaPage, BidangPage, KategoriRbsiPage,
Profile, RbsiArsitekturPage`
Apply: `PageHeader`, admin table, `Badge`, modals to admin modal style.

---

## Guardrails (ALL agents — clean code / easy maintain)

1. NO hardcoded hex/rgba. Use `theme.palette.*`, `useTheme()`, or `COLORS`.
2. REUSE `PageHeader`, `Badge`, shared components. Don't re-implement.
3. DO NOT edit `theme.ts`, `Navbar.tsx`, `Sidebar.tsx`, `Layout.tsx`, `Footer.tsx`
   (Phase 0 / shell — orchestrator owns them). Prevents merge conflicts.
4. Match spacing/radius/font scale of tokens. No giant paddings.
5. Keep all logic, props, data flow, RBAC intact. Visual only.
6. `npx tsc -b` must pass clean before declaring done.
7. Prefer `sx` with theme refs over inline style objects.

## Orchestration

Orchestrator (Claude main session) acts as foreman: builds Phase 0, commits on
branch `feat/marvel/revamp-ui-admin-style`, then spawns Phase 1 agents in
parallel and integrates. Commits are free on this branch (branched from `main`).
