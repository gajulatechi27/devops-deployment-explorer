# DevOps Deployment Explorer

An interactive, simulation-first learning platform for understanding how applications move from source code to production across cloud and on-premises infrastructure.

## MVP features

- Interactive deployment architecture canvas (pan, zoom, select components)
- Three scenarios: GitHub Actions → Amazon EKS, Jenkins → Amazon EC2, GitLab CI → Docker on Linux
- Step-by-step simulated deployment with animated component states
- Deployment progress, pipeline stage status, event feed and command preview
- Component inspector explaining purpose and related technologies
- Simulation speed control and single-step execution

> **Safety:** This release is an educational simulator. It does not connect to cloud accounts, execute shell commands, provision infrastructure, or incur cloud charges. Commands shown are illustrative.

## Tech stack

React 18, TypeScript, Vite, Tailwind CSS, React Flow (@xyflow/react), Lucide icons.

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Roadmap

- [x] Interactive architecture canvas
- [x] AWS EC2 and EKS scenarios
- [x] On-premises Docker-on-Linux scenario
- [x] Component inspector and deployment event timeline
- [ ] Failure injection and recovery labs
- [ ] Safe terminal teaching mode
- [ ] Terraform, Dockerfile, Kubernetes YAML and pipeline editor views
- [ ] Azure, GCP, hybrid and multi-cloud scenarios
- [ ] Optional isolated real-cloud labs with explicit consent, least-privilege access and cost controls

## Project structure

```
src/
  components/     Reusable interface components
  data/           Deployment scenario definitions
  engine/         Simulation helpers
  types/          Shared TypeScript models
  App.tsx         Main workspace
  index.css       Application design system
```

## License

MIT
