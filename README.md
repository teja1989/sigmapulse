# Σ SigmaPulse — Institutional Quantitative Trading Terminal & Derivatives Intelligence Engine

[![Deploy to Google Cloud Run](https://github.com/teja1989/sigmapulse/actions/workflows/deploy-gcp.yml/badge.svg)](https://github.com/teja1989/sigmapulse/actions/workflows/deploy-gcp.yml)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**SigmaPulse** is a high-density, institutional-grade quantitative trading portal engineered from the perspective of a 30-year Wall Street veteran options and macro strategist. It unifies real-time catalyst web crawlers, quantitative event precedent backtesting, and mathematical Black-Scholes-Merton options risk structuring.

---

## 🔍 Instant Ticker Search & Quantitative Rules Engine

Instead of simply displaying standard market quotes, searching for any ticker in SigmaPulse immediately executes a **Multi-Factor Quantitative Rules Audit**:

1. **Price Structure & Breakout Rules**: Tests support/resistance channel proximity and volume expansion.
2. **14-Period RSI Momentum Velocity**: Classifies accumulation vs exhaustion regimes.
3. **Implied Volatility Rank (IVR)**: Determines whether option premiums are statistically cheap ($\le 35\%$) or expensive ($\ge 70\%$).
4. **IV vs Historical Volatility Spread**: Detects derivatives market pricing of upcoming variance expansion.
5. **Event Precedent Backtest Match**: Verifies historical win-rates and median returns for identical catalysts.
6. **Congressional STOCK Act Insider Flow**: Flags active committee assignments with legislative conflicts of interest.
7. **Actionable Options Structure Generation**: Outputs exact strikes, expiration DTE, Greeks ($\Delta, \Gamma, \Theta, \nu$), net debit/credit, and dynamic $P\&L$ payoff curves.

---

## ⚡ Core Quantitative Pillars

### 1. Black-Scholes-Merton & Analytical Greeks Engine
- **High-Precision Normal CDF/PDF**: Hart rational polynomial approximation ($\Phi(x)$ and $\phi(x)$).
- **First & Second Order Greeks**: Delta ($\Delta$), Gamma ($\Gamma$), Theta ($\Theta$), Vega ($\nu$), Rho ($\rho$).
- **Newton-Raphson Solver**: Continuous implied volatility and 52-week IV Rank (IVR).

### 2. Multi-Leg Derivatives Alpha Structuring
- **Bull Call Spreads**: Debit spreads mitigating IV crush with defined capped risk.
- **Long OTM Calls**: High gamma expansion for structural momentum breakouts.
- **Iron Condors**: 4-leg delta-neutral theta harvesting in rangebound corridors.
- **Long Straddles**: Delta-neutral gamma traps for binary regulatory/clinical catalysts.

### 3. Event-Driven Quantitative Backtesting Matrix
- Ingests 10-year historical precedent distributions for FDA approvals, Quantum milestones, CHIPS Act grants, STOCK Act disclosures, and DoD contracts.

---

## 📚 Technical Documentation

- **[System Architecture & Data Flow](file:///Users/tejatatini/Documents/git/stockgenie/docs/ARCHITECTURE_AND_DATA_FLOW.md)**: Deep dive on data ingestion, real-time streaming mechanics, rules engine algorithms, and mathematical formulations.

---

## 🚀 Quick Start (Local Development)

```bash
# Clone repository
git clone https://github.com/teja1989/sigmapulse.git
cd sigmapulse

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or `http://localhost:3001`) in your browser.

---

## ☁️ Google Cloud Deployment (Cloud Run CI/CD)

The repository includes an automated GitHub Actions CI/CD workflow (`.github/workflows/deploy-gcp.yml`) targeting Google Cloud project **`quantum-pulsar`**.

Pushing to `main` automatically builds the multi-stage Docker container, pushes to **Google Artifact Registry**, and deploys to **Google Cloud Run**.

---

## 📄 License
MIT © 2026 SigmaPulse Team
