# Estate Investment Portal (`estate-investment-portal`)

An institutional-grade, full-stack web application designed for fractional real estate syndication, automated dividend distributions, investor portfolio analytics, and secondary market liquidity.

---

## 1. Executive Summary & Architecture Overview

The **Estate Investment Portal** bridges the gap between individual retail/accredited investors and commercial real estate assets. It enables fractionalized asset ownership, automated KYC/AML verification, legal document e-signatures, real-time rental yield calculation, and portfolio performance tracking.

### 1.1 High-Level Architecture Diagram

```
+---------------------------------------------------------------------------------------+
|                                    Client Layer                                       |
|  - Next.js 14 / React 18 (App Router) + TypeScript + Tailwind CSS                      |
|  - Zustand (Client State) + React Query / TanStack Query (Server State Cache)          |
|  - Recharts / Tremor (Financial Visualizations & Yield Curves)                         |
|  - Lucide React Icons + Radix UI Primitives                                           |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v  HTTPS / REST / Server Actions / WSS
+---------------------------------------------------------------------------------------+
|                                Application & API Layer                                |
|  - Next.js Server Actions & API Route Handlers (/api/properties, /api/invest, etc.)   |
|  - Real Estate Financial Math Engine (IRR, Cap Rate, CoC, Rental Yield, NAV)           |
|  - E-Signature & Data Room Engine (PDF Generation, Audit Trail)                       |
|  - Automated Distribution & Dividend Allocation Service                               |
+-------------------------------------------+-------------------------------------------+
                                            |
                     +----------------------+----------------------+
                     |                                             |
                     v                                             v
+---------------------------------------+     +-----------------------------------------+
|        Data Persistence Layer         |     |        External Integration Layer       |
|  - PostgreSQL via Supabase / Prisma   |     |  - Stripe / Razorpay (Escrow Payments)  |
|  - Row Level Security (RLS) Policies  |     |  - Persona / Sumsub / IDfy (KYC/AML)    |
|  - Supabase Auth (JWT, RBAC)          |     |  - AWS S3 / Supabase Storage (Deeds)    |
|  - Redis Cache (Upstash / Redis OM)   |     |  - Resend / SendGrid (Investor Reports) |
+---------------------------------------+     +-----------------------------------------+
```

### 1.2 Core Capabilities

- **Fractional Asset Tokenization / Ledgering:** Divides multi-million dollar residential and commercial assets into affordable fractional units with clear cap tables.
- **Dynamic Yield & Cash Flow Engine:** Evaluates Net Operating Income (NOI), Capitalization Rate (Cap Rate), Cash-on-Cash Return (CoC), and Internal Rate of Return (IRR) with interactive scenario modeling.
- **Automated Investor Onboarding & Compliance:** Multi-stage KYC/AML workflow, accredited investor qualification check, and digital subscription agreements.
- **Investor Dashboard & Virtual Data Room:** Granular ledger showing fractional units owned, quarterly dividend distributions, asset valuation updates, inspection reports, and tax documents (Form 1099/K-1 equivalents).
- **Secondary Market / Liquidity Desk:** Order-book matching engine for peer-to-peer trading of fractional real estate stakes among verified portal members.

---

## 2. Exhaustive Directory Tree

```
estate-investment-portal/
├── .env.example
├── .eslintrc.json
├── .gitignore
├── .prettierrc
├── README.md
├── docker-compose.yml
├── Dockerfile
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   ├── favicon.ico
│   ├── placeholder-property.jpg
│   └── assets/
│       └── logo.svg
└── src/
    ├── app/
    │   ├── favicon.ico
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── (auth)/
    │   │   ├── login/
    │   │   │   └── page.tsx
    │   │   ├── register/
    │   │   │   └── page.tsx
    │   │   └── verify-kyc/
    │   │       └── page.tsx
    │   ├── (dashboard)/
    │   │   ├── layout.tsx
    │   │   ├── dashboard/
    │   │   │   └── page.tsx
    │   │   ├── portfolio/
    │   │   │   └── page.tsx
    │   │   ├── transactions/
    │   │   │   └── page.tsx
    │   │   └── settings/
    │   │       └── page.tsx
    │   ├── properties/
    │   │   ├── page.tsx
    │   │   └── [id]/
    │   │       ├── page.tsx
    │   │       └── data-room/
    │   │           └── page.tsx
    │   ├── marketplace/
    │   │   └── page.tsx
    │   └── api/
    │       ├── auth/
    │       │   └── callback/
    │       │       └── route.ts
    │       ├── properties/
    │       │   ├── route.ts
    │       │   └── [id]/
    │       │       └── route.ts
    │       ├── investments/
    │       │   ├── checkout/
    │       │   │   └── route.ts
    │       │   └── webhook/
    │       │       └── route.ts
    │       ├── secondary-market/
    │       │   ├── orders/
    │       │   │   └── route.ts
    │       │   └── match/
    │       │       └── route.ts
    │       └── reports/
    │           └── dividend-statement/
    │               └── route.ts
    ├── components/
    │   ├── common/
    │   │   ├── Button.tsx
    │   │   ├── Badge.tsx
    │   │   ├── Card.tsx
    │   │   ├── Input.tsx
    │   │   ├── Modal.tsx
    │   │   └── Navbar.tsx
    │   ├── properties/
    │   │   ├── PropertyCard.tsx
    │   │   ├── PropertyFilter.tsx
    │   │   ├── PropertyFinancials.tsx
    │   │   ├── PropertyGallery.tsx
    │   │   └── DataRoomViewer.tsx
    │   ├── investment/
    │   │   ├── FractionalCalculator.tsx
    │   │   ├── InvestmentModal.tsx
    │   │   ├── SubscriptionAgreementModal.tsx
    │   │   └── PaymentStatus.tsx
    │   ├── dashboard/
    │   │   ├── MetricGrid.tsx
    │   │   ├── PortfolioAllocationChart.tsx
    │   │   ├── DistributionHistoryTable.tsx
    │   │   └── UpcomingPayoutsCard.tsx
    │   ├── marketplace/
    │   │   ├── OrderBookTable.tsx
    │   │   ├── CreateListingModal.tsx
    │   │   └── TradeHistory.tsx
    │   └── kyc/
    │       ├── IdentityVerificationStep.tsx
    │       ├── AccreditedInvestorSurvey.tsx
    │       └── DocumentUploadDropzone.tsx
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useProperties.ts
    │   ├── useFinancialMath.ts
    │   ├── usePortfolioMetrics.ts
    │   └── useSecondaryMarket.ts
    ├── lib/
    │   ├── constants.ts
    │   ├── db.ts
    │   ├── financialMath.ts
    │   ├── formatters.ts
    │   ├── paymentGateway.ts
    │   ├── supabaseClient.ts
    │   └── validators.ts
    ├── stores/
    │   ├── authStore.ts
    │   ├── investmentCartStore.ts
    │   └── uiStore.ts
    └── types/
        ├── database.ts
        ├── financial.ts
        ├── marketplace.ts
        ├── property.ts
        └── user.ts
```

---

## 3. Configuration & Dependency Manifests

### 3.1 `package.json`

```json
{
  "name": "estate-investment-portal",
  "version": "1.0.0",
  "private": true,
  "description": "Enterprise Fractional Real Estate Syndication and Secondary Market Portal",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.3.4",
    "@prisma/client": "^5.14.0",
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-slider": "^1.1.2",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@supabase/supabase-js": "^2.43.4",
    "@tanstack/react-query": "^5.40.0",
    "@tanstack/react-table": "^8.17.3",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0",
    "framer-motion": "^11.2.10",
    "lucide-react": "^0.383.0",
    "next": "^14.2.3",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.51.5",
    "recharts": "^2.12.7",
    "stripe": "^15.9.0",
    "tailwind-merge": "^2.3.0",
    "zod": "^3.23.8",
    "zustand": "^4.5.2"
  },
  "devDependencies": {
    "@types/node": "^20.12.12",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "eslint-config-next": "14.2.3",
    "postcss": "^8.4.38",
    "prisma": "^5.14.0",
    "tailwindcss": "^3.4.3",
    "ts-node": "^10.9.2",
    "typescript": "^5.4.5",
    "vitest": "^1.6.0"
  }
}
```

### 3.2 `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "es2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 3.3 `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#0F3E36", // Sophisticated Deep Emerald Forest Green
          foreground: "#F4F7F5",
          50: "#EAF3F0",
          100: "#D5E8E2",
          500: "#0F3E36",
          600: "#0B2E28",
          700: "#08211D",
        },
        secondary: {
          DEFAULT: "#C59B27", // Subtle Rich Gold / Champagne Accent
          foreground: "#111827",
          50: "#FAF7EE",
          100: "#F5EED6",
          500: "#C59B27",
          600: "#9E7B1A",
        },
        slate: {
          850: "#151F30",
          950: "#0A0F1D",
        },
        emerald: {
          500: "#10B981",
          600: "#059669",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-playfair)", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
```

---

## 4. Comprehensive Database Schema (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum UserRole {
  INVESTOR
  ACCREDITED_INVESTOR
  SPONSOR
  ADMIN
  AUDITOR
}

enum KycStatus {
  UNVERIFIED
  PENDING
  VERIFIED
  REJECTED
}

enum PropertyType {
  COMMERCIAL_OFFICE
  MULTI_FAMILY_RESIDENTIAL
  INDUSTRIAL_LOGISTICS
  RETAIL_STRIP_CENTER
  DATA_CENTER
}

enum InvestmentStatus {
  FUNDING_ACTIVE
  FULLY_FUNDED
  STABILIZED_RENTAL
  DIVESTED
  CANCELLED
}

enum TransactionType {
  PRIMARY_PURCHASE
  SECONDARY_SALE
  DIVIDEND_PAYOUT
  WALLET_DEPOSIT
  WALLET_WITHDRAWAL
}

enum TransactionStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REVERSED
}

enum OrderType {
  BUY_LIMIT
  SELL_LIMIT
}

enum OrderStatus {
  OPEN
  PARTIALLY_FILLED
  FILLED
  CANCELLED
}

model User {
  id                String            @id @default(uuid())
  email             String            @unique
  hashedPassword    String
  fullName          String
  phone             String?
  role              UserRole          @default(INVESTOR)
  kycStatus         KycStatus         @default(UNVERIFIED)
  kycVerifiedAt     DateTime?
  walletBalance     Decimal           @default(0.00) @db.Decimal(14, 2)
  escrowBalance     Decimal           @default(0.00) @db.Decimal(14, 2)
  accreditationDocs String[]
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  // Relationships
  investments       InvestmentStake[]
  transactions      Transaction[]
  orders            MarketOrder[]
  kycLogs           KycLog[]
  auditEvents       AuditEvent[]

  @@map("users")
}

model Property {
  id                  String             @id @default(uuid())
  slug                String             @unique
  title               String
  tagline             String
  description         String             @db.Text
  propertyType        PropertyType
  addressLine1        String
  city                String
  state               String
  postalCode          String
  country             String             @default("US")
  latitude            Float?
  longitude           Float?

  // Financial Metrics
  totalAssetValue     Decimal            @db.Decimal(14, 2)
  targetRaiseAmount   Decimal            @db.Decimal(14, 2)
  currentRaisedAmount Decimal            @default(0.00) @db.Decimal(14, 2)
  sharePrice          Decimal            @db.Decimal(10, 2)
  totalShares         Int
  availableShares     Int
  minimumInvestment   Decimal            @default(100.00) @db.Decimal(10, 2)
  projectedIrr        Decimal            @db.Decimal(5, 2) // e.g., 14.50%
  projectedAnnualYield Decimal           @db.Decimal(5, 2) // e.g., 8.20%
  distributionFrequency String           @default("QUARTERLY") // MONTHLY, QUARTERLY, ANNUAL
  holdingPeriodMonths Int                @default(60)

  // Status & Timing
  status              InvestmentStatus   @default(FUNDING_ACTIVE)
  fundingStartDate    DateTime           @default(now())
  fundingClosingDate  DateTime?
  stabilizationDate   DateTime?

  // Property Details
  grossSquareFeet     Int
  yearBuilt           Int
  occupancyRate       Decimal            @db.Decimal(5, 2)
  noiAnnual           Decimal            @db.Decimal(14, 2)
  images              String[]
  blueprintUrl        String?
  virtualTourUrl      String?

  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt

  // Relationships
  documents           PropertyDocument[]
  stakes              InvestmentStake[]
  dividends           DividendDistribution[]
  marketOrders        MarketOrder[]

  @@index([status, propertyType])
  @@index([city, state])
  @@map("properties")
}

model PropertyDocument {
  id              String    @id @default(uuid())
  propertyId      String
  name            String
  category        String    // PROSPECTUS, FINANCIAL_MODEL, TITLE_DEED, INSPECTION, TAX_ASSESSMENT
  fileUrl         String
  fileSize        Int
  isRestricted    Boolean   @default(true) // Requires KYC to view
  uploadedAt      DateTime  @default(now())

  property        Property  @relation(fields: [propertyId], references: [id], onDelete: Cascade)

  @@map("property_documents")
}

model InvestmentStake {
  id                String           @id @default(uuid())
  userId            String
  propertyId        String
  sharesOwned       Int
  totalAmountPaid   Decimal          @db.Decimal(14, 2)
  averageCostPerShare Decimal        @db.Decimal(10, 2)
  purchaseDate      DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  user              User             @relation(fields: [userId], references: [id])
  property          Property         @relation(fields: [propertyId], references: [id])
  dividendsReceived DividendPayout[]

  @@unique([userId, propertyId])
  @@map("investment_stakes")
}

model DividendDistribution {
  id                String           @id @default(uuid())
  propertyId        String
  periodTitle       String           // e.g. "Q2 2024 Operating Distribution"
  declarationDate   DateTime         @default(now())
  payoutDate        DateTime
  totalDistributionAmount Decimal    @db.Decimal(14, 2)
  perShareDistribution Decimal       @db.Decimal(10, 4)
  notes             String?

  property          Property         @relation(fields: [propertyId], references: [id])
  payouts           DividendPayout[]

  @@map("dividend_distributions")
}

model DividendPayout {
  id                String               @id @default(uuid())
  distributionId    String
  stakeId           String
  sharesEligible    Int
  payoutAmount      Decimal              @db.Decimal(12, 2)
  paidAt            DateTime             @default(now())

  distribution      DividendDistribution @relation(fields: [distributionId], references: [id])
  stake             InvestmentStake      @relation(fields: [stakeId], references: [id])

  @@map("dividend_payouts")
}

model MarketOrder {
  id              String      @id @default(uuid())
  userId          String
  propertyId      String
  orderType       OrderType
  totalShares     Int
  filledShares    Int         @default(0)
  targetPrice     Decimal     @db.Decimal(10, 2)
  status          OrderStatus @default(OPEN)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  user            User        @relation(fields: [userId], references: [id])
  property        Property    @relation(fields: [propertyId], references: [id])

  @@index([propertyId, status, orderType])
  @@map("market_orders")
}

model Transaction {
  id                String            @id @default(uuid())
  userId            String
  type              TransactionType
  status            TransactionStatus @default(PENDING)
  amount            Decimal           @db.Decimal(14, 2)
  feeAmount         Decimal           @default(0.00) @db.Decimal(8, 2)
  paymentProvider   String?           // STRIPE, ACH, WIRE, INTERNAL_ESCROW
  referenceId       String?           // External charge/payment intent id
  metadata          Json?
  createdAt         DateTime          @default(now())

  user              User              @relation(fields: [userId], references: [id])

  @@index([userId, status, type])
  @@map("transactions")
}

model KycLog {
  id          String    @id @default(uuid())
  userId      String
  provider    String
  vendorRefId String?
  verdict     String
  reason      String?
  rawPayload  Json?
  verifiedAt  DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("kyc_logs")
}

model AuditEvent {
  id          String    @id @default(uuid())
  userId      String?
  action      String
  entityType  String
  entityId    String
  ipAddress   String?
  userAgent   String?
  timestamp   DateTime  @default(now())

  user        User?     @relation(fields: [userId], references: [id])

  @@map("audit_events")
}
```

---

## 5. Domain Type Definitions

### 5.1 `src/types/property.ts`

```typescript
export type PropertyType =
  | 'COMMERCIAL_OFFICE'
  | 'MULTI_FAMILY_RESIDENTIAL'
  | 'INDUSTRIAL_LOGISTICS'
  | 'RETAIL_STRIP_CENTER'
  | 'DATA_CENTER';

export type InvestmentStatus =
  | 'FUNDING_ACTIVE'
  | 'FULLY_FUNDED'
  | 'STABILIZED_RENTAL'
  | 'DIVESTED'
  | 'CANCELLED';

export interface PropertyFinancials {
  totalAssetValue: number;
  targetRaiseAmount: number;
  currentRaisedAmount: number;
  sharePrice: number;
  totalShares: number;
  availableShares: number;
  minimumInvestment: number;
  projectedIrr: number; // e.g. 14.5%
  projectedAnnualYield: number; // e.g. 8.2%
  distributionFrequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  holdingPeriodMonths: number;
  noiAnnual: number;
  occupancyRate: number;
}

export interface PropertyDocumentItem {
  id: string;
  name: string;
  category: string;
  fileUrl: string;
  fileSize: number;
  isRestricted: boolean;
  uploadedAt: string;
}

export interface PropertyItem extends PropertyFinancials {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  propertyType: PropertyType;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  status: InvestmentStatus;
  grossSquareFeet: number;
  yearBuilt: number;
  images: string[];
  documents?: PropertyDocumentItem[];
  fundingProgressPct: number;
  createdAt: string;
}
```

### 5.2 `src/types/financial.ts`

```typescript
export interface CashFlowProjection {
  year: number;
  grossRentalRevenue: number;
  operatingExpenses: number;
  netOperatingIncome: number;
  debtService: number;
  distributableCashFlow: number;
  investorDividendYield: number;
  estimatedAssetValuation: number;
}

export interface InvestmentScenario {
  initialInvestment: number;
  holdingPeriodYears: number;
  annualAppreciationRate: number;
  reinvestmentEnabled: boolean;
}

export interface ScenarioCalculationResult {
  totalRentalPayouts: number;
  projectedCapitalGain: number;
  totalExitProceeds: number;
  netProfit: number;
  equityMultiple: number;
  irr: number;
  yearlyBreakdown: CashFlowProjection[];
}
```

---

## 6. Financial Mathematics & Valuation Engine

### 6.1 `src/lib/financialMath.ts`

```typescript
import { CashFlowProjection, ScenarioCalculationResult } from '@/types/financial';

/**
 * Calculates Net Operating Income (NOI).
 * NOI = Gross Operating Income - Operating Expenses
 */
export function calculateNOI(grossIncome: number, operatingExpenses: number): number {
  return Math.max(0, grossIncome - operatingExpenses);
}

/**
 * Calculates Capitalization Rate (Cap Rate).
 * Cap Rate = NOI / Property Purchase Price or Current Valuation
 */
export function calculateCapRate(noi: number, propertyValue: number): number {
  if (propertyValue <= 0) return 0;
  return (noi / propertyValue) * 100;
}

/**
 * Calculates Cash-on-Cash Return.
 * CoC = Annual Cash Flow (Pre-Tax) / Initial Total Cash Invested
 */
export function calculateCashOnCash(annualCashFlow: number, cashInvested: number): number {
  if (cashInvested <= 0) return 0;
  return (annualCashFlow / cashInvested) * 100;
}

/**
 * Approximates Internal Rate of Return (IRR) via Newton-Raphson method.
 * @param cashFlows Cash flows where cashFlows[0] is negative initial investment
 * @param guess Initial estimate (default: 0.10 for 10%)
 */
export function calculateIRR(cashFlows: number[], guess: number = 0.1): number {
  const maxIterations = 1000;
  const tolerance = 1e-7;
  let rate = guess;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dNpv = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      const discountFactor = Math.pow(1 + rate, t);
      npv += cashFlows[t] / discountFactor;
      if (t > 0) {
        dNpv -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
      }
    }

    if (Math.abs(npv) < tolerance) {
      return rate * 100;
    }

    if (Math.abs(dNpv) < 1e-10) {
      break;
    }

    const newRate = rate - npv / dNpv;
    if (isNaN(newRate) || !isFinite(newRate)) {
      break;
    }
    rate = newRate;
  }

  return rate * 100;
}

/**
 * Generates an exhaustive multi-year scenario forecast for an investor.
 */
export function generateScenarioProjections(
  investmentAmount: number,
  baseYieldPct: number,
  appreciationPct: number,
  holdingYears: number = 5,
  shareCost: number = 50
): ScenarioCalculationResult {
  const shares = Math.floor(investmentAmount / shareCost);
  const actualInvestment = shares * shareCost;

  const yearlyBreakdown: CashFlowProjection[] = [];
  let cumulativeDividends = 0;
  let currentValuation = actualInvestment;

  const cashFlowsForIrr: number[] = [-actualInvestment];

  for (let year = 1; year <= holdingYears; year++) {
    // Rental yield indexed slightly by 2% inflation adjustments
    const yearYieldRate = (baseYieldPct / 100) * Math.pow(1.02, year - 1);
    const annualRentalCash = actualInvestment * yearYieldRate;
    cumulativeDividends += annualRentalCash;

    // Asset appreciation compounded
    currentValuation = currentValuation * (1 + appreciationPct / 100);

    const isExitYear = year === holdingYears;
    const netCashFlowThisYear = isExitYear ? annualRentalCash + currentValuation : annualRentalCash;
    cashFlowsForIrr.push(netCashFlowThisYear);

    yearlyBreakdown.push({
      year,
      grossRentalRevenue: annualRentalCash * 1.35, // typical gross
      operatingExpenses: annualRentalCash * 0.35, // typical expense ratio
      netOperatingIncome: annualRentalCash,
      debtService: 0,
      distributableCashFlow: annualRentalCash,
      investorDividendYield: yearYieldRate * 100,
      estimatedAssetValuation: currentValuation,
    });
  }

  const capitalGain = currentValuation - actualInvestment;
  const totalExitProceeds = currentValuation + cumulativeDividends;
  const netProfit = totalExitProceeds - actualInvestment;
  const equityMultiple = totalExitProceeds / actualInvestment;
  const computedIrr = calculateIRR(cashFlowsForIrr, 0.12);

  return {
    totalRentalPayouts: cumulativeDividends,
    projectedCapitalGain: capitalGain,
    totalExitProceeds,
    netProfit,
    equityMultiple: parseFloat(equityMultiple.toFixed(2)),
    irr: parseFloat(computedIrr.toFixed(2)),
    yearlyBreakdown,
  };
}
```

---

## 7. Global State Management (Zustand Stores)

### 7.1 `src/stores/investmentCartStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartAllocation {
  propertyId: string;
  propertyTitle: string;
  sharePrice: number;
  shares: number;
  totalCost: number;
}

interface CartStore {
  allocations: Record<string, CartAllocation>;
  setAllocation: (propertyId: string, propertyTitle: string, sharePrice: number, shares: number) => void;
  removeAllocation: (propertyId: string) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
  getTotalShares: () => number;
}

export const useInvestmentCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      allocations: {},
      setAllocation: (propertyId, propertyTitle, sharePrice, shares) => {
        if (shares <= 0) {
          const current = { ...get().allocations };
          delete current[propertyId];
          set({ allocations: current });
          return;
        }

        set((state) => ({
          allocations: {
            ...state.allocations,
            [propertyId]: {
              propertyId,
              propertyTitle,
              sharePrice,
              shares,
              totalCost: sharePrice * shares,
            },
          },
        }));
      },
      removeAllocation: (propertyId) => {
        set((state) => {
          const updated = { ...state.allocations };
          delete updated[propertyId];
          return { allocations: updated };
        });
      },
      clearCart: () => set({ allocations: {} }),
      getTotalAmount: () => {
        const items = Object.values(get().allocations);
        return items.reduce((sum, item) => sum + item.totalCost, 0);
      },
      getTotalShares: () => {
        const items = Object.values(get().allocations);
        return items.reduce((sum, item) => sum + item.shares, 0);
      },
    }),
    {
      name: 'estate-investment-cart',
    }
  )
);
```

---

## 8. High-Performance UI Components

### 8.1 Interactive Property Investment Card (`src/components/properties/PropertyCard.tsx`)

```tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Building2, TrendingUp, DollarSign, Users, MapPin } from 'lucide-react';
import { PropertyItem } from '@/types/property';
import { formatCurrency, formatPercent } from '@/lib/formatters';

interface PropertyCardProps {
  property: PropertyItem;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const fundingPercent = Math.min(
    100,
    Math.round((property.currentRaisedAmount / property.targetRaiseAmount) * 100)
  );

  return (
    <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* Property Visual Header */}
      <div className="relative h-56 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <Image
          src={property.images[0] || '/placeholder-property.jpg'}
          alt={property.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute top-3 left-3 bg-emerald-950/80 backdrop-blur-md text-emerald-300 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-500/30">
          {property.propertyType.replace('_', ' ')}
        </div>
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs font-medium px-2 py-1 rounded-md">
          {property.distributionFrequency} Payouts
        </div>
      </div>

      {/* Main Details Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center text-slate-500 dark:text-slate-400 text-xs mb-1.5 gap-1">
            <MapPin className="w-3.5 h-3.5 text-secondary-500" />
            <span>
              {property.city}, {property.state}
            </span>
          </div>

          <h3 className="font-semibold text-lg text-slate-900 dark:text-white line-clamp-1 group-hover:text-primary-500 dark:group-hover:text-primary-100 transition-colors">
            {property.title}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-xs line-clamp-2 mt-1 mb-4">
            {property.tagline}
          </p>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 dark:border-slate-800/80 mb-4 bg-slate-50/50 dark:bg-slate-850/40 rounded-lg px-3">
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Target Yield
              </p>
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-base">
                <TrendingUp className="w-4 h-4" />
                <span>{formatPercent(property.projectedAnnualYield)}</span>
              </div>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Projected IRR
              </p>
              <div className="flex items-center gap-1 text-slate-900 dark:text-white font-bold text-base">
                <span>{formatPercent(property.projectedIrr)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Funding Progress Meter */}
        <div>
          <div className="flex justify-between text-xs mb-1.5 font-medium">
            <span className="text-slate-700 dark:text-slate-300">
              {formatCurrency(property.currentRaisedAmount)} raised
            </span>
            <span className="text-slate-500 dark:text-slate-400">{fundingPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
            <div
              className="bg-primary-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${fundingPercent}%` }}
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-[11px] text-slate-500 block">Min. Investment</span>
              <span className="font-semibold text-sm text-slate-900 dark:text-white">
                {formatCurrency(property.minimumInvestment)}
              </span>
            </div>

            <Link
              href={`/properties/${property.id}`}
              className="inline-flex items-center justify-center bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              Analyze & Invest
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 8.2 Real-Time Fractional Investment & ROI Simulator (`src/components/investment/FractionalCalculator.tsx`)

```tsx
'use client';

import React, { useState, useMemo } from 'react';
import { DollarSign, Percent, Calendar, ShieldCheck, ArrowRight } from 'lucide-react';
import { generateScenarioProjections } from '@/lib/financialMath';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface FractionalCalculatorProps {
  propertyId: string;
  sharePrice: number;
  projectedAnnualYield: number;
  projectedIrr: number;
  holdingPeriodYears?: number;
  onInitiateInvestment: (shares: number, totalAmount: number) => void;
}

export const FractionalCalculator: React.FC<FractionalCalculatorProps> = ({
  sharePrice,
  projectedAnnualYield,
  projectedIrr,
  holdingPeriodYears = 5,
  onInitiateInvestment,
}) => {
  const [shares, setShares] = useState<number>(20);
  const totalInvestment = shares * sharePrice;

  // Calculate real projections dynamically
  const simulation = useMemo(() => {
    return generateScenarioProjections(
      totalInvestment,
      projectedAnnualYield,
      3.5, // 3.5% conservative annual capital appreciation
      holdingPeriodYears,
      sharePrice
    );
  }, [totalInvestment, projectedAnnualYield, holdingPeriodYears, sharePrice]);

  const chartData = useMemo(() => {
    return simulation.yearlyBreakdown.map((item) => ({
      name: `Yr ${item.year}`,
      Valuation: Math.round(item.estimatedAssetValuation),
      Payouts: Math.round(item.distributableCashFlow),
    }));
  }, [simulation]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Investment & Returns Simulator
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Customize your fractional ownership allocation to calculate projected quarterly dividends
          and capital gains upon exit.
        </p>
      </div>

      {/* Input Slider & Counter */}
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Quantity of Fractional Shares
            </label>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md font-mono font-medium text-slate-600 dark:text-slate-300">
              {formatCurrency(sharePrice)} / share
            </span>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="range"
              min={2}
              max={500}
              step={1}
              value={shares}
              onChange={(e) => setShares(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <input
              type="number"
              min={1}
              value={shares}
              onChange={(e) => setShares(Math.max(1, Number(e.target.value)))}
              className="w-20 px-2 py-1 text-center font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-md bg-transparent"
            />
          </div>
        </div>

        {/* Investment Amount Overview */}
        <div className="p-4 bg-primary-50 dark:bg-slate-850 rounded-xl flex items-center justify-between border border-primary-100 dark:border-slate-800">
          <div>
            <span className="text-xs text-primary-700 dark:text-slate-400 font-medium">
              Total Capital Committed
            </span>
            <div className="text-2xl font-black text-primary-900 dark:text-white">
              {formatCurrency(totalInvestment)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-primary-700 dark:text-slate-400 font-medium">
              Estimated Annual Yield
            </span>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency((totalInvestment * projectedAnnualYield) / 100)} / yr
            </div>
          </div>
        </div>

        {/* Financial Projection Metrics */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-lg">
            <span className="text-[11px] text-slate-500 block mb-1">Target IRR</span>
            <span className="font-bold text-slate-900 dark:text-white text-base">
              {formatPercent(simulation.irr)}
            </span>
          </div>
          <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-lg">
            <span className="text-[11px] text-slate-500 block mb-1">Total Dividends</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
              {formatCurrency(simulation.totalRentalPayouts)}
            </span>
          </div>
          <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-lg">
            <span className="text-[11px] text-slate-500 block mb-1">Equity Multiple</span>
            <span className="font-bold text-secondary-600 dark:text-secondary-400 text-base">
              {simulation.equityMultiple}x
            </span>
          </div>
        </div>

        {/* Forecast Visualization Chart */}
        <div className="h-44 w-full pt-2">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            Projected Asset Equity & Cumulative Cash Return ({holdingPeriodYears}-Year Horizon)
          </p>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F3E36" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#0F3E36" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
              <YAxis stroke="#888888" fontSize={11} tickLine={false} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="Valuation"
                stroke="#0F3E36"
                fillOpacity={1}
                fill="url(#valGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Call to Action button */}
        <button
          onClick={() => onInitiateInvestment(shares, totalInvestment)}
          className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-md active:scale-[0.99]"
        >
          <span>Commit Investment ({formatCurrency(totalInvestment)})</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Regulated under SEC Regulation D / Title III Crowdfunding standards.
        </p>
      </div>
    </div>
  );
};
```

### 8.3 Investor Dashboard Metrics Overview (`src/components/dashboard/MetricGrid.tsx`)

```tsx
import React from 'react';
import { DollarSign, TrendingUp, Building, ArrowUpRight, PieChart } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/formatters';

interface MetricGridProps {
  portfolioValue: number;
  totalDividendsEarned: number;
  averageAnnualYield: number;
  activePropertiesCount: number;
}

export const MetricGrid: React.FC<MetricGridProps> = ({
  portfolioValue,
  totalDividendsEarned,
  averageAnnualYield,
  activePropertiesCount,
}) => {
  const cards = [
    {
      label: 'Portfolio Net Asset Value',
      value: formatCurrency(portfolioValue),
      change: '+11.8% past 12m',
      isPositive: true,
      icon: DollarSign,
      accent: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Cumulative Rental Dividends',
      value: formatCurrency(totalDividendsEarned),
      change: 'Quarterly payout on 15th',
      isPositive: true,
      icon: TrendingUp,
      accent: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Weighted Average Yield',
      value: formatPercent(averageAnnualYield),
      change: 'Consistent cash flow',
      isPositive: true,
      icon: PieChart,
      accent: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Active Syndications',
      value: activePropertiesCount.toString(),
      change: 'Commercial & Multi-family',
      isPositive: false,
      icon: Building,
      accent: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const IconComponent = card.icon;
        return (
          <div
            key={i}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {card.label}
              </span>
              <div className={`p-2 rounded-lg ${card.accent}`}>
                <IconComponent className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
              {card.value}
            </div>
            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
              {card.isPositive && (
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 mr-0.5 inline" />
              )}
              <span>{card.change}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
```

---

## 9. Next.js 14 API Handlers & Automated Matching Engine

### 9.1 Property Investment Checkout API (`src/app/api/investments/checkout/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const CheckoutSchema = z.object({
  propertyId: z.string().uuid(),
  userId: z.string().uuid(),
  sharesToBuy: z.number().int().positive(),
  paymentMethod: z.enum(['ESCROW_WALLET', 'STRIPE_ACH', 'WIRE_TRANSFER']),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const payload = CheckoutSchema.parse(json);

    // Run within atomic transaction to prevent share overselling race conditions
    const result = await prisma.$transaction(async (tx) => {
      const property = await tx.property.findUnique({
        where: { id: payload.propertyId },
      });

      if (!property) {
        throw new Error('Target property not found.');
      }

      if (property.status !== 'FUNDING_ACTIVE') {
        throw new Error('This asset is not accepting new investment allocations.');
      }

      if (property.availableShares < payload.sharesToBuy) {
        throw new Error(`Insufficient shares remaining. Requested: ${payload.sharesToBuy}, Available: ${property.availableShares}`);
      }

      const totalCapitalCommitment = Number(property.sharePrice) * payload.sharesToBuy;

      if (totalCapitalCommitment < Number(property.minimumInvestment)) {
        throw new Error(`Commitment does not meet minimum investment hurdle of $${property.minimumInvestment}`);
      }

      // Check User Status & KYC
      const user = await tx.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        throw new Error('Investor record not found.');
      }

      if (user.kycStatus !== 'VERIFIED') {
        throw new Error('KYC/AML verification required prior to finalizing equity investment.');
      }

      // If paying via platform wallet:
      if (payload.paymentMethod === 'ESCROW_WALLET') {
        if (Number(user.walletBalance) < totalCapitalCommitment) {
          throw new Error('Insufficient wallet funds for this allocation.');
        }

        // Deduct wallet balance
        await tx.user.update({
          where: { id: user.id },
          data: {
            walletBalance: { decrement: totalCapitalCommitment },
          },
        });
      }

      // Update property share allocation
      const updatedProperty = await tx.property.update({
        where: { id: property.id },
        data: {
          availableShares: { decrement: payload.sharesToBuy },
          currentRaisedAmount: { increment: totalCapitalCommitment },
          status:
            property.availableShares - payload.sharesToBuy === 0
              ? 'FULLY_FUNDED'
              : 'FUNDING_ACTIVE',
        },
      });

      // Upsert Investment Stake
      const stake = await tx.investmentStake.upsert({
        where: {
          userId_propertyId: {
            userId: user.id,
            propertyId: property.id,
          },
        },
        create: {
          userId: user.id,
          propertyId: property.id,
          sharesOwned: payload.sharesToBuy,
          totalAmountPaid: totalCapitalCommitment,
          averageCostPerShare: property.sharePrice,
        },
        update: {
          sharesOwned: { increment: payload.sharesToBuy },
          totalAmountPaid: { increment: totalCapitalCommitment },
        },
      });

      // Record transaction ledger
      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'PRIMARY_PURCHASE',
          status: 'COMPLETED',
          amount: totalCapitalCommitment,
          paymentProvider: payload.paymentMethod,
          metadata: {
            propertyId: property.id,
            sharesPurchased: payload.sharesToBuy,
            pricePerShare: Number(property.sharePrice),
          },
        },
      });

      // Record Audit Event
      await tx.auditEvent.create({
        data: {
          userId: user.id,
          action: 'PRIMARY_EQUITY_STAKE_PURCHASED',
          entityType: 'PROPERTY',
          entityId: property.id,
        },
      });

      return {
        stakeId: stake.id,
        transactionId: transaction.id,
        sharesCommitted: payload.sharesToBuy,
        totalCapital: totalCapitalCommitment,
        propertyStatus: updatedProperty.status,
      };
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Transaction processing failure' },
      { status: 400 }
    );
  }
}
```

### 9.2 Secondary Market Order Matching Engine (`src/app/api/secondary-market/match/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Executes a limit-order matching pass across open buy and sell orders.
 * Follows Price-Time Priority (FIFO at best clearing price).
 */
export async function POST(req: NextRequest) {
  try {
    const results = await prisma.$transaction(async (tx) => {
      // Fetch open Sell orders sorted by lowest price first, then oldest
      const openSellOrders = await tx.marketOrder.findMany({
        where: { orderType: 'SELL_LIMIT', status: 'OPEN' },
        orderBy: [{ targetPrice: 'asc' }, { createdAt: 'asc' }],
      });

      let matchedTradesCount = 0;

      for (const sellOrder of openSellOrders) {
        const remainingSellShares = sellOrder.totalShares - sellOrder.filledShares;
        if (remainingSellShares <= 0) continue;

        // Find matching Buy order with price >= sellOrder.targetPrice
        const matchingBuyOrder = await tx.marketOrder.findFirst({
          where: {
            propertyId: sellOrder.propertyId,
            orderType: 'BUY_LIMIT',
            status: 'OPEN',
            targetPrice: { gte: sellOrder.targetPrice },
            userId: { not: sellOrder.userId }, // Prevent self-trading wash sales
          },
          orderBy: [{ targetPrice: 'desc' }, { createdAt: 'asc' }],
        });

        if (!matchingBuyOrder) continue;

        const remainingBuyShares = matchingBuyOrder.totalShares - matchingBuyOrder.filledShares;
        const matchedShares = Math.min(remainingSellShares, remainingBuyShares);
        const executionPrice = Number(sellOrder.targetPrice); // Maker price priority
        const settlementAmount = matchedShares * executionPrice;

        // Transfer funds between buyer and seller
        await tx.user.update({
          where: { id: matchingBuyOrder.userId },
          data: { walletBalance: { decrement: settlementAmount } },
        });

        await tx.user.update({
          where: { id: sellOrder.userId },
          data: { walletBalance: { increment: settlementAmount } },
        });

        // Reallocate shares on property cap table
        await tx.investmentStake.update({
          where: {
            userId_propertyId: {
              userId: sellOrder.userId,
              propertyId: sellOrder.propertyId,
            },
          },
          data: { sharesOwned: { decrement: matchedShares } },
        });

        await tx.investmentStake.upsert({
          where: {
            userId_propertyId: {
              userId: matchingBuyOrder.userId,
              propertyId: matchingBuyOrder.propertyId,
            },
          },
          create: {
            userId: matchingBuyOrder.userId,
            propertyId: matchingBuyOrder.propertyId,
            sharesOwned: matchedShares,
            totalAmountPaid: settlementAmount,
            averageCostPerShare: executionPrice,
          },
          update: {
            sharesOwned: { increment: matchedShares },
            totalAmountPaid: { increment: settlementAmount },
          },
        });

        // Update order fill statuses
        const newSellFilled = sellOrder.filledShares + matchedShares;
        await tx.marketOrder.update({
          where: { id: sellOrder.id },
          data: {
            filledShares: newSellFilled,
            status: newSellFilled >= sellOrder.totalShares ? 'FILLED' : 'PARTIALLY_FILLED',
          },
        });

        const newBuyFilled = matchingBuyOrder.filledShares + matchedShares;
        await tx.marketOrder.update({
          where: { id: matchingBuyOrder.id },
          data: {
            filledShares: newBuyFilled,
            status: newBuyFilled >= matchingBuyOrder.totalShares ? 'FILLED' : 'PARTIALLY_FILLED',
          },
        });

        // Record audit transactions
        await tx.transaction.create({
          data: {
            userId: matchingBuyOrder.userId,
            type: 'SECONDARY_SALE',
            status: 'COMPLETED',
            amount: settlementAmount,
            metadata: {
              counterpartyUserId: sellOrder.userId,
              propertyId: sellOrder.propertyId,
              shares: matchedShares,
              clearingPrice: executionPrice,
            },
          },
        });

        matchedTradesCount++;
      }

      return { matchedTrades: matchedTradesCount };
    });

    return NextResponse.json({ success: true, summary: results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

---

## 10. Automated Seeding Script (`prisma/seed.ts`)

```typescript
import { PrismaClient, PropertyType, InvestmentStatus, UserRole, KycStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Estate Investment Portal database...');

  // Clean existing tables
  await prisma.dividendPayout.deleteMany({});
  await prisma.dividendDistribution.deleteMany({});
  await prisma.marketOrder.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.investmentStake.deleteMany({});
  await prisma.propertyDocument.deleteMany({});
  await prisma.property.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create Initial Users
  const investor1 = await prisma.user.create({
    data: {
      email: 'investor.alex@example.com',
      hashedPassword: '$2a$12$K8yX5Z99K.MockHashedPasswordPlaceholder',
      fullName: 'Alex Vance',
      phone: '+1 (415) 555-0192',
      role: UserRole.INVESTOR,
      kycStatus: KycStatus.VERIFIED,
      kycVerifiedAt: new Date(),
      walletBalance: 25000.0,
    },
  });

  const sponsorUser = await prisma.user.create({
    data: {
      email: 'acquisitions@apexrealty.com',
      hashedPassword: '$2a$12$K8yX5Z99K.MockHashedPasswordPlaceholder',
      fullName: 'Apex Commercial Capital',
      role: UserRole.SPONSOR,
      kycStatus: KycStatus.VERIFIED,
      walletBalance: 150000.0,
    },
  });

  // 2. Create Flagship Properties
  const prop1 = await prisma.property.create({
    data: {
      slug: 'strata-logistics-hub-austin',
      title: 'Strata Industrial Logistics Hub',
      tagline: 'Class-A Industrial Last-Mile Facility 100% Leased to Enterprise Tenant',
      description:
        'A prime 145,000 sq ft distribution facility situated in the high-growth Austin-Round Rock industrial corridor. Backed by a 10-year triple-net (NNN) corporate lease with 3% annual contractual escalations.',
      propertyType: PropertyType.INDUSTRIAL_LOGISTICS,
      addressLine1: '9400 Tech Ridge Blvd',
      city: 'Austin',
      state: 'TX',
      postalCode: '78753',
      country: 'US',
      totalAssetValue: 8500000.0,
      targetRaiseAmount: 3400000.0,
      currentRaisedAmount: 2380000.0,
      sharePrice: 50.0,
      totalShares: 68000,
      availableShares: 20400,
      minimumInvestment: 500.0,
      projectedIrr: 14.8,
      projectedAnnualYield: 8.4,
      distributionFrequency: 'QUARTERLY',
      holdingPeriodMonths: 60,
      status: InvestmentStatus.FUNDING_ACTIVE,
      grossSquareFeet: 145000,
      yearBuilt: 2021,
      occupancyRate: 100.0,
      noiAnnual: 595000.0,
      images: [
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1400&q=80',
        'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1400&q=80',
      ],
      documents: {
        create: [
          {
            name: 'Confidential Information Memorandum (CIM)',
            category: 'PROSPECTUS',
            fileUrl: '/docs/austin-logistics-cim.pdf',
            fileSize: 4200000,
            isRestricted: true,
          },
          {
            name: 'Independent Appraisal & Valuation Report',
            category: 'FINANCIAL_MODEL',
            fileUrl: '/docs/austin-appraisal-q1.pdf',
            fileSize: 2100000,
            isRestricted: true,
          },
        ],
      },
    },
  });

  const prop2 = await prisma.property.create({
    data: {
      slug: 'the-solaris-luxury-multifamily',
      title: 'The Solaris Garden Residences',
      tagline: '180-Unit Multi-Family Community in High-Density Employment Hub',
      description:
        'Garden-style residential community offering high-end tenant amenities including EV charging stations, resort-style pool, and collaborative coworking lounges. 96.2% occupied with steady rental growth.',
      propertyType: PropertyType.MULTI_FAMILY_RESIDENTIAL,
      addressLine1: '420 Solaris Parkway',
      city: 'Raleigh',
      state: 'NC',
      postalCode: '27601',
      country: 'US',
      totalAssetValue: 14200000.0,
      targetRaiseAmount: 5000000.0,
      currentRaisedAmount: 5000000.0,
      sharePrice: 100.0,
      totalShares: 50000,
      availableShares: 0,
      minimumInvestment: 1000.0,
      projectedIrr: 16.2,
      projectedAnnualYield: 7.9,
      distributionFrequency: 'MONTHLY',
      holdingPeriodMonths: 72,
      status: InvestmentStatus.FULLY_FUNDED,
      grossSquareFeet: 210000,
      yearBuilt: 2019,
      occupancyRate: 96.2,
      noiAnnual: 985000.0,
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1400&q=80',
      ],
    },
  });

  // 3. Create Sample Active Investor Stake
  await prisma.investmentStake.create({
    data: {
      userId: investor1.id,
      propertyId: prop1.id,
      sharesOwned: 100, // $5,000 allocation
      totalAmountPaid: 5000.0,
      averageCostPerShare: 50.0,
    },
  });

  console.log('Seeding finalized successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 11. Testing & Quality Assurance Suite

### 11.1 Unit Tests for Financial Engine (`src/lib/__tests__/financialMath.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import {
  calculateNOI,
  calculateCapRate,
  calculateCashOnCash,
  calculateIRR,
  generateScenarioProjections,
} from '../financialMath';

describe('Financial Math Engine', () => {
  it('correctly calculates Net Operating Income (NOI)', () => {
    const gross = 500000;
    const expenses = 180000;
    expect(calculateNOI(gross, expenses)).toBe(320000);
  });

  it('correctly calculates Capitalization Rate (Cap Rate)', () => {
    const noi = 150000;
    const assetValuation = 2500000;
    // (150,000 / 2,500,000) * 100 = 6%
    expect(calculateCapRate(noi, assetValuation)).toBe(6.0);
  });

  it('calculates Cash-on-Cash Return accurately', () => {
    const cashFlow = 24000;
    const initialCash = 300000;
    // (24,000 / 300,000) * 100 = 8%
    expect(calculateCashOnCash(cashFlow, initialCash)).toBe(8.0);
  });

  it('solves IRR accurately across standard private equity cashflows', () => {
    // Initial outlay: -$10,000; Year 1-4: $1,000/yr; Year 5: $14,000
    const flows = [-10000, 1000, 1000, 1000, 1000, 14000];
    const irr = calculateIRR(flows);
    // Typical IRR should be approx 15.6%
    expect(irr).toBeGreaterThan(15.0);
    expect(irr).toBeLessThan(16.5);
  });

  it('generates multi-year scenario returns with positive equity multiples', () => {
    const result = generateScenarioProjections(5000, 8.0, 3.0, 5, 50);
    expect(result.yearlyBreakdown).toHaveLength(5);
    expect(result.equityMultiple).toBeGreaterThan(1.2);
    expect(result.totalRentalPayouts).toBeGreaterThan(0);
  });
});
```

---

## 12. Deployment & Containerization

### 12.1 `Dockerfile`

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npx prisma generate
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
```

### 12.2 `docker-compose.yml`

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: estate-portal-app
    restart: always
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://portal_admin:SecretEstatePass2025@postgres:5432/estate_portal_db?schema=public
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=super_secure_random_hex_string_key
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    container_name: estate-portal-postgres
    restart: always
    environment:
      POSTGRES_USER: portal_admin
      POSTGRES_PASSWORD: SecretEstatePass2025
      POSTGRES_DB: estate_portal_db
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: estate-portal-redis
    restart: always
    ports:
      - '6379:6379'
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

---

## 13. Developer Onboarding & Quickstart Runbook

### Prerequisites
- Node.js v20.x or higher
- PostgreSQL v14+ (or Supabase local CLI)
- Docker & Docker Compose (optional for local container orchestration)

### Step 1: Clone & Install Dependencies
```bash
git clone https://github.com/sanatanisher01/estate-investment-portal.git
cd estate-investment-portal
npm install
```

### Step 2: Environment Configuration
Copy the template configuration file:
```bash
cp .env.example .env
```
Fill in the database connection string and third-party keys:
```env
DATABASE_URL="postgresql://portal_admin:SecretEstatePass2025@localhost:5432/estate_portal_db?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### Step 3: Run Database Migrations & Seed Data
```bash
npx prisma migrate dev --name init
npm run prisma:seed
```

### Step 4: Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.