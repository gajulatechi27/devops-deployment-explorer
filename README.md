# DeployLab — 3D DevOps Deployment Explorer

DeployLab is an interactive, simulation-only platform for understanding how real-world software deployment architectures work. Users explore an isometric 3D topology, play deployment stages, inspect infrastructure components and learn the commands involved.

**No cloud accounts, credentials or infrastructure connections are required.** This project does not deploy real applications or execute commands.

## Current experience

- Interactive 3D architecture built with Three.js, React Three Fiber and Drei
- Orbit, pan and zoom around the deployment topology
- Animated deployment stages with play, pause, next and reset controls
- Clickable infrastructure components with explanations and technology tags
- Deployment sequence timeline and illustrative commands
- Three distinct architecture scenarios:
  - GitHub Actions → Amazon EKS
  - Jenkins → Amazon EC2
  - GitLab CI → Docker on an on-premises Linux server
- Responsive layout with cream / isometric visual language

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Technology

- React 18 + TypeScript + Vite
- Three.js + React Three Fiber + Drei
- Tailwind CSS
- Lucide icons

## Product principles

1. Teach deployment architecture through visuals, not cloud account integrations.
2. Every scenario has its own topology, sequence, components and explanations.
3. Deployment animations are simulations; commands are illustrative and never executed.
4. Keep architecture content data-driven so additional deployment patterns can be added without rebuilding the 3D engine.

## Roadmap

- [x] 3D deployment visualization engine
- [x] EKS, EC2 and on-premises Docker scenarios
- [x] Component inspector and deployment timeline
- [ ] More scenarios: ECS, Lambda, AKS, GKE, Terraform, Ansible, Argo CD and microservices
- [ ] Failure simulations: CrashLoopBackOff, ImagePullBackOff, failed health checks and rollback
- [ ] Deep-dive component lessons and architecture comparisons
- [ ] More accurate 3D service-specific assets and traffic packet animations

## Safety

All current flows are educational simulations. They do not connect to AWS, Azure, GCP, Kubernetes clusters or on-premises servers. No cloud credentials are requested or stored.
