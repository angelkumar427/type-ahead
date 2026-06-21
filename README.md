# Type-Ahead Search System

A production-grade, highly scalable distributed TypeAhead Search API built with **Node.js**, **React**, **PostgreSQL**, and a **3-node Redis Cluster**. The system intelligently distributes cache across multiple Redis nodes using Consistent Hashing and implements write-behind batching for extreme performance.

## Architecture & Features

### 1. Distributed Redis Cluster with Consistent Hashing
Instead of relying on a single Redis node, this system uses a **Consistent Hashing Algorithm** to distribute search cache evenly:
- **MD5-based Hash Ring** distributes prefixes across 3 Redis nodes (`redis-1`, `redis-2`, `redis-3`)
- **100 Virtual Replicas** per node ensure load balancing and prevent hot-spotting
- **O(log n) Binary Search** routes `get`/`setEx` calls to the correct node dynamically

### 2. Write-Behind Batching for High Throughput
To achieve 10,000+ RPS without overwhelming PostgreSQL:
- Incoming searches hit an **In-Memory Queue** and return instantly
- **Background Aggregator Worker** drains the queue every 5 seconds (or at 1,000 items)
- Bulk `prisma.$transaction` consolidates thousands of writes into a single DB call
- *Tradeoff:* In-memory queues trade durability for speed—up to 5 seconds of data may be lost on crash

### 3. Blended Trending Algorithm
Ranks trending searches using a **Hacker News-style formula**:
$$\text{Score} = \log_{10}(\text{Historical Count}) + \frac{\text{Current Timestamp}}{45000}$$
Balances popularity with recency to surface both established and emerging searches.

### 4. 100k Word Dataset
Seeded with **Peter Norvig's N-Grams corpus** featuring top 100,000 English words with Google Web frequencies. Schema uses `BigInt` to handle words with 2+ billion occurrences.

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- PostgreSQL (optional, included in Docker)

### Running with Docker

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Stop all services
docker compose down -v
```

**Automatic Setup:**
- ✅ Entrypoint scripts auto-generate `.env` files for backend and frontend
- ✅ Backend entrypoint generates Prisma client on startup
- ✅ Database automatically seeded with 100k words
- ✅ All 3 Redis nodes initialized and connected

### Services & Endpoints

| Service | URL | Purpose |
| --- | --- | --- |
| **Frontend** | `http://localhost:5173` | React UI for TypeAhead search |
| **Backend** | `http://localhost:5000` | REST API |
| **PostgreSQL** | `localhost:5433` | Primary data store |
| **Redis-1** | `localhost:6379` | Cache node 1 |
| **Redis-2** | `localhost:6380` | Cache node 2 |
| **Redis-3** | `localhost:6381` | Cache node 3 |

### API Endpoints

**V1 (Database-only):**
- `GET /api/v1/suggest?q=apple` - Get suggestions (database only)
- `POST /api/v1/search` - Log a search query

**V2 (Distributed Cache):**
- `GET /api/v2/suggest?q=apple` - Get suggestions (with Redis cache)
- `GET /api/v2/trending` - Get trending searches
- `GET /api/v2/cache/debug?prefix=apple` - Debug cache distribution

## Project Structure

```
type-ahead/
├── Backend/
│   ├── Dockerfile
│   ├── docker-entrypoint.sh        # Auto-generates .env & Prisma client
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema (BigInt support)
│   │   └── seed.ts                 # Seeds 100k words
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.ts               # Prisma setup
│   │   │   └── redis.ts            # Consistent Hash Ring
│   │   ├── routes/
│   │   │   ├── v1/                 # Database-only endpoints
│   │   │   └── v2/                 # Cached endpoints
│   │   ├── services/               # Business logic
│   │   └── utils/
│   │       └── ConsistentHash.ts   # Hash Ring implementation
│   └── package.json
├── Frontend/
│   ├── Dockerfile
│   ├── docker-entrypoint.sh        # Auto-generates .env
│   ├── src/
│   │   ├── App.tsx                 # Main React component
│   │   └── components/
│   │       └── SearchBox.tsx       # TypeAhead input
│   └── package.json
├── docker-compose.yml              # Orchestrates all services
└── README.md (this file)
```

## Environment Variables

**Backend (.env - Auto-generated):**
```
DATABASE_URL=postgresql://postgres:password@postgres:5432/typeahead
REDIS_URLS=redis://redis-1:6379,redis://redis-2:6379,redis://redis-3:6379
PORT=5000
NODE_ENV=development
```

**Frontend (.env - Auto-generated):**
```
VITE_API_URL=http://localhost:5000/api
VITE_ENV=development
```

## Performance Benchmarks

See [benchmark_report.md](benchmark_report.md) for detailed load-test results comparing:
- Write throughput (6,969 RPS with batching)
- Read performance without cache (618 RPS)
- Read performance with distributed cache (6,857 RPS - **11x improvement**)

## Development

### Local Backend Development
```bash
cd Backend
npm install
npm run dev
```

### Local Frontend Development
```bash
cd Frontend
npm install
npm run dev
```

### Run Tests
```bash
cd Backend
npm test
```

## Docker Build Process

Both Dockerfiles:
1. Copy all files and install dependencies
2. Run executable permission setup (`chmod +x docker-entrypoint.sh`)
3. Use ENTRYPOINT for automatic `.env` generation
4. Execute the main command (dev server)

**Backend-specific:**
- Entrypoint checks for Prisma client and generates if missing
- Ensures database schema is ready before app starts

**Frontend-specific:**
- Entrypoint creates `.env` with Vite configuration
- Hot-reload enabled with volume mounts

## Troubleshooting

**Backend won't start:**
```bash
# Check logs
docker compose logs backend

# Verify .env was created
docker compose exec backend cat .env

# Restart with fresh Prisma generation
docker compose restart backend
```

**Redis not connecting:**
```bash
# Test Redis nodes
docker compose exec backend redis-cli -h redis-1 ping
```

**Database issues:**
```bash
# Reset database
docker compose down -v
docker compose up -d
```

## License

ISC