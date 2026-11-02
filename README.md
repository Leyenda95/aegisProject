<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="frontend/public/images/aegis_mark_light.svg">
    <img width="112" alt="Aegis logo" src="frontend/public/images/aegis_mark.svg">
  </picture>
</p>

<h1 align="center">AEGIS</h1>

<p align="center"><b>Private commerce intelligence on Midnight</b></p>

Market intelligence powered by anonymous ZK signals. Stores see what customers want. Customers stay invisible.

## What is Aegis?

Aegis is a privacy-preserving market intelligence system built on Midnight Network. It solves a fundamental tension in commerce: stores need to know what customers want, but customers don't want to be tracked.

**How it works:**

1. A store seals the receipt on-chain, without revealing which store it is.
2. The customer keeps it on their phone and publishes a ZK signal.
3. The signal reveals only what the customer chooses to share. Never who they are.
4. Public counters add up every signal.
5. An AI agent turns them into market insights for each store.

## Try it

Everything runs against Midnight's **Preprod** testnet. There are two ways to try it.

### Option A: hosted version

Open **[aegis-midnight.vercel.app](https://aegis-midnight.vercel.app/)**. It's connected to a shared contract on Preprod that already has a registered store and signals, so you only need a Midnight wallet extension (Lace or 1AM) on the Preprod network.

1. On the landing page, choose **Explore**.
2. If the demo asks for a wallet (it does when the instance isn't paying the fees), choose **Connect Wallet**.
3. At the till, add a couple of products to the cart and check out. This seals a receipt on-chain and shows it as a QR.
4. Publish the signal, in either of these ways:
   - Scan the QR with your phone's camera: it opens the Aegis phone app (`/app`) with the ticket ready, and you can add it to your home screen. While sponsorship is on, the phone doesn't need a wallet.
   - Or use the phone next to the till on the same computer (the **User** tab on smaller screens): the receipt you just sealed shows up as a new ticket. Tap **Publish signal**.
5. Review what will be shared, choose where the proof is generated (see below) and publish. The publish sheet follows the real steps until the signal lands in the public aggregate, and the **Market** tab lists it among the latest signals.

On the hosted version, Aegis can sponsor the signal's transaction fee, so the customer doesn't need DUST to publish.

### Option B: run it locally

When you run it yourself, you deploy your own contract instance from the browser and become its store admin, so the full loop (register store, seal a receipt, publish a signal) works standalone, with no coordination needed.

**Prerequisites**

- Node.js >= 22
- A Midnight proof server reachable at `http://127.0.0.1:6300`
- The Compact CLI (`compact`) installed and on your `PATH`, to compile the contract
- A Midnight wallet extension (Lace or 1AM) with some Preprod NIGHT/DUST
- An API key for the AI agent, `ANTHROPIC_API_KEY` (optional), only needed for the market intelligence (insights) endpoints; the purchase/signal flow works without it

**Steps**

```bash
git clone https://github.com/Leyenda95/aegisProject.git
cd aegisProject
npm install                # installs contract, backend and frontend workspaces
cd contract
npm run compact            # compiles the contract, generates ZK keys -> managed/aegis/
cd ../backend
npm run start:preprod      # starts the API against Preprod. No contract deployed yet
cd ../frontend
npm run dev                # starts the frontend, open the printed URL
```

1. Install dependencies: `npm install` at the repo root (npm workspaces cover `contract`, `backend`, and `frontend`).
2. Compile the contract: `cd contract && npm run compact` (generates the ZK keys under `contract/managed/`).
3. Start the backend against Preprod: `cd backend && npm run start:preprod` (set `ANTHROPIC_API_KEY` in `backend/.env` first if you want insights). No contract is deployed yet at this point, that happens from the browser next.
4. Start the frontend: `cd frontend && npm run dev`, then open the printed URL.
5. In the browser, open `/setup` (once your wallet is connected, the header links to it as **Set up demo** while something is missing): **Connect Wallet** (Lace or 1AM, Preprod network) → **Deploy contract** (this deploys a fresh instance and makes your wallet its store admin; the backend remembers it for next time) → **Register demo store** → **Load demo data** (seeds baseline counters so the store insights have something to talk about).
6. Try the flow: check out a cart at the till, tap **Publish signal** on the new ticket in the phone (the **User** tab on smaller screens), review what will be shared and publish.

**Backend environment variables** (in `backend/.env` or the process environment)

| Variable | Needed for |
|---|---|
| `MIDNIGHT_NETWORK` | `local`, `preprod` or `preview`. `npm run start:preprod` sets it for Preprod |
| `BLOCKFROST_PROJECT_ID` | Preprod indexer and RPC (required on Preprod; the token stays in the backend) |
| `ANTHROPIC_API_KEY` | AI agent for the market intelligence (optional) |
| `PROOF_SERVER_URL` | Use another proof server than the network default (as on Railway) |
| `SPONSOR_URL`, `SPONSOR_TOKEN` | Sponsored transactions through the aegis-signal-bot (optional; both must be set) |

### Prove on your own device (optional)

By default the backend generates the signal's proof, which means the receipt travels to it. When publishing, you can choose **Local** instead of **Aegis Proof Server**: the browser then builds the `submitPurchase` transaction itself and proves it with a proof server running on your machine, so the receipt never leaves your device. Start one with:

```bash
docker run -p 6300:6300 midnightntwrk/proof-server:8.1.3
```

The page picks it up on its own as soon as it answers on `127.0.0.1:6300`. If the browser asks whether the page may access your local network, allow it: that is how it reaches the proof server.

The backend then only serves the public contract state (`GET /contract-states`) and, if sponsorship is on, forwards the already proven transaction (`POST /sponsor-signal`, which only accepts a single `submitPurchase` call to this contract).

## Architecture

Aegis has three parts: a Compact contract that holds the rules and the public counters, a backend that builds and proves transactions and follows the chain, and a React frontend. Everything runs on Midnight Preprod.

| Folder | What it holds |
|---|---|
| `contract/` | `aegis.compact`, its TypeScript witnesses, the committed compiler output (`managed/aegis`) and the simulator tests |
| `backend/` | Node API (`api.ts`), transaction builder and prover client (`contract.ts`), live history and SSE (`history.ts`), AI agent (`agent.ts`), sponsorship (`sponsor.ts`) |
| `frontend/` | React app: landing, guided demo, till and phone demo, market, installable phone app (`/app`), deploy helper (`/setup`) |

### How the pieces connect

```
Browser (Vercel) ──► Backend + proof server (Railway) ──► Midnight Preprod (Blockfrost)
       │                          │
       ▼                          ▼
 Wallet (Lace, 1AM)     AI agent (aggregate counters only)
```

The browser never talks to Blockfrost: its token stays in the backend, and the frontend reads the public state through `GET /state`. The local proof server is optional; without it the backend's proof server proves the signal. Sponsorship is optional too: without `SPONSOR_URL` and `SPONSOR_TOKEN` the backend returns the proven transaction and the connected wallet pays.

### How a purchase travels

1. The administrator registers the store: its public key goes into the store tree.
2. The store charges and seals the receipt: it publishes a commitment and proves it belongs to a registered store, without saying which one.
3. The customer gets the receipt as a QR and keeps it on their phone.
4. Whenever they want, the customer publishes a signal: a ZK proof that the receipt is sealed and unused, revealing only what they chose to share.
5. The contract marks the receipt as used and adds the units to the public counters.
6. The agent reads the counters and writes each store's report.

### Notes on the flow

- **Reading state.** `GET /state` is public ledger data. The backend reads it from the Preprod indexer (served by Blockfrost) and decodes it with the contract's `ledger()` function. No proof, no key, no privileged access. What the backend has read is kept on disk (`.history-<network>.json`), so a restart only fetches the transactions it hasn't seen.
- **Market.** The market counts every signal, like the on-chain counters. A period that includes the demo data load says so and isn't compared with the previous one.
- **Insights.** The AI agent returns trending categories and recommendations over 1W, 1M, 3M and 1Y windows. The counters are the same ones the market shows for that period, and the previous period is only passed along when the two can be compared. The model only ever sees aggregate numbers, never individual signals or user data.
- **Privacy limits.** A signal reveals its receipt's commitment, so it can be matched to that receipt's sealing, though not to a person or a store. Whoever generates a proof sees the receipt while doing it, unless the signal is proved on a local proof server.
- **Campaigns.** They are ready in the backend but not in the store screen yet, which shows them as coming soon: `POST /campaigns` registers one and `GET /match/:id` checks its threshold against the live aggregate, again using the AI agent to explain the result.

## Stack

| Layer | Technology |
|---|---|
| Smart contract | [Compact](https://docs.midnight.network/compact) (compiler `0.31.1`, language `>= 0.20`, runtime `0.16.0`) |
| Contract tests | Vitest, in-memory circuit simulator |
| Backend | Node.js + TypeScript (`tsx`), native `http` server, `@midnight-ntwrk/midnight-js-contracts`, `@midnight-ntwrk/ledger-v8` |
| Market intelligence | AI agent |
| Frontend | React 19 + Vite 8 + TypeScript, React Router, TanStack Query, CSS Modules |
| Screenshot tests | Playwright (`npm run screens` in `frontend/`) |
| Wallet integration | Midnight DApp Connector API, Lace and 1AM |
| Network | Midnight Preprod (node + Blockfrost indexer), hosted or local proof server |
| Hosting | Frontend on Vercel, backend and proof server on Railway |
| Local devnet | Docker Compose (node + indexer + proof server) |

## Project status

- [x] Anonymous signals: only subcategory and units are revealed.
- [x] Anonymous stores, and each receipt can only be published once.
- [x] Sponsored fees.
- [x] Phone app: tickets stay on the device. Proving can be local too.
- [x] Live market and an AI agent report from aggregate data only.
- [ ] **Implement selective disclosure in the contract.**
- [ ] Campaigns in the store screen.

## What's next

- **Selective disclosure in the circuit.** Wire age range and average spend into the circuit, tied to a persistent pseudonym. A store can then recognize a returning customer and reward them with discounts, gifts or exclusive offers, without ever learning who they are. Sharing always stays opt-in: the customer decides what to reveal and to whom.
- **Campaigns.** A store defines a target category and a signal threshold, and the campaign activates automatically once enough signals land.
- **Stronger unlinkability.** Move sealed receipts into their own Merkle tree, so the customer proves membership with a nullifier instead of revealing the commitment.
- **Point of sale integrations.** Plug into the systems stores already use, like Shopify. A store installs an app, and from then on every checkout seals its receipt automatically and prints or emails the QR. That's how AEGIS stops being a demo and becomes something any shop, from a corner café to an online brand, can switch on in minutes.
