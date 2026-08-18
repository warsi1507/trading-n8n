# Executor Engine Design & Architecture

## Overview
The `executor` sub-app is the core processing engine of trading-n8n. It is responsible for taking a compiled DAG (Directed Acyclic Graph) of a workflow, evaluating trigger conditions in real-time, and executing action nodes. 

To maximize execution speed for crypto trading, nodes are treated as independent executable blocks using static JSON configuration. Trigger evaluations happen purely in-memory via WebSocket streams to eliminate database polling latency, and execution state logging is offloaded to a Redis Stream for sub-millisecond, crash-proof persistence.

## Proposed Folder Structure
```text
app/executor/src/
├── index.ts                 # Entry point: connects to DB & Redis, initializes WebSockets/Cron.
├── engine/                  # Core DAG Traversal & State
│   ├── Engine.ts            # Orchestrator: walks the graph and triggers action nodes.
│   └── Context.ts           # Execution State Tracker.
├── nodes/                   # Individual Node Implementations
│   ├── registry.ts          # Maps node definitions (by type) to their execution handlers.
│   ├── action/              # Action Node Implementations
│   │   ├── Backpack.ts      # Executes Backpack trades
│   │   ├── Hyperliquid.ts   # Executes Hyperliquid trades
│   │   └── Lighterxyz.ts    # Executes Lighter.xyz trades
│   └── trigger/             # Trigger Condition Evaluators
│       ├── PriceTrigger.ts  # Manages WebSocket subscriptions for assets
│       └── TimeTrigger.ts   # Manages node-cron jobs
├── listeners/               # Real-Time Event Streams
│   ├── ActiveTriggers.ts    # In-memory cache of currently active workflow triggers.
│   └── WebSocketManager.ts  # Maintains persistent connections to Binance for price feeds.
└── services/                # Helper Services & Workers
    ├── RedisLogger.ts       # Pushes blazing-fast execution events to Redis Streams.
    ├── MongoWorker.ts       # Background consumer that reads Redis Streams to safely update MongoDB.
    └── VaultService.ts      # Fetches and decrypts API keys/secrets for trading platforms.
```

## How It Works (The Lifecycle)

### 1. Zero-Latency Triggering Architecture
We strictly avoid database polling to evaluate triggers.
- **Initialization**: When the Executor boots up, it queries MongoDB once for all active workflows. It extracts their trigger nodes and caches them in memory (`ActiveTriggers.ts`).
- **Time Triggers**: Registered in-memory using a cron library (`node-cron`). When the time hits, the job instantly fires the engine.
- **Price Triggers**: `WebSocketManager.ts` connects to Binance's websocket streams. Every time a price tick arrives, it checks the in-memory `ActiveTriggers.ts` cache. If a price crosses a threshold, it immediately hands off the workflow to the `Engine`. 

### 2. The Execution Path (Redis Streams)
- Once a trigger fires, the `Engine` is instantiated.
- Every time the engine needs to log a state change (e.g., "Execution Started", "Node Finished"), it calls `RedisLogger.ts` to push an event payload to a **Redis Stream** (via `XADD`).
- Redis writes take less than `1ms`, ensuring the Engine never stalls. The Engine instantly moves on to hit the Backpack/Hyperliquid API to execute the actual trade.
- For action nodes, `VaultService` is called to securely decrypt credentials directly into memory right before the API call.

### 3. The Background Sync (MongoDB)
- Completely separated from the fast-trading critical path, `MongoWorker.ts` runs a Redis Consumer Group (`XREADGROUP`).
- It quietly pulls the event logs from the Redis Stream and performs the slower writes to MongoDB (`status: SUCCESS`, saving the `output_data`).
- **Crash Safety:** If the server loses power a microsecond after a trade executes, the log event is still safely held in the Redis Stream. When the server reboots, the Mongo Worker connects, reads the unprocessed event, and updates the database, guaranteeing zero data loss.

## Key Design Decisions
- **Enterprise-Grade Consistency via Redis**: Decoupling the fast trading execution from slow MongoDB writes ensures we never miss a market move, while Redis Streams provide crash-proof reliability.
- **No Dynamic Expressions**: For MVP simplicity and speed, action nodes rely purely on their configured JSON metadata. We do not parse or evaluate arbitrary JavaScript strings inside node inputs.
- **In-Memory Caching for Speed**: Database reads are slow. Triggers are cached in memory and matched against real-time WebSocket data for absolute minimum latency.
- **Security**: The Executor is the ONLY service that decrypts credentials. The API saves them encrypted, and the Executor decrypts them in memory right before executing a trade.
