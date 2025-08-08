# Performance Requirements

Version: 0.1 (Draft)
Date: 2025-08-08
Owner: Platform Engineering & SRE

## Goals
- Define quantitative performance targets and testable SLIs/SLOs for core user journeys and APIs.
- Ensure capacity planning, scalability, and cost-efficiency across peak workloads.

## Assumptions
- Multi-tenant, Azure-first deployment; AKS for services; Azure SQL primary store; Service Bus for async.
- Typical tenant size: 5k users; large tenants: 50k users.

## Service Level Objectives (SLOs)
- Availability: 99.9% monthly for core APIs; 99.95% for auth.
- Latency (p95):
  - Read GET endpoints: <= 200 ms
  - Write POST/PATCH: <= 350 ms
  - Evidence ingestion: enqueue <= 100 ms; end-to-end process <= 5 min (p99)
- Throughput:
  - Policy/Control reads: 2k RPS sustained per region
  - Evidence ingestion: 500 msg/s sustained; burst 5k msg/s for 10 min
- Error budget: 0.1% for core APIs per month.

## Capacity & Scalability
- Horizontal scaling via HPA on CPU 60%/RPS; PDBs to preserve availability during rollouts.
- Partition heavy tables; enable read replicas for analytics; cache hot reads with Redis.
- Async outbox for write amplification; backpressure when queues > threshold.

## Resource Targets (per pod/service)
- CPU: < 200m avg; < 600m p95 under load; memory < 512Mi p95.
- DB: p95 query < 50 ms for indexed lookups; < 200 ms for joins with covering indexes.

## Test Scenarios
- Load tests for CRUD on policies/controls; concurrency: 500/1k/2k virtual users.
- Soak test 24h with background jobs and evidence ingestion.
- Chaos: pod restarts, node drains, AZ failover sim; DB failover.
- Thundering herd: webhook retries; evidence burst 5k msg/s.

## Monitoring & Alerting
- SLIs: availability, latency p50/95/99, error rate, saturation (CPU/mem), queue length, DB waits.
- Alerts: burn-rate 2h/6h/24h; queue backlog > 10 min; DB DTU > 80% for > 10 min.

## Optimization Guidelines
- Avoid N+1; use pagination; project only needed columns.
- Debounce writes; batch operations; idempotency keys.
- Precompute aggregates for dashboards.

## Cost Efficiency
- Right-size autoscale min/max; spot nodes for async workers; cache to reduce DB load.
- Tier storage by access; TTL on telemetry payloads.

## Acceptance Criteria
- Performance tests pass thresholds for 3 consecutive runs in CI.
- Dashboards published; alerts verified via game days.

## References
- See: quality-assurance/performance-test-plan.md, technical-design/deployment-architecture.md, system-design-specification.md
