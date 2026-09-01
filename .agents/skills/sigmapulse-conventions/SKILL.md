---
name: sigmapulse-conventions
description: >-
  Coding standards, quantitative algorithms, 5-Pillar Decision Framework conventions, 
  and UI architecture rules for the SigmaPulse institutional trading terminal.
---

# SigmaPulse Engineering & Quantitative Conventions

This skill defines the coding standards, quantitative mathematical modeling patterns, architectural conventions, and UI principles for **SigmaPulse**.

---

## 1. Core Architecture & Tech Stack

- **Framework**: Next.js 14+ (App Router) with React 18/19, TypeScript (strict mode), and Tailwind CSS.
- **Output Mode**: `output: 'standalone'` in `next.config.mjs` for optimized Docker multi-stage builds.
- **Deployment**: Google Cloud Run (`us-central1`) via GitHub Actions CI/CD (`.github/workflows/deploy-gcp.yml`) under GCP project `quantum-pulsar`.

---

## 2. Quantitative & Mathematical Standards

### A. Black-Scholes-Merton Pricing (`src/lib/quant/blackScholes.ts`)
- Use Hart / Abramowitz-Stegun polynomial rational approximation for high-precision normal CDF ($\Phi(x)$) and PDF ($\phi(x)$).
- All options pricing functions MUST calculate the full analytical Greeks suite:
  - **Delta ($\Delta$)**: Directional sensitivity ($\partial V / \partial S$)
  - **Gamma ($\Gamma$)**: Curvature and acceleration ($\partial^2 V / \partial S^2$)
  - **Theta ($\Theta$)**: Daily time decay ($\Theta_{\text{annual}} / 365$)
  - **Vega ($\nu$)**: Volatility sensitivity ($\partial V / \partial \sigma \times 0.01$)
  - **Rho ($\rho$)**: Interest rate sensitivity ($\partial V / \partial r \times 0.01$)
- Implied Volatility (IV) MUST be solved using continuous Newton-Raphson iteration with bisection fallback.

### B. Price Disambiguation: Stock Price vs Option Contract Price
- **NEVER** confuse the underlying stock price with the options contract price:
  - **Underlying Spot Price ($S$)**: e.g., PLTR = `$43.50`
  - **Option Strike Price ($K$)**: e.g., `$45.00 Call`
  - **Option Premium / Cost per share**: e.g., `$3.85/share`
  - **Total Contract Cost (100 shares)**: e.g., `$385.00/contract`
  - **Break-Even Spot Price**: e.g., `$48.85` ($K + \text{Premium}$)
- Always display both the **Underlying Stock Spot Price** and the **Option Contract Premium / Net Debit** distinctly in all cards, tables, and modals.

---

## 3. The 5-Pillar Decision Framework (`src/lib/quant/rulesEngine.ts`)

Every ticker audit MUST evaluate the 5 standardized pillars (scored 0–100):
1. **Pillar 1: Price Trend & Momentum (22%)**: EMA 20/50/200 crossover, 14-day RSI velocity, support/resistance breakout.
2. **Pillar 2: Volatility & Pricing Value (IVR) (20%)**: Implied Volatility Rank ($\le 35\%$ cheap $\rightarrow$ Long Calls; $\ge 70\%$ rich $\rightarrow$ Spreads/Iron Condor).
3. **Pillar 3: Smart Money & Congressional Flow (18%)**: STOCK Act filings, committee conflicts (Armed Services, Intelligence, Health).
4. **Pillar 4: Catalyst & Event Precedent (22%)**: 10-year historical backtest realization rate.
5. **Pillar 5: Downside Safety & Protection (18%)**: Strict maximum loss capping, probability of profit (PoP), defined risk.

---

## 4. UI & Visual Styling Conventions

- **Institutional Dark Theme**: Deep Jet Black (`#06090e`, `#080d1a`, `#0f1626`).
- **Glow Accents**:
  - Cyan: `#00F0FF` (`shadow-glow-cyan`)
  - Terminal Green: `#00FF66` (`shadow-glow-green`)
  - Amber / Gold: `#FFB000` (`shadow-glow-amber`)
  - Volatility Purple: `#A855F7` (`shadow-glow-purple`)
  - Alert Red: `#FF3366`
- **Typography**: Monospace (`ui-monospace`, `JetBrains Mono`, SFMono) for tickers, prices, Greeks, and numeric figures (`tabular-nums`). Clean sans (`Inter`) for summaries and plain-English takeaways.
- **Layman Clarity**: Always accompany quantitative metrics with a plain-English translation (e.g. "Theta = Daily cash collected/lost").

---

## 5. Verification & Testing Workflow

Before committing any change:
1. Run `npm run build` to verify **zero TypeScript or bundling errors**.
2. Test responsive layouts and modals (Ticker Analysis Modal, Field Guide Academy, Payoff Sandbox, Backtest Lab).
3. Push commits to `main` branch to trigger the automated Google Cloud Run CI/CD deployment.
