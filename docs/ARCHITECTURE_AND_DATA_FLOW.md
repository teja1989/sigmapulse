# Sigma Pulse — architecture

TanStack Start (Vite + Nitro) serves the desk. Cloud Run uses `NITRO_PRESET=node-server`.

## Feeds (honest)

| Surface | Source | Note |
| --- | --- | --- |
| Quotes / charts | Yahoo Finance chart v8 | Delayed last print |
| Options / unusual | Yahoo options v7 | Nearest expiry; unusual = volume / OI |
| News | Yahoo search | Headlines only |
| IV rank | Unobserved | No 1-year IV history |
| STOCK Act / Form 4 | Unobserved | Pillar stays blank |
| Event backtest | Unobserved | News density is not a win-rate |

## 5 pillars

1. Price trend & momentum (22%) — EMA/RSI on daily closes  
2. Volatility (20%) — ATM IV vs 20d realized vol  
3. Smart money (18%) — unobserved  
4. Catalyst (22%) — news density, not historical realization  
5. Downside safety (18%) — defined-risk constructible from the chain  

Composite is a weighted average of **observed** pillars only.
