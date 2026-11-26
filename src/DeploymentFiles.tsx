import { useMemo, useState } from "react";
import { Download, FileCode2, Folder, Search } from "lucide-react";

type LearningFile = { path: string; description: string; content: string };
type Props = { scenarioId: string; scenarioName: string; provider: string };

const commonEnv = `# Dummy learning values only — never use real credentials
APP_NAME=demo-web
APP_ENV=production
APP_PORT=8080
APP_HOST=192.0.2.25
LOG_LEVEL=info
DATABASE_HOST=192.0.2.40
DATABASE_PORT=5432
DATABASE_NAME=demo_app
DATABASE_USER=demo_user
DATABASE_PASSWORD=CHANGE_ME_DUMMY
IMAGE_TAG=demo-0.1.0
`;

const dockerfile = `# Example multi-stage Docker build for a Java Spring Boot application
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace
COPY . .
RUN ./gradlew clean bootJar

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/build/libs/*.jar app.jar
EXPOSE 8080
USER 10001
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
`;

const appYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo-web
  namespace: demo
spec:
  replicas: 2
  selector:
    matchLabels:
      app: demo-web
  template:
    metadata:
      labels:
        app: demo-web
    spec:
      containers:
        - name: demo-web
          image: registry.example.invalid/demo/web:demo-0.1.0
          ports:
            - name: http
              containerPort: 8080
          envFrom:
            - configMapRef:
                name: demo-web-config
          readinessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 10
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
`;

const k8sFiles: LearningFile[] = [
  { path: "Dockerfile", description: "Builds the application image.", content: dockerfile },
  { path: ".dockerignore", description: "Keeps local and secret files out of the build context.", content: `.git
node_modules
build
.gradle
.env
*.log
` },
  { path: ".env.example", description: "Dummy local environment variables.", content: commonEnv },
  { path: "k8s/namespace.yaml", description: "Creates an isolated Kubernetes namespace.", content: `apiVersion: v1
kind: Namespace
metadata:
  name: demo
` },
  { path: "k8s/configmap.yaml", description: "Non-secret runtime configuration.", content: `apiVersion: v1
kind: ConfigMap
metadata:
  name: demo-web-config
  namespace: demo
data:
  APP_ENV: "production"
  APP_PORT: "8080"
  LOG_LEVEL: "info"
  DATABASE_HOST: "192.0.2.40"
` },
  { path: "k8s/secret.example.yaml", description: "Placeholder only. Replace through a secret manager; do not commit real secrets.", content: `apiVersion: v1
kind: Secret
metadata:
  name: demo-web-secret
  namespace: demo
type: Opaque
stringData:
  DATABASE_USER: "demo_user"
  DATABASE_PASSWORD: "CHANGE_ME_DUMMY"
` },
  { path: "k8s/deployment.yaml", description: "Declares replicas, image, probes and resource limits.", content: appYaml },
  { path: "k8s/service.yaml", description: "Exposes Pods inside the cluster.", content: `apiVersion: v1
kind: Service
metadata:
  name: demo-web
  namespace: demo
spec:
  type: ClusterIP
  selector:
    app: demo-web
  ports:
    - name: http
      port: 80
      targetPort: http
` },
  { path: "k8s/ingress.yaml", description: "Example host-based HTTP routing; adapt ingressClassName to your controller.", content: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: demo-web
  namespace: demo
spec:
  ingressClassName: nginx
  rules:
    - host: demo.example.invalid
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: demo-web
                port:
                  number: 80
` },
  { path: "k8s/hpa.yaml", description: "Scales replicas using CPU utilization metrics.", content: `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: demo-web
  namespace: demo
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: demo-web
  minReplicas: 2
  maxReplicas: 5
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
` }
];

function pipelineFiles(id: string): LearningFile[] {
  if (id === "ec2") return [
    { path: "Jenkinsfile", description: "Declarative Jenkins pipeline: checkout, test, package, transfer and restart.", content: `pipeline {
  agent any
  environment {
    APP_HOST = '192.0.2.25'
    APP_USER = 'deploy'
    APP_DIR = '/opt/demo-app'
  }
  stages {
    stage('Checkout') { steps { checkout scm } }
    stage('Test') { steps { sh './gradlew test' } }
    stage('Build JAR') { steps { sh './gradlew bootJar' } }
    stage('Archive') { steps { archiveArtifacts artifacts: 'build/libs/*.jar', fingerprint: true } }
    stage('Deploy') {
      steps {
        sh 'scp build/libs/*.jar ${APP_USER}@${APP_HOST}:${APP_DIR}/app.jar'
        sh 'ssh ${APP_USER}@${APP_HOST} "sudo systemctl restart demo-app"'
      }
    }
    stage('Verify') { steps { sh 'curl -fsS http://192.0.2.25:8080/health' } }
  }
}
` },
    { path: "scripts/deploy.sh", description: "Server-side deployment script with a basic backup and service restart.", content: `#!/usr/bin/env bash
set -euo pipefail
APP_DIR=/opt/demo-app
sudo install -d -o deploy -g deploy "$APP_DIR"
if [ -f "$APP_DIR/app.jar" ]; then
  cp "$APP_DIR/app.jar" "$APP_DIR/app.jar.previous"
fi
sudo systemctl restart demo-app
sudo systemctl --no-pager --full status demo-app
curl -fsS http://127.0.0.1:8080/health
` },
    { path: "systemd/demo-app.service", description: "Runs the JAR as a Linux systemd service.", content: `[Unit]
Description=Demo Java application
After=network.target

[Service]
User=deploy
WorkingDirectory=/opt/demo-app
ExecStart=/usr/bin/java -jar /opt/demo-app/app.jar
Restart=always
RestartSec=5
EnvironmentFile=-/etc/demo-app/demo-app.env

[Install]
WantedBy=multi-user.target
` },
    { path: "nginx/demo-app.conf", description: "Reverse proxy from HTTP port 80 to the local Java process.", content: `server {
  listen 80;
  server_name demo.example.invalid;
  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
` },
    { path: "config/application.properties", description: "Sample Spring Boot runtime settings.", content: `server.port=8080
spring.application.name=demo-app
management.endpoints.web.exposure.include=health,info
management.endpoint.health.show-details=never
` },
    { path: ".env.example", description: "Dummy server settings and placeholders.", content: commonEnv }
  ];
  if (id === "docker") return [
    { path: ".gitlab-ci.yml", description: "GitLab pipeline to test, build, push and deploy the container.", content: `stages: [test, build, deploy]
variables:
  IMAGE_NAME: registry.example.invalid/team/demo
  IMAGE_TAG: $CI_COMMIT_SHORT_SHA

test:
  stage: test
  image: node:22
  script:
    - npm ci
    - npm test

build:
  stage: build
  image: docker:27
  services: [docker:27-dind]
  script:
    - docker build -t $IMAGE_NAME:$IMAGE_TAG .
    - docker login -u "$REGISTRY_USER" -p "$REGISTRY_PASSWORD" "$CI_REGISTRY"
    - docker push $IMAGE_NAME:$IMAGE_TAG

deploy:
  stage: deploy
  image: alpine:3.20
  script:
    - echo "Demo deployment target 192.0.2.25"
    - ssh deploy@192.0.2.25 "cd /opt/demo && IMAGE_TAG=$IMAGE_TAG docker compose pull && docker compose up -d"
  only: [main]
` },
    { path: "Dockerfile", description: "Container image definition.", content: dockerfile },
    { path: "docker-compose.yml", description: "Starts the application with an isolated network and persistent log volume.", content: `services:
  web:
    build: .
    image: registry.example.invalid/team/demo:demo-0.1.0
    ports:
      - "8080:8080"
    env_file: .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-fsS", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    volumes:
      - app-logs:/var/log/demo
volumes:
  app-logs:
` },
    { path: ".env.example", description: "Dummy values; copy to .env for a local lab.", content: commonEnv }
  ];
  if (id === "lambda-serverless") return [
    { path: "template.yaml", description: "AWS SAM template for a Lambda function and HTTP API.", content: `AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Dummy serverless learning stack
Resources:
  DemoFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/
      Handler: app.handler
      Runtime: python3.12
      Timeout: 15
      MemorySize: 256
      Environment:
        Variables:
          APP_ENV: demo
      Events:
        Api:
          Type: HttpApi
          Properties:
            Path: /health
            Method: GET
Outputs:
  ApiUrl:
    Value: !Sub "https://${ServerlessHttpApi}.execute-api.${AWS::Region}.amazonaws.com"
` },
    { path: "src/app.py", description: "Minimal Lambda handler.", content: `import json

def handler(event, context):
    return {
        "statusCode": 200,
        "headers": {"content-type": "application/json"},
        "body": json.dumps({"status": "ok", "message": "dummy lab response"})
    }
` },
    { path: "requirements.txt", description: "Python runtime dependencies (empty for this minimal example).", content: `# Add pinned dependencies here, e.g. requests==2.32.3
` },
    { path: "samconfig.toml", description: "Dummy SAM deployment defaults.", content: `version = 0.1
[default.deploy.parameters]
stack_name = "demo-serverless-stack"
resolve_s3 = true
region = "ap-south-1"
capabilities = "CAPABILITY_IAM"
confirm_changeset = true
` }
  ];
  if (id === "terraform-aws") return [
    { path: "main.tf", description: "Example Terraform resources for a small VPC and security group.", content: `terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}
provider "aws" { region = var.aws_region }
resource "aws_vpc" "demo" {
  cidr_block = var.vpc_cidr
  tags = { Name = "demo-vpc" }
}
resource "aws_security_group" "web" {
  name   = "demo-web-sg"
  vpc_id = aws_vpc.demo.id
  ingress {
    from_port = 8080
    to_port = 8080
    protocol = "tcp"
    cidr_blocks = ["192.0.2.0/24"]
  }
}
` },
    { path: "variables.tf", description: "Input variables with safe example defaults.", content: `variable "aws_region" { type = string; default = "ap-south-1" }
variable "vpc_cidr" { type = string; default = "10.20.0.0/16" }
` },
    { path: "outputs.tf", description: "Exports resource identifiers for later stages.", content: `output "vpc_id" { value = aws_vpc.demo.id }
output "web_security_group_id" { value = aws_security_group.web.id }
` },
    { path: "backend.example.hcl", description: "Illustrative remote state backend settings; bucket and key are placeholders.", content: `bucket = "demo-terraform-state-bucket"
key = "environments/dev/terraform.tfstate"
region = "ap-south-1"
encrypt = true
` },
    { path: ".github/workflows/terraform.yml", description: "CI validation and plan workflow (apply requires separate approval).", content: `name: Terraform validation
on: [pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: terraform fmt -check -recursive
      - run: terraform init -backend=false
      - run: terraform validate
      - run: terraform plan
` }
  ];
  if (id === "azure-appservice") return [
    { path: ".github/workflows/deploy.yml", description: "Builds a ZIP package and deploys to a staging slot. Azure credentials are placeholders.", content: `name: Build and deploy demo web app
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npm test --if-present
      - run: npm run build
      - run: zip -r app.zip dist
      - uses: actions/upload-artifact@v4
        with: { name: web-package, path: app.zip }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: echo "Demo only: deploy app.zip to App Service staging slot"
` },
    { path: "package.json", description: "Minimal web application package metadata.", content: `{
  "name": "demo-app-service",
  "version": "0.1.0",
  "scripts": { "build": "echo build demo", "test": "echo test demo" }
}
` },
    { path: "appsettings.example.json", description: "Dummy application settings; no real secrets.", content: `{
  "App": { "Name": "demo-web", "Environment": "staging" },
  "ServiceEndpoints": { "ApiBaseUrl": "https://api.example.invalid" },
  "FeatureFlags": { "newCheckout": false }
}
` }
  ];
  if (id === "argocd-gitops") return [
    { path: "Dockerfile", description: "Builds the container image consumed by the GitOps release.", content: dockerfile },
    ...k8sFiles.filter(f => f.path.startsWith("k8s/")),
    { path: "argocd/application.yaml", description: "Argo CD Application points to the GitOps path and destination cluster.", content: `apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: demo-web
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/example/demo-gitops.git
    targetRevision: main
    path: environments/dev
  destination:
    server: https://kubernetes.default.svc
    namespace: demo
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
` }
  ];
  if (id === "ecs-fargate") return [
    { path: "Dockerfile", description: "Container build used by the ECS task.", content: dockerfile },
    { path: "ecs/task-definition.example.json", description: "Dummy ECS Fargate task definition with CPU, memory, port and log settings.", content: `{
  "family": "demo-web",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::111122223333:role/demo-ecs-execution",
  "taskRoleArn": "arn:aws:iam::111122223333:role/demo-app-task",
  "containerDefinitions": [{
    "name": "web",
    "image": "111122223333.dkr.ecr.ap-south-1.amazonaws.com/demo:web-0.1.0",
    "essential": true,
    "portMappings": [{ "containerPort": 8080, "protocol": "tcp" }],
    "logConfiguration": { "logDriver": "awslogs", "options": {
      "awslogs-group": "/ecs/demo-web", "awslogs-region": "ap-south-1", "awslogs-stream-prefix": "app"
    }}
  }]
}
` },
    { path: "ecs/service-params.example.json", description: "Illustrative service networking and desired task count.", content: `{
  "cluster": "demo-cluster",
  "serviceName": "demo-web",
  "desiredCount": 2,
  "subnets": ["subnet-0demo111", "subnet-0demo222"],
  "securityGroups": ["sg-0demo123"],
  "assignPublicIp": "DISABLED"
}
` }
  ];
  // Kubernetes-based managed-cloud and reference architecture deployments share a
  // practical Docker + Kubernetes starter pack, with provider-specific CI examples.
  if (["aks", "gke"].includes(id) || ["marketplace", "retail", "netflix", "swiggy", "banking", "upi", "saas"].includes(id)) return k8sFiles;
  return [
    { path: "Dockerfile", description: "Container image definition.", content: dockerfile },
    { path: ".dockerignore", description: "Excludes local build output and environment files.", content: `.git
node_modules
build
.env
*.log
` },
    { path: ".env.example", description: "Dummy runtime configuration.", content: commonEnv },
    { path: "README-deployment.md", description: "Deployment notes and example commands.", content: `# ${id} deployment lab

1. Review the application build and runtime requirements.
2. Build the container: ` + "`docker build -t demo-app:0.1.0 .`" + `
3. Tag and push to your demo registry.
4. Update the deployment configuration with the image tag.
5. Deploy to a non-production environment and verify /health.

All hostnames, addresses, account IDs and credentials in this pack are placeholders.
` }
  ];
}

export default function DeploymentFiles({ scenarioId, scenarioName, provider }: Props) {
  const files = useMemo(() => {
    const base = pipelineFiles(scenarioId);
    const intro: LearningFile = {
      path: "README-LEARNING-PACK.md",
      description: "Explains the purpose of this sample deployment pack.",
      content: `# ${scenarioName} — sample deployment files

Provider / environment: ${provider}

This is a safe, fictional learning pack. Values such as IP addresses, hostnames, image names, account IDs, paths and credentials are dummy placeholders. No real infrastructure is created.

## Suggested learning order

1. Read the pipeline file (Jenkinsfile, GitLab CI or GitHub Actions workflow).
2. Follow the Dockerfile and understand build context, layers, ports and runtime user.
3. Inspect the image registry and version/tag references.
4. Read deployment configuration (Kubernetes YAML, ECS task definition, systemd unit or serverless template).
5. Review environment configuration and secret handling.
6. Run the commands manually only in a disposable local lab after adapting them.

Never commit real secrets. The secret example is intentionally fake and must be replaced with a secret manager or Kubernetes Secret created securely.
`
    };
    return [intro, ...base];
  }, [scenarioId, scenarioName, provider]);
  const [selected, setSelected] = useState(files[0]?.path || "");
  const active = files.find(file => file.path === selected) || files[0];
  const download = (file: LearningFile) => {
    const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.path.split("/").pop() || "deployment-file.txt";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };
  const downloadGuide = () => {
    const body = files.map(file => `# FILE: ${file.path}\n# ${file.description}\n\n${file.content}`).join("\n\n---\n\n");
    download({ path: "deployment-learning-pack.txt", description: "All sample files combined into one reference document.", content: body });
  };
  return <section className="deployment-files">
    <div className="files-heading">
      <div><div className="inspector-kicker">DEPLOYMENT FILES</div><b>{files.length} sample files for this flow</b><p>Dummy values only · editable examples · no real credentials</p></div>
      <button className="files-download-all" onClick={downloadGuide}><Download size={13}/> Download pack</button>
    </div>
    <div className="files-browser">
      <div className="files-tree">
        <div className="files-tree-title"><Folder size={13}/> FILE EXPLORER</div>
        {files.map(file => <button key={file.path} className={active?.path === file.path ? "file-row active" : "file-row"} onClick={() => setSelected(file.path)} title={file.description}><FileCode2 size={13}/><span>{file.path}</span></button>)}
      </div>
      <div className="file-preview">
        {active && <><div className="file-preview-head"><div><b>{active.path}</b><small>{active.description}</small></div><button onClick={() => download(active)}><Download size={13}/> Download</button></div><pre>{active.content}</pre></>}
      </div>
    </div>
    <div className="files-learning-note"><Search size={13}/> Study the pipeline first, then trace how it creates an artifact, publishes it and configures the target environment.</div>
  </section>;
}
