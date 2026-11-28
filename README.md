# DeployLab — Deployment Engineering & DevOps Simulation

DeployLab is a browser-based, simulation-only environment for exploring software delivery across cloud and on-premises reference architectures. It combines architecture maps, a deterministic deployment walkthrough, engineering labs, operational guidance and learning paths.

> **Simulation boundary:** DeployLab does not connect to AWS, Azure, GCP, Kubernetes clusters or on-premises infrastructure. It does not provision resources, execute commands on a host, request cloud credentials or ingest live telemetry. Commands, files, logs, traces, metrics, costs, security checks and deployment outcomes are illustrative local examples.

## Workspaces

- **Deployment Dashboard** — entry point to the deployment engineering workspaces.
- **Deployment Architectures** — browse cloud, on-premises and application reference architectures; inspect components and follow the selected deployment flow.
- **Deployment Terminal** — practise supported, simulated command workflows. Commands are not sent to a real shell or cloud account.
- **Infrastructure & Terraform** — inspect architecture-specific Terraform examples and simulated plan/apply concepts.
- **Kubernetes Deployments** — available for Kubernetes architectures; inspect example manifests and simulated workload progression.
- **Deployment Security** — inspect workflow-specific security reference files, identity policies, runtime controls and verification guidance. No scanner or cloud security API is connected.
- **Deployment Cost Explorer** — view illustrative estimates, not provider billing or quotes.
- **Deployment Runbooks** — review target-aware verification and rollback procedures. Commands are reference material and are not executed.
- **Deployment Observability** — inspect synthetic metrics, illustrative logs/traces, alert thresholds and selected architecture resources. No Prometheus, Grafana, Datadog or cloud telemetry integration is connected.
- **Troubleshooting Lab** — investigate architecture-aware simulated incidents, collect evidence and practise recovery decisions.
- **Deployment Strategies** — practise rolling, blue/green, canary and A/B release progressions with simulated health gates and rollback.
- **Learning Paths** — complete deployment-aware lessons, practical tasks and knowledge checks. Quiz progress is stored locally in the browser per deployment.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

## Tests and production build

```bash
npm test
npm run build
npm run preview
```

GitHub Actions runs the test suite and TypeScript/Vite production build on pushes and pull requests to `main`.

## Architecture

- React 18, TypeScript and Vite
- Data-driven architecture scenarios and deployment orchestration in `src/App.tsx`
- Engineering workspaces in `src/LabWorkspace.tsx`
- Dedicated modules for security, runbooks and observability
- Shared simulation state transitions in `src/simulation/engine.ts`
- Node's built-in test runner for simulation and pricing logic

## Product principles

1. Teach how systems behave, not only what components are called.
2. Keep architecture content and simulation events data-driven.
3. Make failure, recovery and release safety first-class learning activities.
4. Label illustrative commands, files, logs, metrics, costs and security artifacts clearly.
5. Never silently connect to or mutate real infrastructure.
6. Do not represent synthetic results as production evidence.

## Roadmap

- [x] Responsive 2D architecture maps and component inspector
- [x] Shared deployment simulation engine and CI checks
- [x] Cloud and on-premises reference architecture library
- [x] Architecture-aware troubleshooting and operational runbooks
- [x] Deployment security reference packs
- [x] Synthetic observability workspace
- [x] Deployment strategy simulations
- [x] Deployment-aware learning paths and local quiz progress
- [ ] Expand automated component and interaction tests
- [ ] Add keyboard-first accessibility and end-to-end browser coverage
- [ ] Expand provider-specific security and operational reference packs
- [ ] Add optional, explicitly configured real integrations only as a separately scoped product capability
