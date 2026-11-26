# DeployLab — Interactive DevOps Simulation & Learning Platform

DeployLab is a simulation-only environment for learning how software is built, deployed, monitored and recovered. It combines architecture maps, deterministic deployment events, infrastructure labs, troubleshooting exercises and learning paths.

**Safety by design:** DeployLab does not connect to AWS, Azure, GCP, Kubernetes clusters or on-premises infrastructure. It does not execute shell commands, provision resources, request credentials or send telemetry. Every output is simulated in the browser.

## Workspaces

- **Architectures** — explore GitHub Actions → Amazon EKS, Jenkins → Amazon EC2 and GitLab CI → Docker on Linux. Inspect components, follow deployment stages and view illustrative commands.
- **Kubernetes** — step through an EKS release lifecycle, inspect control-plane responsibilities, and adjust a simulated replica count across worker nodes.
- **Troubleshoot** — inject ImagePullBackOff, CrashLoopBackOff, readiness-probe and Service-selector incidents; inspect symptoms and apply a simulated recovery.
- **Terminal** — practise a safe allow-listed subset of kubectl, Docker and Terraform commands. Unknown commands return a simulated error; commands never reach the host.
- **Monitoring** — inspect synthetic CPU, memory, request and error metrics; trigger a traffic spike and see alert thresholds change.
- **Strategies** — compare rolling, blue/green, canary and A/B release strategies by risk, downtime and rollout speed.
- **Terraform** — preview a simulated plan/apply and learn the infrastructure lifecycle without configuring a provider.
- **Learn** — complete short lessons and knowledge checks on CI/CD, Kubernetes reconciliation, probes and Infrastructure as Code.

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

The simulation engine has Node's built-in test runner coverage for ordered event progression, fault injection/recovery, reset behavior and empty event lists. CI runs tests before the TypeScript/Vite production build.

## Architecture

- React 18, TypeScript and Vite
- Data-driven architecture scenarios in `src/App.tsx`
- Shared simulation state transitions in `src/simulation/engine.ts`
- Interactive labs in `src/LabWorkspace.tsx`
- Node built-in tests in `src/simulation/engine.test.mjs`

The simulation engine is deterministic and local. New scenarios should define events and component metadata rather than implementing their own playback state machines.

## Product principles

1. Teach how systems behave, not only what components are called.
2. Keep architecture content and simulation events data-driven.
3. Make failure and recovery first-class learning activities.
4. Clearly label all commands, logs and metrics as simulated.
5. Never silently connect to or mutate real infrastructure.

## Roadmap

- [x] Responsive 2D architecture maps and component inspector
- [x] Shared deterministic simulation engine and unit tests
- [x] EKS lifecycle walkthrough and cluster replica visualizer
- [x] Troubleshooting fault injection and recovery exercises
- [x] Safe terminal command simulator
- [x] Synthetic monitoring and alert thresholds
- [x] Terraform plan/apply simulator
- [x] Deployment strategy comparison
- [x] Learning modules and quizzes
- [ ] Expand architecture library: ECS, Lambda, AKS, GKE, Helm, Ansible, Argo CD and GitOps
- [ ] Add more scenario-specific branching, rollback and dependency graphs
- [ ] Add persistent local learning progress and richer guided challenges
- [ ] Add accessible keyboard-first terminal history and command completion

