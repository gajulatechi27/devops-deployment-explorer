import { useEffect, useMemo, useState } from "react";
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
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/target/*.jar app.jar
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
  { path: "pom.xml", description: "Maven build file that produces the runnable JAR.", content: `<?xml version="1.0" encoding="UTF-8"?>\n<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">\n  <modelVersion>4.0.0</modelVersion>\n  <groupId>com.example</groupId><artifactId>demo-web</artifactId><version>0.1.0</version>\n  <parent><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-parent</artifactId><version>3.3.5</version><relativePath/></parent>\n  <properties><java.version>21</java.version></properties>\n  <dependencies><dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId></dependency><dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-actuator</artifactId></dependency></dependencies>\n  <build><plugins><plugin><groupId>org.springframework.boot</groupId><artifactId>spring-boot-maven-plugin</artifactId></plugin></plugins></build>\n</project>\n` },
  { path: "src/main/java/com/example/DemoApplication.java", description: "Tiny Spring Boot app used to create the sample JAR.", content: `package com.example;\n\nimport org.springframework.boot.SpringApplication;\nimport org.springframework.boot.autoconfigure.SpringBootApplication;\n\n@SpringBootApplication\npublic class DemoApplication {\n  public static void main(String[] args) { SpringApplication.run(DemoApplication.class, args); }\n}\n` },
  { path: "src/main/resources/application.properties", description: "Application runtime port and health endpoint settings.", content: `server.port=8080\nmanagement.endpoints.web.exposure.include=health,info\n` },
  { path: ".github/workflows/deploy.yml", description: "GitHub Actions example for test, image build, registry publish and Kubernetes rollout.", content: `name: Build and deploy demo
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - run: mvn -B test package
      - run: docker build -t registry.example.invalid/demo/web:demo-0.1.0 .
      - run: echo "Authenticate to your cloud registry using OIDC (placeholder)"
      - run: echo "docker push registry.example.invalid/demo/web:demo-0.1.0"
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Configure kubectl context for the target cluster (placeholder)"
      - run: kubectl apply -f k8s/
      - run: kubectl rollout status deployment/demo-web -n demo
` },
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

type CloudPackKind = "container" | "function" | "static" | "database" | "data" | "vm" | "iac" | "appengine";

function cloudPackKind(id: string): CloudPackKind | undefined {
  const groups: Record<CloudPackKind, string[]> = {
    container: ["ecs-fargate-ci", "app-runner", "azure-container-apps", "azure-aks-helm", "cloudrun", "gke-helm"],
    function: ["lambda-sam", "azure-functions", "gcp-functions", "step-functions"],
    static: ["azure-static-web", "gcs-cdn"],
    database: ["azure-sql", "cloudsql-migrate"],
    data: ["glue-etl", "azure-data-factory", "dataflow"],
    vm: ["elastic-beanstalk", "azure-vm", "gcp-gce"],
    iac: ["cloudformation", "azure-bicep", "terraform-gcp"],
    appengine: ["gcp-appengine"]
  };
  return (Object.keys(groups) as CloudPackKind[]).find(kind => groups[kind].includes(id));
}

function cloudSpecificFiles(id: string, provider: string): LearningFile[] | undefined {
  const kind = cloudPackKind(id);
  if (!kind) return undefined;
  const cloud = provider === "AWS CLOUD" ? "AWS" : provider === "MICROSOFT AZURE" ? "Azure" : "Google Cloud";
  const region = provider === "AWS CLOUD" ? "ap-south-1" : provider === "MICROSOFT AZURE" ? "centralindia" : "asia-south1";
  const pipelinePath = provider === "MICROSOFT AZURE" ? "azure-pipelines.yml" : provider === "GOOGLE CLOUD" ? "cloudbuild.yaml" : ".github/workflows/deploy.yml";
  const pipelineContent = provider === "MICROSOFT AZURE" ? `trigger:
  branches:
    include: [ main ]
pool:
  vmImage: ubuntu-latest
variables:
  appName: demo-app
  region: ${region}
stages:
- stage: Build
  jobs:
  - job: Validate
    steps:
    - checkout: self
    - script: echo "Install dependencies, run tests and package the release"
- stage: Deploy
  dependsOn: Build
  jobs:
  - deployment: DeployDemo
    environment: demo
    strategy:
      runOnce:
        deploy:
          steps:
          - script: echo "Authenticate with workload identity and deploy the approved artifact"
` : provider === "GOOGLE CLOUD" ? `steps:
- name: 'ubuntu'
  entrypoint: 'bash'
  args: ['-c', 'echo "Install dependencies, run tests and package the release"']
- name: 'gcr.io/cloud-builders/gcloud'
  entrypoint: 'bash'
  args: ['-c', 'echo "Authenticate with a dedicated service account and deploy the approved artifact"']
options:
  logging: CLOUD_LOGGING_ONLY
substitutions:
  _REGION: ${region}
  _APP_NAME: demo-app
` : `name: Deploy demo to AWS
on:
  workflow_dispatch:
permissions:
  contents: read
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Install dependencies, run tests and package the release"
      - run: echo "Authenticate to AWS using GitHub OIDC (role ARN is a placeholder)"
      - run: echo "Deploy the approved artifact to the demo environment"
`;
  const files: LearningFile[] = [
    { path: pipelinePath, description: `Provider-specific CI/CD example for the ${cloud} deployment. All connections are placeholders.`, content: pipelineContent },
    { path: ".env.example", description: "Dummy application settings; never store real secrets in this file.", content: `APP_NAME=demo-app
APP_ENV=staging
APP_PORT=8080
APP_HOST=demo.example.invalid
CLOUD_REGION=${region}
IMAGE_TAG=demo-0.1.0
DATABASE_HOST=db.demo.internal
DATABASE_NAME=demo_db
DATABASE_USER=demo_user
DATABASE_PASSWORD=CHANGE_ME_DUMMY
` }
  ];

  if (kind === "container") {
    files.push(
      { path: "Dockerfile", description: "Builds a small Java application image for the managed container service.", content: dockerfile },
      { path: "deployment/container-config.yaml", description: "Declarative container settings: image, port, health check and resource hints.", content: `app: demo-app
image: registry.example.invalid/demo/app:0.1.0
port: 8080
replicas: 2
healthCheck:
  path: /health
  intervalSeconds: 30
resources:
  cpu: 0.5
  memory: 512Mi
` },
      { path: "README-deploy.md", description: "Container build, registry, service rollout and verification sequence.", content: `# ${cloud} container deployment

1. Build and test the application.
2. Build the image: docker build -t demo-app:0.1.0 .
3. Authenticate to the provider registry using a short-lived identity.
4. Push an immutable image tag; do not use latest for production releases.
5. Update the service configuration with the approved image.
6. Deploy to a staging environment and verify /health, logs and rollout status.

Target example: ${id}. All registry names and credentials are fictional.
` }
    );
  } else if (kind === "function") {
    files.push(
      { path: "template.yaml", description: "Serverless function and HTTP trigger definition with least-privilege execution role placeholder.", content: `service: demo-function
provider:
  name: ${provider === "AWS CLOUD" ? "aws" : provider === "MICROSOFT AZURE" ? "azure" : "google"}
  region: ${region}
function:
  name: demo-handler
  runtime: python3.12
  handler: app.handler
  memory: 256
  timeoutSeconds: 15
trigger:
  type: http
  path: /health
  method: GET
environment:
  APP_ENV: demo
` },
      { path: "src/app.py", description: "Minimal HTTP-triggered function handler.", content: `import json

def handler(event, context=None):
    return {
        "statusCode": 200,
        "headers": {"content-type": "application/json"},
        "body": json.dumps({"status": "ok", "environment": "demo"})
    }
` },
      { path: "requirements.txt", description: "Pinned runtime dependencies; empty for this minimal example.", content: "# Add reviewed, pinned dependencies here.\n" },
      { path: "README-serverless.md", description: "Function packaging, trigger, permissions, environment variables and invocation.", content: `# ${cloud} serverless deployment

1. Review the handler signature and runtime version.
2. Install dependencies into the deployment package.
3. Validate the function template and permissions.
4. Deploy to a development stage using a dedicated identity.
5. Invoke the HTTP trigger and inspect structured logs.
6. Publish a version and move the alias/traffic only after verification.

Keep secrets in the provider secret manager. Do not place credentials in environment files or pipeline YAML.
` }
    );
  } else if (kind === "static") {
    files.push(
      { path: "package.json", description: "Static frontend build scripts.", content: `{
  "name": "demo-static-site",
  "version": "0.1.0",
  "scripts": { "test": "echo demo tests passed", "build": "vite build" },
  "devDependencies": { "vite": "5.4.10" }
}
` },
      { path: "src/index.html", description: "Static website entry point.", content: `<!doctype html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Demo site</title></head>
<body><main><h1>Demo static deployment</h1></main></body>
</html>
` },
      { path: "infra/static-site.example.yaml", description: "Illustrative private origin, TLS and cache configuration.", content: `site:
  bucket: demo-static-site
  originAccess: private
  tls: enabled
  defaultDocument: index.html
cache:
  htmlSeconds: 60
  immutableAssetsSeconds: 31536000
` },
      { path: "README-static-site.md", description: "Build, upload, origin protection, CDN invalidation and smoke test.", content: `# ${cloud} static website deployment

1. Run npm ci, tests and npm run build.
2. Inspect the generated dist/ directory.
3. Upload dist/ to the private object-storage origin.
4. Keep direct public bucket access disabled where supported; use the CDN origin identity.
5. Configure HTTPS and DNS.
6. Invalidate only changed paths and verify the public health check.

Never upload .env files, source maps containing secrets or local build caches.
` }
    );
  } else if (kind === "database") {
    files.push(
      { path: "database/connection.example.env", description: "Dummy private database endpoint and connection settings.", content: `DB_HOST=db.demo.internal
DB_PORT=5432
DB_NAME=demo_db
DB_USER=demo_migrator
DB_PASSWORD=CHANGE_ME_DUMMY
DB_SSLMODE=require
` },
      { path: "sql/V1__create_schema.sql", description: "Versioned initial schema migration.", content: `CREATE TABLE deployment_audit (
  event_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  release_version VARCHAR(40) NOT NULL,
  deployed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
` },
      { path: "sql/V2__add_release_index.sql", description: "Follow-up migration adding an index for release lookups.", content: `CREATE INDEX idx_deployment_audit_release
  ON deployment_audit(release_version);
` },
      { path: "flyway.conf.example", description: "Flyway migration configuration; credentials are placeholders.", content: `flyway.url=jdbc:postgresql://db.demo.internal:5432/demo_db
flyway.user=demo_migrator
flyway.password=CHANGE_ME_DUMMY
flyway.locations=filesystem:sql
flyway.validateMigrationNaming=true
` },
      { path: "README-database.md", description: "Schema migration, backup, permissions and rollback safety checklist.", content: `# ${cloud} database deployment

1. Confirm a recent backup and a tested restore procedure.
2. Validate migrations against a disposable database.
3. Review schema-lock and long-running migration risk.
4. Use a dedicated migration identity with only required DDL privileges.
5. Apply migrations in a controlled release window.
6. Verify schema version, connection health and application compatibility.

Do not expose database endpoints publicly. Use private networking, TLS and a secret manager.
` }
    );
  } else if (kind === "data") {
    files.push(
      { path: "jobs/demo_pipeline.py", description: "Small batch-processing example with input validation and structured output.", content: `import json

def run(records):
    valid = [row for row in records if row.get("id") is not None]
    return {"input_count": len(records), "valid_count": len(valid)}

if __name__ == "__main__":
    print(json.dumps(run([{"id": 1}, {"id": 2}, {}])))
` },
      { path: "config/job.yaml", description: "Illustrative job schedule, retry policy and input/output locations.", content: `job:
  name: demo-etl
  schedule: "0 2 * * *"
  retries: 2
  timeoutMinutes: 30
  input: gs://demo-input-bucket/raw/
  output: gs://demo-output-bucket/curated/
  environment: staging
` },
      { path: "README-data-pipeline.md", description: "Data ingestion, transformation, validation, retry and observability sequence.", content: `# ${cloud} data pipeline

1. Validate source schema and input partition.
2. Run the transformation against a small sample.
3. Write output to a versioned staging location.
4. Validate row counts, null rates and duplicate keys.
5. Promote the partition only when checks pass.
6. Monitor job duration, retries, throughput and data freshness.

Use separate service identities for source reads and destination writes. Example buckets are fictional.
` }
    );
  } else if (kind === "vm") {
    files.push(
      { path: "scripts/bootstrap.sh", description: "Linux VM bootstrap script for Java runtime, application directory and service user.", content: `#!/usr/bin/env bash
set -euo pipefail
sudo useradd --system --home /opt/demo-app --shell /usr/sbin/nologin demo-app || true
sudo install -d -o demo-app -g demo-app /opt/demo-app
java -version
echo "Install the approved JRE package using your image's package manager"
` },
      { path: "systemd/demo-app.service", description: "Systemd unit for a Java application running on the VM.", content: `[Unit]
Description=Demo application
After=network-online.target
Wants=network-online.target

[Service]
User=demo-app
WorkingDirectory=/opt/demo-app
ExecStart=/usr/bin/java -jar /opt/demo-app/app.jar
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
` },
      { path: "nginx/demo-app.conf", description: "Nginx reverse proxy to the local application process.", content: `server {
  listen 80;
  server_name demo.example.invalid;
  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
` },
      { path: "README-vm.md", description: "Image, network, bootstrap, service management and health verification.", content: `# ${cloud} VM deployment

1. Select a hardened base image and attach least-privilege instance identity.
2. Restrict SSH/RDP and application ports to approved source networks.
3. Bootstrap the runtime and create a dedicated non-login service user.
4. Transfer the versioned artifact and configure systemd.
5. Configure TLS termination and health checks.
6. Verify service status, logs, disk space and rollback artifact.

Example host: 192.0.2.55. This documentation uses reserved example addresses only.
` }
    );
  } else if (kind === "iac") {
    files.push(
      { path: "main.tf", description: "Provider-specific infrastructure-as-code starter with a small resource placeholder.", content: provider === "AWS CLOUD" ? `terraform {
  required_version = ">= 1.6.0"
  required_providers { aws = { source = "hashicorp/aws", version = "~> 5.0" } }
}
provider "aws" { region = "${region}" }
resource "aws_s3_bucket" "demo" { bucket = "demo-iac-bucket-111122223333" }
` : provider === "MICROSOFT AZURE" ? `terraform {
  required_version = ">= 1.6.0"
  required_providers { azurerm = { source = "hashicorp/azurerm", version = "~> 4.0" } }
}
provider "azurerm" { features {} }
resource "azurerm_resource_group" "demo" {
  name = "rg-demo-learning"
  location = "${region}"
}
` : `terraform {
  required_version = ">= 1.6.0"
  required_providers { google = { source = "hashicorp/google", version = "~> 6.0" } }
}
provider "google" { project = "demo-project-123456" region = "${region}" }
resource "google_storage_bucket" "demo" {
  name = "demo-learning-bucket-123456"
  location = "${region}"
  uniform_bucket_level_access = true
}
` },
      { path: "variables.tf", description: "Inputs for environment-specific values.", content: `variable "environment" { type = string; default = "dev" }
variable "resource_prefix" { type = string; default = "demo" }
` },
      { path: "outputs.tf", description: "Exports the resource identifier after a successful apply.", content: `output "environment" { value = var.environment }
` },
      { path: "README-iac.md", description: "Format, validate, plan, review and approval workflow.", content: `# ${cloud} infrastructure as code

1. Run terraform fmt -check.
2. Initialize providers with terraform init.
3. Validate configuration with terraform validate.
4. Review terraform plan and the proposed resource changes.
5. Require peer review and environment approval before apply.
6. Record outputs and manage state with encryption and locking.

Never commit state files, credentials or provider key files. Resource names and project/account values are fictional.
` }
    );
  } else {
    files.push(
      { path: "app.yaml", description: "App Engine service and runtime configuration.", content: `runtime: python312
service: demo-web
instance_class: F1
automatic_scaling:
  max_instances: 3
handlers:
  - url: /.*
    script: auto
` },
      { path: "main.py", description: "Minimal WSGI-compatible application entry point.", content: `def app(environ, start_response):
    body = b"DeployLab demo app is healthy"
    start_response("200 OK", [("Content-Type", "text/plain"), ("Content-Length", str(len(body)))])
    return [body]
` },
      { path: "requirements.txt", description: "Runtime dependency list.", content: "# Minimal demo has no external dependencies.\n" },
      { path: "README-appengine.md", description: "Runtime configuration, versioned deployment and traffic migration.", content: `# Google App Engine deployment

1. Review app.yaml runtime, scaling and handler configuration.
2. Run tests and package dependencies.
3. Deploy a new version without immediately shifting all traffic.
4. Verify the version health and application logs.
5. Gradually migrate traffic to the new version.
6. Roll back traffic to the previous healthy version if needed.

The project ID and service names are placeholders.
` }
    );
  }

  return files;
}

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
    stage('Test') { steps { sh 'mvn -B test' } }
    stage('Build JAR') { steps { sh 'mvn -B package' } }
    stage('Archive') { steps { archiveArtifacts artifacts: 'target/*.jar', fingerprint: true } }
    stage('Deploy') {
      steps {
        sh 'scp build/libs/*.jar \${APP_USER}@\${APP_HOST}:\${APP_DIR}/app.jar'
        sh 'ssh \${APP_USER}@\${APP_HOST} "sudo systemctl restart demo-app"'
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
    Value: !Sub "https://\${ServerlessHttpApi}.execute-api.\${AWS::Region}.amazonaws.com"
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

  if (id === "azure-devops-aks") return [
    { path: "azure-pipelines.yml", description: "Multi-stage Azure Pipeline: build, test, SonarQube quality gate, ACR push and AKS rollout.", content: `trigger:
  branches:
    include: [ main ]

pool:
  vmImage: ubuntu-latest

variables:
  imageRepository: demo-web
  dockerfilePath: Dockerfile
  tag: $(Build.BuildId)

stages:
- stage: Build
  jobs:
  - job: BuildTestScan
    steps:
    - checkout: self
    - task: Maven@4
      inputs:
        mavenPomFile: pom.xml
        goals: clean verify
    - task: SonarQubePrepare@7
      inputs:
        SonarQube: DemoSonarConnection
        scannerMode: Other
        extraProperties: |
          sonar.projectKey=demo-web
    - task: Maven@4
      inputs:
        mavenPomFile: pom.xml
        goals: sonar:sonar
    - task: SonarQubePublish@7
      inputs:
        pollingTimeoutSec: '300'
    - task: Docker@2
      inputs:
        command: buildAndPush
        repository: $(imageRepository)
        dockerfile: $(dockerfilePath)
        containerRegistry: DemoACRConnection
        tags: |
          $(tag)

- stage: Deploy
  dependsOn: Build
  jobs:
  - deployment: DeployAKS
    environment: demo-aks
    strategy:
      runOnce:
        deploy:
          steps:
          - task: KubernetesManifest@1
            inputs:
              action: deploy
              kubernetesServiceConnection: DemoAKSConnection
              namespace: demo
              manifests: k8s/*.yaml
              containers: demo.azurecr.io/demo-web:$(tag)
` },
    { path: "Dockerfile", description: "Builds the Java web application image.", content: dockerfile },
    { path: "pom.xml", description: "Maven build and test configuration.", content: k8sFiles.find(f => f.path === "pom.xml")?.content || "" },
    { path: "k8s/deployment.yaml", description: "AKS workload manifest with image placeholder and health probes.", content: appYaml },
    { path: "k8s/service.yaml", description: "ClusterIP service for the application Pods.", content: k8sFiles.find(f => f.path === "k8s/service.yaml")?.content || "" },
    { path: "sonar-project.properties", description: "SonarQube project key and source/test paths.", content: `sonar.projectKey=demo-web
sonar.projectName=Demo Web
sonar.sources=src
sonar.tests=src/test
sonar.java.binaries=target/classes
sonar.sourceEncoding=UTF-8
` },
    { path: "README-azure-devops.md", description: "Explains Azure Pipeline service connections and deployment stages.", content: `# Azure DevOps → AKS learning pack

1. Create an Azure Repos Git repository and commit this project.
2. Create a SonarQube service connection and configure the quality gate.
3. Create an Azure Container Registry service connection.
4. Create an AKS Kubernetes service connection with namespace-scoped permissions.
5. Run the Build stage and inspect test, scan and image-push output.
6. Approve the demo environment and inspect the AKS rollout.

All service connection names, endpoints and values are examples. Configure secrets through secure pipeline variables or workload identity; never commit credentials.
` }
  ];
  if (id === "sonar-nexus-ec2") return [
    { path: "Jenkinsfile", description: "Jenkins stages for Maven build, SonarQube gate, Nexus publish and Ansible deployment.", content: `pipeline {
  agent any
  tools { maven 'Maven-3.9' }
  environment {
    SONAR_PROJECT = 'demo-app'
    NEXUS_URL = 'https://nexus.example.invalid/repository/releases/'
    DEPLOY_HOST = '192.0.2.45'
  }
  stages {
    stage('Checkout') { steps { checkout scm } }
    stage('Build and Test') { steps { sh 'mvn -B clean verify' } }
    stage('SonarQube') {
      steps {
        withSonarQubeEnv('DemoSonar') {
          sh 'mvn -B sonar:sonar -Dsonar.projectKey=$SONAR_PROJECT'
        }
      }
    }
    stage('Quality Gate') {
      steps { timeout(time: 5, unit: 'MINUTES') { waitForQualityGate abortPipeline: true } }
    }
    stage('Publish to Nexus') {
      steps { withCredentials([usernamePassword(credentialsId: 'nexus-demo', usernameVariable: 'NX_USER', passwordVariable: 'NX_PASS')]) {
        sh 'mvn -B deploy -DskipTests'
      } }
    }
    stage('Deploy to EC2') {
      steps { sh 'ansible-playbook -i inventories/demo deploy.yml' }
    }
  }
}
` },
    { path: "pom.xml", description: "Maven project with test, package and deploy lifecycle.", content: k8sFiles.find(f => f.path === "pom.xml")?.content || "" },
    { path: "sonar-project.properties", description: "SonarQube source, test and coverage configuration.", content: `sonar.projectKey=demo-app
sonar.projectName=Demo Java Application
sonar.sources=src/main
sonar.tests=src/test
sonar.java.binaries=target/classes
sonar.sourceEncoding=UTF-8
` },
    { path: "settings-nexus.example.xml", description: "Maven server ID placeholder. Put credentials in Jenkins Credentials, not this file.", content: `<settings>
  <servers>
    <server>
      <id>demo-nexus</id>
      <username>CHANGE_ME_USER</username>
      <password>CHANGE_ME_DUMMY_SECRET</password>
    </server>
  </servers>
</settings>
` },
    { path: "ansible/inventories/demo", description: "Dummy EC2 inventory address and SSH user.", content: `[app]
192.0.2.45 ansible_user=deploy

[app:vars]
app_dir=/opt/demo-app
app_service=demo-app
` },
    { path: "ansible/deploy.yml", description: "Downloads the release artifact and restarts the Linux service.", content: `- name: Deploy demo application
  hosts: app
  become: true
  tasks:
    - name: Ensure application directory exists
      ansible.builtin.file:
        path: /opt/demo-app
        state: directory
        owner: deploy
        group: deploy
        mode: '0755'
    - name: Copy built artifact
      ansible.builtin.copy:
        src: ../target/demo-app.jar
        dest: /opt/demo-app/app.jar
        owner: deploy
        group: deploy
        mode: '0644'
    - name: Restart application
      ansible.builtin.systemd:
        name: demo-app
        state: restarted
        enabled: true
` },
    { path: "README-quality-artifacts.md", description: "Learning guide for quality gates and artifact repositories.", content: `# SonarQube + Nexus flow

- Jenkins is the orchestrator.
- SonarQube analyses source code; the quality gate decides whether promotion can continue.
- Nexus stores immutable, versioned JAR/WAR artifacts.
- The deployment stage retrieves the approved artifact and deploys it to the target host.

Use Jenkins Credentials for Nexus and SSH credentials. The values in this pack are placeholders only.
` }
  ];
  if (id === "s3-cloudfront") return [
    { path: "package.json", description: "Frontend package scripts for install, test and production build.", content: `{
  "name": "demo-static-site",
  "version": "0.1.0",
  "scripts": { "build": "vite build", "test": "echo demo tests passed" },
  "devDependencies": { "vite": "5.4.10" }
}
` },
    { path: "src/index.html", description: "Minimal static website entry point.", content: `<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Demo Static Site</title></head>
  <body><h1>Deployed from a CI pipeline</h1><script type="module" src="/main.js"></script></body>
</html>
` },
    { path: "src/main.js", description: "Small frontend entry module.", content: `document.querySelector("h1").textContent = "Hello from the S3 + CloudFront demo";
` },
    { path: ".github/workflows/deploy-s3.yml", description: "Builds static assets, syncs them to S3 and invalidates CloudFront. AWS auth is a placeholder.", content: `name: Deploy static site
on:
  push:
    branches: [main]
permissions:
  contents: read
  id-token: write
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npm test
      - run: npm run build
      - name: Configure AWS credentials
        run: echo "Configure GitHub OIDC role for demo account"
      - name: Upload site
        run: aws s3 sync dist/ s3://demo-web-bucket --delete
      - name: Invalidate CDN
        run: aws cloudfront create-invalidation --distribution-id E123DEMO --paths '/*'
` },
    { path: "infra/bucket-policy.example.json", description: "Example bucket policy shape; adapt origin access to CloudFront OAC before use.", content: `{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowCloudFrontReadOnly",
    "Effect": "Allow",
    "Principal": { "Service": "cloudfront.amazonaws.com" },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::demo-web-bucket/*",
    "Condition": { "StringEquals": { "AWS:SourceAccount": "111122223333" } }
  }]
}
` },
    { path: "infra/cloudfront-notes.md", description: "Cache behavior, TLS and origin access learning notes.", content: `# CloudFront configuration notes

- Use an S3 REST origin with Origin Access Control (OAC); keep the bucket private.
- Configure an ACM certificate in us-east-1 for a custom CloudFront hostname.
- Use a short cache policy for index.html and long immutable caching for hashed assets.
- Route 53 alias records point the website hostname to the distribution.
- Invalidate only when necessary; content-hashed assets normally avoid broad invalidations.
` }
  ];
  if (id === "rds-flyway") return [
    { path: "pom.xml", description: "Adds Flyway migration support to the Java application.", content: `<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId><artifactId>demo-db-migrations</artifactId><version>0.1.0</version>
  <properties><maven.compiler.release>21</maven.compiler.release><flyway.version>10.20.1</flyway.version></properties>
  <dependencies>
    <dependency><groupId>org.flywaydb</groupId><artifactId>flyway-core</artifactId><version>\${flyway.version}</version></dependency>
    <dependency><groupId>org.postgresql</groupId><artifactId>postgresql</artifactId><version>42.7.4</version></dependency>
  </dependencies>
</project>
` },
    { path: "flyway.conf.example", description: "Dummy private RDS endpoint and environment-variable placeholders.", content: `flyway.url=jdbc:postgresql://demo-db.abcdefghijkl.ap-south-1.rds.amazonaws.com:5432/demo
flyway.user=demo_migrator
flyway.password=CHANGE_ME_DUMMY
flyway.locations=filesystem:sql
flyway.connectRetries=10
flyway.validateMigrationNaming=true
` },
    { path: "sql/V1__create_customer_table.sql", description: "Initial versioned database schema migration.", content: `CREATE TABLE customer (
  customer_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
` },
    { path: "sql/V2__add_customer_status_index.sql", description: "Adds an index for common status-based queries.", content: `CREATE INDEX idx_customer_status ON customer(status);
` },
    { path: ".github/workflows/db-migrate.yml", description: "Runs Flyway validation and migration as a protected deployment job.", content: `name: Database migration
on:
  workflow_dispatch:
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Install Flyway CLI and validate against disposable database"
      - run: flyway -configFiles=flyway.conf.example validate
  migrate:
    needs: validate
    environment: database-change-approval
    runs-on: ubuntu-latest
    steps:
      - run: echo "Retrieve RDS credentials from a secret manager"
      - run: flyway migrate
` },
    { path: "README-database-release.md", description: "Safe migration order, backup and rollback considerations.", content: `# RDS schema deployment

1. Test migrations against a disposable database matching the RDS engine version.
2. Review DDL lock duration and backward compatibility.
3. Confirm a recent automated backup and point-in-time recovery settings.
4. Validate pending migrations with Flyway.
5. Apply migrations during the approved change window.
6. Verify flyway_schema_history and application health.

Do not store database passwords in Git. Use a secret manager and a least-privilege migration role. Prefer forward-fix migrations for production rollback planning.
` }
  ];
  if (id === "postgres-ec2") return [
    { path: "ansible/site.yml", description: "Installs and configures PostgreSQL on a Linux VM.", content: `- name: Configure PostgreSQL database host
  hosts: db
  become: true
  vars:
    postgres_version: 16
    postgres_listen_addresses: "10.20.2.15"
  roles:
    - role: geerlingguy.postgresql
      vars:
        postgresql_databases:
          - name: demo_db
        postgresql_users:
          - name: app_user
            password: CHANGE_ME_DUMMY
            db: demo_db
            priv: CONNECT
` },
    { path: "ansible/inventory.ini", description: "Dummy private IP for the database host.", content: `[db]
192.0.2.60 ansible_user=automation

[db:vars]
ansible_python_interpreter=/usr/bin/python3
` },
    { path: "postgresql/postgresql.conf", description: "Illustrative PostgreSQL listener, connection and WAL settings.", content: `listen_addresses = '10.20.2.15'
port = 5432
max_connections = 100
shared_buffers = '256MB'
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /var/lib/postgresql/archive/%f && cp %p /var/lib/postgresql/archive/%f'
` },
    { path: "postgresql/pg_hba.conf", description: "Restricts database connections to the application subnet and local administration.", content: `# TYPE  DATABASE  USER      ADDRESS          METHOD
local   all       postgres                   peer
host    demo_db   app_user  10.20.3.0/24     scram-sha-256
` },
    { path: "sql/bootstrap.sql", description: "Creates the database schema and application role (dummy password only).", content: `CREATE ROLE app_user LOGIN PASSWORD 'CHANGE_ME_DUMMY';
CREATE DATABASE demo_db OWNER app_user;
\\connect demo_db
CREATE SCHEMA app AUTHORIZATION app_user;
CREATE TABLE app.deployment_check (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
` },
    { path: "backup/backup.sh", description: "Creates a compressed logical backup and checks that the file is non-empty.", content: `#!/usr/bin/env bash
set -euo pipefail
BACKUP_DIR=/var/backups/postgresql
mkdir -p "$BACKUP_DIR"
pg_dump -Fc -d demo_db -f "$BACKUP_DIR/demo_db_$(date +%F).dump"
test -s "$BACKUP_DIR/demo_db_$(date +%F).dump"
` },
    { path: "README-db-host.md", description: "Explains OS, database, security, backup and recovery steps.", content: `# PostgreSQL on Linux VM learning flow

- Provision the VM and encrypted data volume.
- Restrict TCP/5432 to the application subnet only.
- Install PostgreSQL and review postgresql.conf and pg_hba.conf.
- Create database roles with least privilege.
- Enable automated backups and test restore procedures.
- Monitor disk, connections, replication lag (if configured), WAL and slow queries.
` }
  ];

  if (id === "maven-jfrog-vault") return [
    { path: "Jenkinsfile", description: "Maven build, SonarQube gate, Artifactory publish, Vault secret retrieval and Ansible deployment.", content: `pipeline {
  agent any
  tools { maven 'Maven-3.9' }
  environment {
    ARTIFACTORY_URL = 'https://artifactory.example.invalid/artifactory'
    APP_VERSION = '1.2.0'
  }
  stages {
    stage('Checkout') { steps { checkout scm } }
    stage('Build and Test') { steps { sh 'mvn -B clean verify' } }
    stage('SonarQube') {
      steps { withSonarQubeEnv('DemoSonar') { sh 'mvn sonar:sonar -Dsonar.projectKey=demo-java' } }
    }
    stage('Quality Gate') {
      steps { timeout(time: 5, unit: 'MINUTES') { waitForQualityGate abortPipeline: true } }
    }
    stage('Publish to Artifactory') {
      steps { withCredentials([usernamePassword(credentialsId: 'artifactory-demo', usernameVariable: 'ART_USER', passwordVariable: 'ART_PASS')]) {
        sh 'mvn -B deploy'
      } }
    }
    stage('Get deployment secret') {
      steps { sh 'vault kv get -field=ssh_key kv/apps/demo/deploy > deploy_key' }
    }
    stage('Deploy') { steps { sh 'ansible-playbook -i ansible/inventory ansible/deploy.yml' } }
  }
}
` },
    { path: "pom.xml", description: "Maven coordinates, Java version, test and package plugins, and distribution repository ID.", content: `<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId><artifactId>demo-java</artifactId><version>1.2.0</version>
  <properties><maven.compiler.release>21</maven.compiler.release><project.build.sourceEncoding>UTF-8</project.build.sourceEncoding></properties>
  <distributionManagement>
    <repository><id>demo-artifactory</id><url>https://artifactory.example.invalid/artifactory/libs-release-local</url></repository>
  </distributionManagement>
  <build><plugins>
    <plugin><groupId>org.apache.maven.plugins</groupId><artifactId>maven-surefire-plugin</artifactId><version>3.5.2</version></plugin>
  </plugins></build>
</project>
` },
    { path: "settings.example.xml", description: "Maven server credential placeholders. Store real values in Jenkins Credentials, not Git.", content: `<settings>
  <servers>
    <server>
      <id>demo-artifactory</id>
      <username>CHANGE_ME_USER</username>
      <password>CHANGE_ME_DUMMY_SECRET</password>
    </server>
  </servers>
</settings>
` },
    { path: "sonar-project.properties", description: "SonarQube project and source settings.", content: `sonar.projectKey=demo-java
sonar.projectName=Demo Java Service
sonar.sources=src/main
sonar.tests=src/test
sonar.java.binaries=target/classes
sonar.sourceEncoding=UTF-8
` },
    { path: "vault/policy.hcl", description: "Example Vault policy limited to one application's deployment secrets.", content: `path "kv/data/apps/demo/deploy" {
  capabilities = ["read"]
}
path "kv/metadata/apps/demo/deploy" {
  capabilities = ["read"]
}
` },
    { path: "vault/agent.hcl", description: "Illustrative Vault Agent auto-auth and template configuration; auth method is a placeholder.", content: `vault {
  address = "https://vault.example.invalid:8200"
}
auto_auth {
  method "approle" {
    mount_path = "auth/approle"
    config = {
      role_id_file_path = "/run/secrets/vault-role-id"
      secret_id_file_path = "/run/secrets/vault-secret-id"
    }
  }
}
template {
  source      = "/etc/vault/templates/app.env.ctmpl"
  destination = "/run/demo/app.env"
}
` },
    { path: "ansible/inventory.ini", description: "Dummy Linux deployment host and user.", content: `[app]
192.0.2.70 ansible_user=deploy

[app:vars]
app_dir=/opt/demo-java
app_service=demo-java
` },
    { path: "ansible/deploy.yml", description: "Copies the approved Maven artifact and restarts the application service.", content: `- name: Deploy Java release
  hosts: app
  become: true
  tasks:
    - name: Ensure application directory exists
      ansible.builtin.file:
        path: /opt/demo-java
        state: directory
        owner: deploy
        mode: '0755'
    - name: Install release artifact
      ansible.builtin.copy:
        src: ../target/demo-java-1.2.0.jar
        dest: /opt/demo-java/app.jar
        owner: deploy
        mode: '0644'
    - name: Restart service
      ansible.builtin.systemd:
        name: demo-java
        state: restarted
        enabled: true
` },
    { path: "README-artifact-secrets.md", description: "Explains Maven lifecycle, artifact immutability, Vault auth and least privilege.", content: `# Maven + Artifactory + Vault learning flow

1. Run mvn clean verify: validate, compile, test and package.
2. SonarQube evaluates source and the quality gate blocks unsafe promotion.
3. Maven deploy publishes the JAR and POM to Artifactory.
4. Promote an immutable build; do not rebuild a release artifact between environments.
5. Jenkins authenticates to Vault using a workload identity or short-lived AppRole credentials.
6. Read only the deployment secret path required by this job.
7. Deploy the selected artifact and verify service health.

All hosts and credentials are examples. Do not store tokens, passwords or private keys in source control or build logs.
` }
  ];
  if (id === "gradle-helm-argocd") return [
    { path: "settings.gradle", description: "Gradle project name and module inclusion.", content: `rootProject.name = 'demo-service'
include 'app'
` },
    { path: "build.gradle", description: "Gradle plugins, Java toolchain, test and application packaging.", content: `plugins {
    id 'java'
    id 'application'
}
group = 'com.example'
version = '1.2.0'
java { toolchain { languageVersion = JavaLanguageVersion.of(21) } }
repositories { mavenCentral() }
dependencies {
    testImplementation 'org.junit.jupiter:junit-jupiter:5.11.3'
}
test { useJUnitPlatform() }
application { mainClass = 'com.example.Main' }
` },
    { path: "gradle.properties", description: "Build performance and JVM settings for the Gradle wrapper.", content: `org.gradle.jvmargs=-Xmx1g -Dfile.encoding=UTF-8
org.gradle.parallel=true
org.gradle.caching=true
` },
    { path: "Dockerfile", description: "Packages the Gradle-built application into a minimal Java runtime image.", content: `FROM eclipse-temurin:21-jre
WORKDIR /app
COPY app/build/libs/app-1.2.0.jar app.jar
USER 10001
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
` },
    { path: "charts/demo/Chart.yaml", description: "Helm chart metadata and version.", content: `apiVersion: v2
name: demo
description: Demo application chart for the learning lab
type: application
version: 0.1.0
appVersion: "1.2.0"
` },
    { path: "charts/demo/values.yaml", description: "Default image, replica, service and resource values.", content: `replicaCount: 2
image:
  repository: registry.example.invalid/demo/web
  tag: "demo-1.2.0"
  pullPolicy: IfNotPresent
service:
  type: ClusterIP
  port: 80
  targetPort: 8080
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
` },
    { path: "charts/demo/templates/deployment.yaml", description: "Helm template for the Kubernetes Deployment.", content: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: {{ .Release.Name }}
  template:
    metadata:
      labels:
        app: {{ .Release.Name }}
    spec:
      containers:
        - name: app
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - containerPort: {{ .Values.service.targetPort }}
          resources:
{{ toYaml .Values.resources | indent 12 }}
` },
    { path: "charts/demo/templates/service.yaml", description: "Helm template for the Kubernetes Service.", content: `apiVersion: v1
kind: Service
metadata:
  name: {{ .Release.Name }}
spec:
  type: {{ .Values.service.type }}
  selector:
    app: {{ .Release.Name }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: {{ .Values.service.targetPort }}
` },
    { path: "environments/prod/values.yaml", description: "Production override with a pinned image tag and three replicas.", content: `replicaCount: 3
image:
  repository: registry.example.invalid/demo/web
  tag: "REPLACE_WITH_APPROVED_GIT_SHA"
` },
    { path: "argocd/application.yaml", description: "Argo CD Application that points to the Helm chart and production values.", content: `apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: demo-prod
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/example/demo-gitops.git
    targetRevision: main
    path: charts/demo
    helm:
      valueFiles:
        - ../../environments/prod/values.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: prod
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
` },
    { path: ".github/workflows/build-image.yml", description: "Gradle CI, image build and GitOps update handoff.", content: `name: Build and publish
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: '21' }
      - uses: gradle/actions/setup-gradle@v4
      - run: ./gradlew clean test build
      - run: docker build -t registry.example.invalid/demo/web:$GITHUB_SHA .
      - run: echo "Authenticate and push image; update GitOps repo with approved tag"
` },
    { path: "README-gradle-helm-gitops.md", description: "Explains the separation between CI image creation and Argo CD deployment reconciliation.", content: `# Gradle + Helm + Argo CD

- Gradle Wrapper makes the build reproducible; commit gradlew and gradle/wrapper files.
- CI runs tests and creates the application artifact and image.
- Helm templates Kubernetes resources from chart defaults and environment values.
- The GitOps repository records the desired image tag and release configuration.
- Argo CD watches Git and reconciles the cluster. CI does not need direct kubectl credentials.
- Review Argo CD diff and health before promoting changes.

All registry names and repositories are placeholders. Keep secrets in an external secret manager.
` }
  ];
  if (id === "observability-prom-grafana-datadog") return [
    { path: "otel-collector-config.yaml", description: "OpenTelemetry receiver, batch processor and Prometheus/OTLP exporters.", content: `receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318
processors:
  batch:
    timeout: 5s
exporters:
  prometheus:
    endpoint: 0.0.0.0:9464
  debug:
    verbosity: basic
service:
  pipelines:
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [prometheus, debug]
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [debug]
` },
    { path: "prometheus/prometheus.yml", description: "Scrape configuration for Prometheus and the application metrics endpoint.", content: `global:
  scrape_interval: 15s
  evaluation_interval: 15s
scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ['localhost:9090']
  - job_name: demo-app
    metrics_path: /actuator/prometheus
    static_configs:
      - targets: ['demo-app.demo.svc.cluster.local:8080']
` },
    { path: "prometheus/alerts.yml", description: "Example alert rules for high error ratio and elevated latency.", content: `groups:
  - name: demo-service
    rules:
      - alert: DemoHigh5xxRate
        expr: sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m])) / clamp_min(sum(rate(http_server_requests_seconds_count[5m])), 1) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: Demo service 5xx rate is above 5 percent
      - alert: DemoTargetDown
        expr: up{job="demo-app"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: Demo application metrics target is down
` },
    { path: "grafana/datasources/prometheus.yaml", description: "Provisioned Grafana Prometheus datasource.", content: `apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus.monitoring.svc:9090
    isDefault: true
` },
    { path: "grafana/dashboard-notes.md", description: "Suggested dashboard panels and useful PromQL queries.", content: `# Demo service dashboard

Panels:
- Request rate: sum(rate(http_server_requests_seconds_count[5m]))
- 5xx error rate: sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m]))
- p95 latency: histogram_quantile(0.95, sum by (le) (rate(http_server_requests_seconds_bucket[5m])))
- Pod restarts: increase(kube_pod_container_status_restarts_total[1h])
- CPU usage and memory working set by Pod

Add service, environment, version and cluster labels so dashboards can be filtered consistently.
` },
    { path: "datadog/agent-values.example.yaml", description: "Helm values example for Datadog Agent, logs, APM and Prometheus integration. API key must come from a secret.", content: `datadog:
  site: datadoghq.com
  apiKeyExistingSecret: datadog-secret
  logs:
    enabled: true
    containerCollectAll: true
  apm:
    portEnabled: true
  processAgent:
    processCollection: true
clusterAgent:
  enabled: true
agents:
  containers:
    agent:
      env:
        - name: DD_ENV
          value: demo
        - name: DD_SERVICE
          value: demo-web
` },
    { path: "kubernetes/servicemonitor.yaml", description: "Prometheus Operator ServiceMonitor example for a Kubernetes application.", content: `apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: demo-web
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: demo-web
  namespaceSelector:
    matchNames: [demo]
  endpoints:
    - port: http
      path: /actuator/prometheus
      interval: 30s
` },
    { path: "README-observability.md", description: "Explains metrics, logs, traces, dashboards, alert routing and telemetry cardinality.", content: `# Prometheus + Grafana + Datadog learning pack

1. Instrument the application and expose a metrics endpoint.
2. Configure OpenTelemetry SDK/Collector pipelines for metrics, logs and traces.
3. Configure Prometheus scrape targets and alert rules.
4. Provision Grafana datasource and create RED (rate, errors, duration) dashboards.
5. Install the Datadog Agent using a Kubernetes secret for the API key.
6. Correlate service, environment, version and trace IDs across signals.
7. Test alert routing with a disposable alert and document the runbook.

Avoid high-cardinality labels such as raw user IDs or request IDs. Never put API keys in YAML committed to Git.
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
  if (["eks", "aks", "gke"].includes(id) || ["marketplace", "retail", "netflix", "swiggy", "banking", "upi", "saas"].includes(id)) return k8sFiles;
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
2. Build the container with docker build -t demo-app:0.1.0 .
3. Tag and push to your demo registry.
4. Update the deployment configuration with the image tag.
5. Deploy to a non-production environment and verify /health.

All hostnames, addresses, account IDs and credentials in this pack are placeholders.
` }
  ];
}

export default function DeploymentFiles({ scenarioId, scenarioName, provider }: Props) {
  const files = useMemo(() => {
    const base = cloudSpecificFiles(scenarioId, provider) || pipelineFiles(scenarioId === "lambda-sam" ? "lambda-serverless" : scenarioId);
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
  useEffect(() => { setSelected(files[0]?.path || ""); }, [scenarioId]);
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
