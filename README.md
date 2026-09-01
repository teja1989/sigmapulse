# Σ SigmaPulse — Institutional Quantitative Trading Terminal & Derivatives Intelligence Engine

[![Deploy to Google Cloud Run](https://github.com/teja1989/sigmapulse/actions/workflows/deploy-gcp.yml/badge.svg)](https://github.com/teja1989/sigmapulse/actions/workflows/deploy-gcp.yml)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**SigmaPulse** is a high-density, institutional-grade quantitative trading portal engineered from the perspective of a 30-year Wall Street veteran options and macro strategist. It unifies real-time catalyst web crawlers, quantitative event precedent backtesting, and mathematical Black-Scholes-Merton options risk structuring.

---

## ⚡ Core Quantitative Pillars

### 1. Black-Scholes-Merton & Analytical Greeks Engine
- **High-Precision Probability**: Hart / Abramowitz-Stegun rational approximation of the standard normal CDF ($\Phi(x)$) and PDF ($\phi(x)$).
- **First & Second Order Greeks**:
  - **Delta ($\Delta$)**: Directional rate of change $\partial V / \partial S$
  - **Gamma ($\Gamma$)**: Curvature and acceleration $\partial^2 V / \partial S^2$
  - **Theta ($\Theta$)**: Daily time decay $\partial V / \partial t$
  - **Vega ($\nu$)**: Sensitivity to 1% shift in implied volatility $\partial V / \partial \sigma$
  - **Rho ($\rho$)**: Interest rate sensitivity $\partial V / \partial r$
- **Implied Volatility Solver**: Continuous Newton-Raphson method with bisection fallback for exact IV and 52-week Implied Volatility Rank (IVR).

### 2. Multi-Leg Derivatives Alpha Structuring
- Automated risk-defined strategy construction:
  - **Bull Call Vertical Spreads**: Mitigates IV crush by selling upper strikes.
  - **Long OTM Calls**: High gamma expansion for structural momentum breakouts.
  - **Iron Condors**: 4-leg delta-neutral theta harvesting within containment corridors.
  - **Long Straddles**: Delta-neutral gamma traps for binary regulatory/clinical catalysts.
- Dynamic interactive $P\&L$ payoff curves with real-time scenario sliders (Spot Price, Days to Expiration, IV Skew).

### 3. Event-Driven Quantitative Backtesting Matrix
- Ingests 10-year historical precedent distributions across structural catalysts:
  - **FDA Phase 3 / PDUFA Approvals**
  - **Quantum Algorithmic & Qubit Scalability Benchmarks**
  - **CHIPS Act Grants & Sovereign AI Export Authorizations**
  - **Congressional STOCK Act Insider Purchases**
  - **DoD / NATO Major Defense Awards**
- Real-time computation of 1-Day, 5-Day, and 30-Day win rates, median returns, Sharpe ratios, and max adverse excursions (drawdowns).

### 4. Congressional STOCK Act & Policy Radar
- Real-time monitoring of House and Senate committee insider filings (Pelosi, Tuberville, Crenshaw, McCaul, Ro Khanna).
- Calculates Committee Conflict of Interest indices, disclosure lags, and provides 1-click options copy-trading setups.

---

## 🛠️ Dynamic Sector Intelligence Hubs

1. **Technology & AI Hardware**: `NVDA`, `MSFT`, `AMD`, `TSM`, `AVGO`
2. **Quantum Computing & Cryptography**: `IONQ`, `RGTI`, `QBTS`, `IBM`
3. **Biotech & Clinical Catalysts**: `LLY`, `VRTX`, `CRSP`, `NVO`
4. **Congressional & Politician Trades**: `PLTR`, `LMT`, `RTX`, `NVDA`, `LLY`
5. **Cross-Asset Aggregated View**: Multi-sector macro matrix.

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

### Setting up GCP Authentication:
1. Create a Service Account in GCP project `quantum-pulsar`:
   ```bash
   gcloud iam service-accounts create github-actions-deployer \
     --description="GitHub Actions Cloud Run Deployer" \
     --display-name="GitHub Deployer"
   ```
2. Grant required roles:
   ```bash
   gcloud projects add-iam-policy-binding quantum-pulsar \
     --member="serviceAccount:github-actions-deployer@quantum-pulsar.iam.gserviceaccount.com" \
     --role="roles/run.admin"

   gcloud projects add-iam-policy-binding quantum-pulsar \
     --member="serviceAccount:github-actions-deployer@quantum-pulsar.iam.gserviceaccount.com" \
     --role="roles/artifactregistry.admin"

   gcloud projects add-iam-policy-binding quantum-pulsar \
     --member="serviceAccount:github-actions-deployer@quantum-pulsar.iam.gserviceaccount.com" \
     --role="roles/iam.serviceAccountUser"
   ```
3. Generate a Service Account JSON Key and add it to GitHub repository Secrets as **`GCP_SA_KEY`**:
   - Go to `https://github.com/teja1989/sigmapulse/settings/secrets/actions`
   - Add Secret: `GCP_SA_KEY` = `<Contents of Service Account JSON>`
4. Push to `main` branch to automatically trigger the build and deployment to Google Cloud Run!

---

## 📄 License
MIT © 2026 SigmaPulse Team
