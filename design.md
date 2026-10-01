# design.md — P3 Frontend 1: Public + Investor UI/UX Spec

Scope: public pages, auth screens, shared UI kit, and the Investor module. Broker/Admin screens reuse these tokens and components but are not specified here.
Stack assumption: Next.js App Router, TypeScript, Tailwind CSS. Tokens below map 1:1 to `tailwind.config` / CSS variables.

---

## 1. Design Philosophy

**Calm, trustworthy, financially safe.** Think private bank meets premium real-estate brochure, not crypto or generic SaaS.

1. **Numbers first.** Money, units, % and dates are the heroes. Large, tabular, right-aligned, always with a label.
2. **One primary action per view.** Emerald = "go / invest / confirm". Navy = structure. Gold = trust accent only (badges, highlights), never a CTA.
3. **Explain, don't block silently.** Every disabled action says *why* and *what fixes it* (e.g. "Add ₹12,500 to invest").
4. **Quiet surfaces.** White cards on `#F7F8FA`, subtle shadows, generous whitespace, no gradients-for-decoration, no neon, no heavy illustration.
5. **Never color alone.** Every status = color + icon + text label.
6. **Same component everywhere.** A property card on the landing page equals the one in the marketplace and "Recommended" rail.

---

## 2. Color + Typography Tokens

### Colors

| Token | Hex | Use |
|---|---|---|
| `navy` | `#0F2A4A` | Navbar, headings, sidebar, primary-outline buttons, chart base |
| `emerald` | `#10B981` | Primary CTA fill, positive amounts, progress fill, success |
| `gold` | `#D4A017` | Accent: "Verified", "Featured", ROI highlight icon, focus-adjacent accents |
| `bg` | `#F7F8FA` | App/page background |
| `surface` | `#FFFFFF` | Cards, inputs, modals |
| `danger` | `#DC2626` | Errors, debits, rejected, destructive |
| `warning` | `#F59E0B` | Pending, low units, KYC reminder |
| `text` | `#111827` | Body and headings on light |
| `muted` | `#6B7280` | Secondary text, labels, placeholders |
| `border` | `#E5E7EB` | Dividers, card/input borders (derived neutral) |

**Derived tints (allowed, for backgrounds only):** `emerald-50 #ECFDF5`, `danger-50 #FEF2F2`, `warning-50 #FFFBEB`, `navy-50 #EEF2F7`, `gold-50 #FDF8E7`.

**Contrast rules (important):**
- `emerald`, `gold`, `warning` on white are **below 4.5:1** — never use them as small text color on white.
- Text-on-fill: white text on `#10B981` fails AA. Primary button = `#047857` (emerald-700) fill + white text (passes AA); hover `#065F46`. Keep `#10B981` for progress fills, icons, large numbers (≥ 24px) and brand accents. Chips use `emerald-50` bg + `#047857` text.
- Positive text color: `#047857`. Warning text color: `#92400E`. Danger text `#DC2626` (passes on white). Gold text: `#8A6A0A` on `gold-50`.
- `muted` `#6B7280` is OK on white (≈4.8:1); don't use it for essential info on `bg`.

### Typography

- Headings: **Plus Jakarta Sans** (600/700). Body/UI/numbers: **Inter** (400/500/600). Load via `next/font` with `display: swap`.
- Financial numbers: `font-variant-numeric: tabular-nums;` (Tailwind `tabular-nums`) on every amount, %, units, table cell.

| Style | Size / Line | Weight | Font |
|---|---|---|---|
| Display (landing hero) | 48/56 (mobile 32/40) | 700 | Jakarta |
| H1 | 32/40 (mobile 28/36) | 700 | Jakarta |
| H2 | 24/32 | 600 | Jakarta |
| H3 | 20/28 | 600 | Jakarta |
| Stat number (KPI) | 28/36 (mobile 24/32) | 700 | Inter, tabular |
| Body | 16/24 | 400 | Inter |
| Small / label | 14/20 | 500 | Inter |
| Caption | 12/16 | 500 | Inter |

### Indian ₹ formatting

- Use `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })` → `₹12,50,000`.
- Compact for cards/KPIs ≥ 1 lakh: `₹12.5 L`, `₹2.4 Cr` (always show full value in tooltip/detail).
- Percent: one decimal (`8.5%`), ownership up to 2 decimals (`0.25%`). Dates: `12 Mar 2026`.
- Positive changes prefixed `+`, negative use proper minus `−`. Right-align numeric columns.

---

## 3. Spacing, Radius, Shadows, Layout

- **8px grid.** Allowed spacing: 4 (tight icon gaps only), 8, 16, 24, 32, 40, 48, 64, 80.
- **Radius:** inputs/buttons 10px, chips full pill, cards 16px, modals 16px, images inside cards 12px.
- **Shadows:** `card: 0 1px 2px rgba(15,42,74,.06), 0 1px 3px rgba(15,42,74,.08)`; `card-hover: 0 4px 12px rgba(15,42,74,.10)`; `modal: 0 16px 40px rgba(15,42,74,.18)`. No other shadows.
- **Borders:** 1px `border` on cards in addition to shadow.
- **Container:** public pages `max-w-7xl` (1280) centered, padding 16 / 24 / 32 (mobile / tablet / desktop).
- **Grid:** 4 col mobile (<640), 8 col tablet (640–1023), 12 col desktop (≥1024). Gap 16 mobile, 24 desktop.
- **Breakpoints:** `sm 640`, `md 768`, `lg 1024`, `xl 1280`. Design at 360, 768, 1280.
- **Touch targets:** min 44×44px. Focus ring: 2px `navy` outline + 2px white offset (`focus-visible:` only), 3:1 against neighbors.
- **Z-index scale:** content 0, sticky 10, navbar 20, drawer 30, modal 40, toast 50.

---

## 4. Core Components

### Buttons
| Variant | Style | Use |
|---|---|---|
| Primary | `#047857` fill, white text, hover darker, 44px high | Invest, Confirm, Add money, Submit |
| Secondary | White, 1px navy border, navy text | Cancel, View details |
| Ghost | Transparent, navy text, hover `navy-50` | Tertiary, table actions |
| Danger | `danger` fill, white text | Withdraw cancel, delete |
| Link | Navy underline on hover | Inline |

States for all: default, hover, `focus-visible`, active, **disabled** (50% opacity, `cursor-not-allowed`, plus helper text explaining why), **loading** (spinner replaces icon, label stays, `aria-busy`, width does not shift). Sizes: `sm 36` (tables only), `md 44` (default), `lg 52` (hero/checkout CTA). Full-width on mobile for primary form actions.

### Forms
- Label above input (14px/500), optional hint below (12px muted), error below (12px danger + alert icon).
- Input: 44px high, 1px `border`, radius 10, white. Focus: navy border + ring. Error: danger border + `danger-50` tint + icon + message (`aria-describedby`, `aria-invalid`).
- Required fields marked "(required)" in text, not only `*`.
- Amount inputs: `₹` prefix, `inputMode="numeric"`, tabular, live formatting.
- Password: show/hide toggle with accessible label. Checkbox/radio: 20px visible box, label is the click target.
- Validate on blur, re-validate on change after first error; submit-level summary at top for long forms.

### Cards
- `Card`: white, radius 16, 1px border, `card` shadow, padding 24 (16 on mobile). Optional header (title + action) and footer.
- `StatCard`: label (small muted), value (stat number), delta (chip with arrow + text), optional icon in `navy-50` circle.
- `PropertyCard` (single source of truth): 16:10 image (lazy, blur placeholder), **status chip** top-left, city + type (caption, muted), title (H3, 2-line clamp), price/unit, funding progress (bar + `%` + "X units left"), expected return (emerald-700 text with gold trend icon), CTA "View property". Whole card is one link; hover lifts (`card-hover`, −2px). Height equalized in grid.

### Status Chips (color + icon + text, never color alone)
| Status | Icon | Text | Colors (bg / text) |
|---|---|---|---|
| LIVE | pulse dot | Live | emerald-50 / `#047857` |
| FUNDED | check-circle | Funded | navy-50 / navy |
| HOLDING | clock | Holding | gold-50 / `#8A6A0A` |
| SOLD | badge-check | Sold | `#E5E7EB` / text |
| PENDING | hourglass | Pending | warning-50 / `#92400E` |
| APPROVED | check | Approved | emerald-50 / `#047857` |
| REJECTED | x-circle | Rejected | danger-50 / `#B91C1C` |
| NOT_SUBMITTED | file-question | Not submitted | `#F3F4F6` / muted |
| Low units (<10% left) | alert | "Only N left" | warning-50 / `#92400E` |

Chip: 24px high, 12px/600 text, 8px horizontal padding, pill. Same component for properties, KYC, and transactions.

### Progress Bars
- Track `#E5E7EB`, fill emerald, height 8px (12px on detail), radius full. Show `%` as text beside the bar; `role="progressbar"` with `aria-valuenow/min/max` and text alternative "62% funded, 380 of 1,000 units sold".
- 100% = fill turns navy with "Fully funded" chip.

### Tables
- Desktop: sticky header, 56px rows, zebra none, 1px row dividers, numbers right-aligned tabular, status as chips, row hover `navy-50`.
- **Mobile (<768): tables become stacked cards** (label/value pairs, 2 key fields in header). Never horizontal scroll.
- Pagination below (10/page) or "Load more"; empty and loading rows supported.

### Dialogs
- Centered modal (max-w 480; full-height sheet from bottom on <640). Focus trapped, `Esc` closes (except mid-submit), initial focus on first control, returns focus to trigger, `aria-modal`, title via `aria-labelledby`, backdrop `rgba(15,42,74,.5)`.
- Footer: Secondary (left/first on mobile bottom) + Primary. Destructive confirmations name the consequence.

### Notifications
- **Toast:** top-right desktop, top full-width mobile, 5s auto-dismiss (errors persist until closed), icon + title + message, `role="status"` (`alert` for errors). Max 3 stacked.
- **Inline banner:** for KYC reminders, form-level errors; icon, message, action link.
- **Notification list item:** icon in tinted circle, title, one-line body, relative time, unread = left 4px navy bar + bold title + "Unread" sr-only text.

### Charts
- Allocation **donut** (Recharts-style or SVG): max 6 slices + "Other"; palette navy, emerald, gold, `#3B6EA5`, `#6FCFA8`, `#9CA3AF`. Center label = total ₹. **Always paired with a legend list** showing name, ₹ and % (so color is never sole carrier). Slices differ by pattern/label order for a11y.
- Provide a text/table equivalent (`aria-label` summary + visually-hidden table).

---

## 5. Navigation & Layouts

### Public Navbar (height 72, white, bottom border, sticky)
- Left: logo (navy wordmark + gold mark). Center (≥1024): Home, Properties, How it works. Right: **Log in** (ghost), **Sign up** (primary). Logged in: Notifications bell (unread badge with number), avatar menu (Dashboard, Wallet, Logout).
- Mobile: logo + hamburger → full-height drawer, links 48px high, CTAs pinned at bottom. Active link: navy text + 2px emerald underline + `aria-current="page"`.
- Skip-to-content link first in tab order.

### Footer
- Navy bg, white text. 4 columns (brand blurb, Platform, Company, Legal) → stacked on mobile. Risk disclaimer line: "Real-estate investments carry risk. Past returns don't guarantee future results." Copyright. Contrast ≥ 4.5:1.

### Investor Dashboard Layout
- **Desktop ≥1024:** fixed left sidebar 256px (navy bg, white text) + top bar 64px (page title, wallet balance pill, bell, avatar) + content (`bg`, padding 32, max-w 1200).
- Sidebar items: Dashboard, Marketplace, Portfolio, Wallet, KYC (with status chip), Notifications; active = emerald-tinted bg `rgba(16,185,129,.15)` + left 3px emerald bar + icon + label.
- **Tablet 768–1023:** sidebar collapses to 72px icon rail with tooltips + labels on focus.
- **Mobile <768:** no sidebar; top bar (menu, title, bell) + **bottom tab bar** (Home, Portfolio, Invest/Browse, Wallet, More) 64px, safe-area padding. "More" opens sheet with KYC, Notifications, Logout.
- Page header pattern: H1, one-line description, right-aligned primary action; breadcrumbs on detail pages.

---

## 6. Public Pages

### Landing `/`
1. **Hero:** H Display "Own a share of premium property, from ₹5,000." (adjust to real min price from data), subcopy, CTAs [Browse properties (primary)] [How it works (secondary)], trust row (KYC-verified, Secure wallet, Transparent payouts). Right: one high-quality property image in rounded 16 frame with a floating stat card (funding %, return). Background `bg`, no heavy gradient.
2. **Platform stats strip:** 4 `StatCard`-lite (properties funded, investors, total invested, avg return).
3. **How it works:** 4 numbered steps (Sign up & KYC → Add money → Buy units → Earn payouts on sale). Icons in `navy-50` circles.
4. **Featured properties:** 3 `PropertyCard`s (horizontal scroll *not* allowed; stack on mobile) + "View all".
5. **Why fractional / trust:** 3 benefit cards (low entry, transparent ownership, regulated process).
6. **FAQ** accordion (keyboard accessible), **final CTA band** (navy bg, emerald button), Footer.

### Marketplace `/properties`
- Header: H1 + result count (`aria-live` polite). Search input, **filters**: city, type, status, price/unit range, min expected return; sort: Newest, Return high→low, Funding % high→low, Price low→high.
- Desktop: left filter panel 280 + grid 3 cols (xl) / 2 cols (lg). Tablet: filters in collapsible top row, 2 cols. Mobile: single column, "Filters" button opens bottom sheet with Apply/Clear; active filters shown as removable chips.
- States: skeleton cards (6), empty ("No properties match" + Clear filters), error (retry).
- Pagination or "Load more"; preserve filters in URL.

### Property Detail `/properties/[id]`
- **Top:** breadcrumb, title (H1), city + type + status chip, "Share" optional.
- **Gallery:** main image 16:9 + 4 thumbs (desktop); swipeable carousel with dots + count on mobile; click opens lightbox (focus-trapped, arrow keys, alt text on every image).
- **Two-column (desktop 8/4):** left content; right **sticky Invest panel** (card).
  - Invest panel: price/unit (large), expected return, funding bar, "380 / 1,000 units sold", "620 left", investor count, min investment, primary **Invest now** button. On mobile the panel becomes a **sticky bottom bar** (price/unit + Invest button).
  - Not logged in → button reads "Log in to invest" (goes to login with `next`). KYC not approved → button still enabled but leads to KYC with banner. Sold out / Funded → disabled + text "Fully funded".
- **Left sections (anchored tabs on sticky sub-nav):** Overview (key metrics grid: total value, total units, price/unit, expected return, tenure, area), Description, Funding progress, **Documents** (list with file icon, name, size, "View" – icon + text), **Location map** (embedded map or static placeholder + address), **Return calculator**.
- **Return calculator:** unit input (stepper + slider), shows invested ₹, ownership %, projected value & gain at expected return. Labelled "Illustrative, not guaranteed."

### Auth screens (`/login`, `/signup`, `/forgot-password`, `/reset-password`)
- Centered card (max-w 440) on `bg`; desktop split layout optional: left navy panel with trust points, right form. Logo top. One H1, one primary button.
- Signup: name, email, password (with strength meter + rules list in text), confirm, terms checkbox (accounts default to Investor; no role picker unless the team spec requires one). Login: email, password, "Forgot password?", error banner for invalid credentials (generic message).
- Forgot: email → success state "If an account exists, we've sent a link." Reset: new + confirm password, success → Log in CTA. All have loading and field-error states.

---

## 7. Investor Pages

### `/investor` Dashboard
- **Order (mobile = same order, single column):**
  1. KYC reminder banner (warning-50, icon, "Complete KYC to start investing", button [Complete KYC]) — only when not APPROVED; PENDING shows "Under review", REJECTED shows reason link.
  2. **KPI row** (5 StatCards): Total invested, Current value, Total payouts, Overall ROI (± with icon+text), Wallet balance (with [Add money] link). Grid: 5 → 3+2 (tablet) → 2 cols mobile with wallet card full-width.
  3. Row: **Allocation donut + legend** (5/12) | **Recent transactions** (7/12, last 5, credit/debit styling, "View all").
  4. **Recommended properties** — 3 `PropertyCard`s.
- **New-investor zero state:** KPIs show `₹0` with muted "Start investing to see this", donut replaced by calm illustration (simple line house icon in navy-50 circle) + "Your portfolio starts here", 3-step checklist card (✔ Create account · ☐ Complete KYC · ☐ Add money · ☐ Make first investment) with progress "1 of 4", primary [Explore properties]. Recent transactions empty with "No activity yet".

### `/investor/invest/[id]` Checkout (RUBRIC-CRITICAL)
Layout: desktop 2 columns (7/5): left = inputs, right = sticky **Order summary**. Mobile: single column, summary collapses to a sticky bottom bar (total + Continue).

**Left column**
1. **Property summary card:** thumbnail, title, city, type, price/unit, expected return, status chip, funding bar, "N units available".
2. **Select units:** 
   - Slider (min 1, max = min(available units, wallet-affordable cap shown as marker, per-user limit if any)) + numeric stepper input (−/+ buttons, 44px) kept in sync; typing clamps on blur with message.
   - **Quick select chips:** 1, 5, 10, 25, 50 units + "Max" (chips exceeding availability are disabled with tooltip "Only N units available").
3. **Terms:** checkbox "I have read and agree to the Terms and Risk Disclosure" with links (open in new tab, announced).

**Right column – Order summary (live, `aria-live="polite"`)**
| Row | Value |
|---|---|
| Units | 25 |
| Price per unit | ₹10,000 |
| **Investment amount** | **₹2,50,000** (large) |
| Ownership | 0.25% |
| Projected value (at expected return) | ₹2,72,500 |
| Wallet balance | ₹3,00,000 |
| **Balance after investment** | ₹50,000 (danger color + minus if negative) |

CTA: **Review & invest** (lg, full width).

**Eligibility checks (shown as a checklist card above the CTA, each row = icon + text + status):**
| Check | Pass | Fail message & action |
|---|---|---|
| KYC approved | ✔ KYC verified | "KYC required to invest" → [Complete KYC] (PENDING: "KYC under review", REJECTED: "KYC rejected — resubmit") |
| Property is LIVE | ✔ | "This property is no longer open for investment" |
| Units available | ✔ N available | "Only N units left" / "Sold out" |
| Wallet balance sufficient | ✔ | **"Insufficient balance. You need ₹X more."** with **[Add ₹X to wallet]** (pre-fills amount) |
| Units ≥ 1 and whole number | ✔ | "Enter at least 1 unit" |
| Terms accepted | ✔ | "Accept terms to continue" |

- The CTA is **disabled** while any check fails and shows the first blocking reason in helper text below it (`aria-describedby`). Disabled buttons use `aria-disabled` and remain focusable so the reason is readable.
- **Additional money required** = `max(0, amount − walletBalance)` shown in a danger-50 inline alert with the exact ₹ figure and the add-money action; returning from wallet restores selected units.

**Confirmation modal:** title "Confirm your investment"; summary list (property, units, amount, ownership, balance after); note "This action can't be undone."; buttons [Back] [Confirm & pay ₹X] (primary, loading state, disables both buttons while submitting, `Esc` blocked during submit). Error → inline in modal with Retry.

**Success screen (replaces page content):** large emerald check in circle (with text "Investment successful"), receipt card (reference ID, property, units, amount, ownership, date, new wallet balance), buttons [View portfolio] (primary) [Browse more] (secondary). Focus moves to heading; `role="status"`.

### `/investor/portfolio`
- Top summary strip (invested, current value, ROI, payouts) → 4 compact stats.
- **Holdings table** columns: Property (thumb + title + city), Units, Ownership %, Invested, Est. value, Status chip, Payout, ROI (± icon + text). Row click/“View” → detail. Sort by value/ROI. Mobile: stacked cards showing property, invested, value, ROI, status; "View" link.
- Filters: status tabs (All / Live / Funded / Holding / Sold). Empty state: "No holdings yet" + [Explore properties].

### `/investor/portfolio/[propertyId]`
- Header: breadcrumb, property title, status chip, [View property] link.
- **Financial summary card:** units owned, ownership %, invested, estimated value, gain/loss (± with icon+text), payout received (if SOLD), ROI.
- **Timeline** (horizontal ≥768, vertical on mobile): **LIVE → FUNDED → HOLDING → SOLD**. Each node: icon + label + date; completed = filled navy with check, current = emerald ring + "Current" text, upcoming = grey outline + "Upcoming". `aria-current="step"` on current; ordered list semantics.
- **Transactions for this property:** ledger table (date, type, amount, status).
- SOLD state: payout breakdown card (sale value, your share, payout credited to wallet on date).

### `/investor/wallet`
- **Balance card** (navy bg, white text, large ₹, "Available balance") with [Add money] (primary on navy → white/emerald variant with ≥4.5:1) and [Withdraw] (secondary-on-dark).
- **Add money (modal or panel):** amount input, quick chips ₹5,000 / 10,000 / 25,000 / 50,000, **"Test mode — no real money is charged"** gold-tinted banner, mock payment method selector, [Pay ₹X] → processing (spinner, "Do not close") → success toast + updated balance, or failure state with retry.
- **Withdraw request:** amount (max = balance, error "Exceeds available balance"), bank/UPI placeholder fields, confirmation, resulting request appears as PENDING row in ledger.
- **Ledger table:** date, description, type, amount, balance after, status. **Credit:** `+₹` in `#047857` with arrow-down-left icon and "Credit" label; **Debit:** `−₹` in `danger` with arrow-up-right icon and "Debit" label. Filter: All / Credits / Debits; date range. Mobile: stacked rows with amount right-aligned. Empty: "No transactions yet".

### `/investor/kyc`
- Status header card with chip and one-line meaning. Stepper-free single page.
| State | Content |
|---|---|
| NOT_SUBMITTED | Intro (why KYC, time ~2 min), form: full name, DOB, PAN (format hint, validation), address, **dummy document upload** (drag-and-drop zone + "Choose file" button, accepts PDF/JPG/PNG ≤ 5MB, file chip with name/size/remove, progress), declaration checkbox, [Submit for verification] |
| PENDING | Read-only submitted summary, warning-style "Under review — usually 1–2 business days", form disabled, [Back to dashboard]; investing remains blocked with that reason |
| APPROVED | Emerald "Verified" panel with check icon, date, "You can now invest"; [Browse properties] |
| REJECTED | danger-50 alert with **admin rejection reason** (verbatim), what to fix, [Resubmit KYC] reveals prefilled form; previous document listed as "Replace required" |
- Upload errors: wrong type / too large messages inline; drop zone keyboard-operable and announced.

### `/notifications`
- List grouped by Today / Earlier; filter tabs (All / Unread); [Mark all as read]. Types with icons (investment, payout, KYC, system). Item click navigates to relevant page and marks read. Empty: "You're all caught up". Pagination / load more.

---

## 8. Responsive Behavior

| Area | 360 (mobile) | 768 (tablet) | ≥1024 (desktop) |
|---|---|---|---|
| Navigation | Hamburger drawer; investor bottom tab bar | Navbar full or hamburger; icon-rail sidebar | Full navbar; 256px sidebar |
| Grids | 1 col | 2 cols | 3 cols (cards), 12-col layouts |
| Tables | Stacked cards | Table, fewer columns (hide secondary) | Full table |
| Property detail | Sticky bottom Invest bar | Invest panel below gallery | Sticky right panel |
| Checkout | Single column + sticky total bar | Single column, summary on top | 7/5 split |
| Modals | Bottom sheet | Centered | Centered |

Rules: **no horizontal scrolling at any width**; long titles wrap/clamp; use `min-w-0` on flex children; images `object-cover` with set aspect ratios; test text zoom 200%; `prefers-reduced-motion` disables lift/transition/pulse animations; fluid padding via the grid tokens above.

---

## 9. Loading / Empty / Error / Success States

| State | Pattern |
|---|---|
| **Loading** | Skeletons matching final layout (shimmer 1.2s, off under reduced motion); buttons show inline spinner; whole-page spinner never used. `aria-busy="true"` on region. |
| **Empty** | Navy-50 icon circle, H3 headline, one-line explanation, one primary action. Specific copy per screen (marketplace, portfolio, wallet, notifications, dashboard zero state). |
| **Error** | Danger-50 card with alert icon, plain-language message, [Try again], optional "Contact support". Field errors inline; page errors as banner; never show raw error codes. 404/500 pages use same pattern with [Go home]. |
| **Success** | Toast for light actions (e.g. money added); full success screen for investment and KYC submitted; emerald check + text + next action. |
| **Disabled** | 50% opacity, `aria-disabled`, visible reason text adjacent, tooltip not the only explanation. |
| **Offline/timeouts** | Banner "You're offline" / retry; preserve form input. |

---

## 10. Screen Inventory

| # | Route | Screen | Access | Key states |
|---|---|---|---|---|
| 1 | `/` | Landing | Public | loading images, error-free static |
| 2 | `/properties` | Marketplace | Public | loading, empty, error, filtered |
| 3 | `/properties/[id]` | Property detail | Public | loading, 404, sold-out, logged-out CTA |
| 4 | `/login` | Login | Public | error, loading |
| 5 | `/signup` | Signup | Public | field errors, loading, success |
| 6 | `/forgot-password` | Forgot password | Public | success, error |
| 7 | `/reset-password` | Reset password | Public | invalid token, success |
| 8 | `/investor` | Dashboard | Investor | zero state, KYC banner, loading |
| 9 | `/investor/invest/[id]` | Checkout | Investor | blocked (KYC / balance / units), confirm, success, error |
| 10 | `/investor/portfolio` | Portfolio | Investor | empty, loading, filtered |
| 11 | `/investor/portfolio/[propertyId]` | Holding detail | Investor | each timeline stage, SOLD payout |
| 12 | `/investor/wallet` | Wallet | Investor | add-money flow, withdraw, empty ledger |
| 13 | `/investor/kyc` | KYC | Investor | 4 statuses, upload errors |
| 14 | `/notifications` | Notifications | Authenticated | empty, unread |
| — | Shared | Navbar, Footer, Sidebar, Toasts, Modals, 404/500 | — | — |

---

## 11. Reusable Component Rules

1. **Build once, reuse everywhere:** `Button`, `Input`, `Select`, `Checkbox`, `Card`, `StatCard`, `Badge/StatusChip`, `ProgressBar`, `Modal`, `Toast`, `Table`, `EmptyState`, `ErrorState`, `Skeleton`, `PropertyCard`, `MoneyText`, `Timeline`, `DonutChart`. No page-specific restyling of these.
2. **`MoneyText`** is the only way to render ₹ values (handles `en-IN`, compact mode, tabular nums, `+/−` and credit/debit color + icon).
3. **`StatusChip`** takes a typed status union (`'LIVE' | 'FUNDED' | 'HOLDING' | 'SOLD' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_SUBMITTED'`) and always renders icon + text.
4. **Props over variants sprawl:** variants limited to those in this spec; every interactive component supports `disabled`, `loading` and accessible name.
5. **Tokens only:** colors, spacing, radius, shadows via Tailwind theme extensions — no hard-coded hex or arbitrary pixel values in components.
6. **Accessibility baseline:** semantic HTML first, visible `focus-visible` ring, labels on every control, `aria-live` for dynamic totals/toasts, logical heading order (one H1 per page), alt text on property images, 4.5:1 text contrast, 3:1 UI contrast, keyboard operability for sliders, modals, accordions, tabs, file upload.
7. **Data states:** every data-driven component accepts `isLoading`, `isError`, and empty data and renders the matching pattern from §9.
8. **Motion:** 150–200ms ease-out for hover/focus/modal; none essential to meaning; respect `prefers-reduced-motion`.
9. **Content tone:** plain, reassuring, specific amounts ("You need ₹12,500 more"), no jargon, no hype words.
10. **Consistency check before merging a screen:** uses shared components only → states covered → 360/768/1280 checked → no horizontal scroll → keyboard pass → no status by color alone.