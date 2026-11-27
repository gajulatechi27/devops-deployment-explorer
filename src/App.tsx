import { useEffect,useState } from "react";
import LabWorkspace from "./LabWorkspace";
import DeploymentFiles from "./DeploymentFiles";
import "./labs.css";
import { ArrowRight,Box,Check,ChevronDown,Cloud,Layers,Moon,Pause,Play,RotateCcw,Search,ShieldCheck,SkipBack,SkipForward,Sun,Workflow } from "lucide-react";

type NodeKind="source"|"pipeline"|"registry"|"cluster"|"workload"|"network"|"server"|"database";
type NodeDef={id:string;name:string;sub:string;kind:NodeKind;pos:[number,number,number];description:string;tech:string[]};
const brandIcons:Record<string,string>={git:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg",ci:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/githubactions/githubactions-original.svg",ecr:"https://raw.githubusercontent.com/icacho-dev/aws-architecture-icons/main/Architecture-Service-Icons_02072025/Arch_Containers/48/Arch_Amazon-Elastic-Container-Registry_48.svg",eks:"https://raw.githubusercontent.com/icacho-dev/aws-architecture-icons/main/Architecture-Service-Icons_02072025/Arch_Containers/48/Arch_Amazon-Elastic-Kubernetes-Service_48.svg",pods:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg",alb:"https://raw.githubusercontent.com/icacho-dev/aws-architecture-icons/main/Architecture-Service-Icons_02072025/Arch_Networking-Content-Delivery/48/Arch_Elastic-Load-Balancing_48.svg",jenkins:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jenkins/jenkins-original.svg",registry:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg",gitlab:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/gitlab/gitlab-original.svg",runner:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/gitlab/gitlab-original.svg",host:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg",ec2:"https://api.iconify.design/logos:aws-ec2.svg",nginx:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nginx/nginx-original.svg",container:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg",aks:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg",acr:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg",azureci:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg",gke:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/googlecloud/googlecloud-original.svg",gar:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/googlecloud/googlecloud-original.svg",cloudbuild:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/googlecloud/googlecloud-original.svg",market:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",edge:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cloudflare/cloudflare-original.svg",gateway:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nginx/nginx-original.svg",services:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",events:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apachekafka/apachekafka-original.svg",cache:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg",data:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",observability:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/grafana/grafana-original.svg",catalog:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/elasticsearch/elasticsearch-original.svg",cart:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg",orders:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",inventory:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",payments:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg",auth:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/keycloak/keycloak-original.svg",origin:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg",encode:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ffmpeg/ffmpeg-original.svg",recommend:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",restaurant:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",dispatch:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",location:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg",notify:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg",customer:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",payer:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/android/android-original.svg",payee:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/android/android-original.svg",switch:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apachekafka/apachekafka-original.svg",risk:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",ledger:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",recon:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",audit:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/grafana/grafana-original.svg",tenant:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",identity:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/keycloak/keycloak-original.svg",app:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",jobs:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rabbitmq/rabbitmq-original.svg",metering:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",sonar:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sonarqube/sonarqube-original.svg",nexus:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sonatype/sonatype-original.svg",pipeline:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azuredevops/azuredevops-original.svg",artifact:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nexus/nexus-original.svg",s3:"https://api.iconify.design/logos:aws-s3.svg",cdn:"https://api.iconify.design/logos:aws-cloudfront.svg",dns:"https://api.iconify.design/logos:aws-route53.svg",rds:"https://api.iconify.design/logos:aws-rds.svg",flyway:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flyway/flyway-original.svg",postgres:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",backup:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",gradle:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/gradle/gradle-original.svg",jfrog:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jfrog/jfrog-original.svg",vault:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vault/vault-original.svg",charts:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/helm/helm-original.svg",argocd:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/argocd/argocd-original.svg",prom:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prometheus/prometheus-original.svg",grafana:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/grafana/grafana-original.svg",datadog:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/datadog/datadog-original.svg",otel:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/opentelemetry/opentelemetry-original.svg"};
function iconForNode(node:NodeDef):string|undefined{
 const id=node.id.toLowerCase();
 const name=node.name.toLowerCase();
 const suffix=id.split("-").pop()||id;
 const direct=brandIcons[id]||brandIcons[suffix];
 if(direct)return direct;
 if(/developer|engineer|team|customer|consumer|user/.test(name))return undefined;
 if(/git(repository|hub)?/.test(name))return brandIcons.git;
 if(/jenkins/.test(name))return brandIcons.jenkins;
 if(/github actions/.test(name))return brandIcons.ci;
 if(/azure pipelines|azure devops/.test(name))return brandIcons.pipeline;
 if(/cloud build/.test(name))return brandIcons.cloudbuild;
 if(/ecr|container registry|artifact registry|docker registry/.test(name))return brandIcons.ecr||brandIcons.registry;
 if(/eks|kubernetes|k8s|aks|gke|cluster/.test(name))return /aks/.test(name)?brandIcons.aks:/gke/.test(name)?brandIcons.gke:brandIcons.eks;
 if(/application pods|pods/.test(name))return brandIcons.pods;
 if(/ec2|virtual machine/.test(name))return brandIcons.ec2;
 if(/lambda|step functions/.test(name))return brandIcons.origin;
 if(/s3|static build|artifact|package/.test(name))return brandIcons.artifact;
 if(/cloudfront|cdn/.test(name))return brandIcons.cdn;
 if(/rds|postgres|database|sql/.test(name))return brandIcons.postgres;
 if(/load balancer|ingress|gateway|nginx/.test(name))return brandIcons.nginx;
 if(/sonarqube|sonar/.test(name))return brandIcons.sonar;
 if(/nexus|jfrog|artifactory/.test(name))return brandIcons.jfrog;
 if(/vault/.test(name))return brandIcons.vault;
 if(/helm/.test(name))return brandIcons.charts;
 if(/argo/.test(name))return brandIcons.argocd;
 if(/prometheus/.test(name))return brandIcons.prom;
 if(/grafana/.test(name))return brandIcons.grafana;
 if(/datadog/.test(name))return brandIcons.datadog;
 if(/redis|cache/.test(name))return brandIcons.cache;
 if(/postgres|mysql|ledger|transaction/.test(name))return brandIcons.data;
 if(/python|risk|recon/.test(name))return brandIcons.recommend;
 if(/node|service|workload|application/.test(name))return brandIcons.services;
 return undefined;
}

type Stage={title:string;detail:string;command:string;node:string;from:string;to:string;kind:"request"|"response"|"success"};
type Scenario={id:string;name:string;provider:string;category:string;summary:string;nodes:NodeDef[];links:[string,string][];stages:Stage[];appNodes?:NodeDef[];appLinks?:[string,string][]};
type CloudFlowSpec={id:string;name:string;category:string;target:string;runtime:string;artifact:string;summary:string};
function makeCloudFlow(provider:string,s:CloudFlowSpec):Scenario{
 const p=s.id;
 const nodes:NodeDef[]=[
 {id:p+'-dev',name:'Developer',sub:'Code commit',kind:'source',pos:[-6,0,0],description:'A developer commits application code and deployment configuration.',tech:['Git','Pull request']},
 {id:p+'-repo',name:'Git Repository',sub:'Source + pipeline',kind:'source',pos:[-4,0,0],description:'Stores source code, build definitions, deployment manifests and environment examples.',tech:['Git','Branch protection']},
 {id:p+'-ci',name:provider==='AWS CLOUD'?'CI / CD Pipeline':provider==='MICROSOFT AZURE'?'Azure Pipelines':'Cloud Build',sub:'Test · scan · package',kind:'pipeline',pos:[-2,0,0],description:'Checks out source, runs tests and quality checks, packages the release and authenticates with a restricted cloud identity.',tech:['Build pipeline','Tests','Quality gate']},
 {id:p+'-artifact',name:s.artifact,sub:'Versioned release',kind:'registry',pos:[0,0,0],description:'Stores the versioned artifact or image. Promote the same immutable release instead of rebuilding it.',tech:['Versioning','Checksum','Retention']},
 {id:p+'-target',name:s.target,sub:'Cloud deployment target',kind:s.category==='DATABASE'?'database':s.category==='INFRASTRUCTURE'?'server':s.category==='KUBERNETES'?'cluster':s.category==='DATA PIPELINE'?'pipeline':'workload',pos:[2,0,0],description:s.summary,tech:[provider,'Deployment configuration','IAM / RBAC']},
 {id:p+'-runtime',name:s.runtime,sub:'Active release',kind:'workload',pos:[4,0,0],description:'The platform activates the new release. Review health checks, logs and service metrics before promotion.',tech:['Health checks','Rollback','Monitoring']},
 {id:p+'-users',name:'Consumers',sub:'Production traffic',kind:'source',pos:[6,0,0],description:'Users, applications or downstream data jobs consume the deployed service or data product.',tech:['Endpoint','Monitoring']}
 ];
 const steps=[['Commit source','Push application code, infrastructure definitions or database migrations to the main branch.','git push origin main',0,1,'request'],['Run CI validation','Check out the exact commit, install pinned dependencies and run unit tests, linting and static analysis.','./mvnw -B clean verify',1,2,'request'],['Package release','Create a versioned deployment artifact, function bundle, container image or infrastructure plan.','echo package release',2,3,'request'],['Publish artifact','Publish the immutable release to the cloud artifact store or registry with a traceable version.','echo publish release',3,4,'request'],['Deploy cloud target','Apply provider-specific configuration to the target using a restricted deployment identity.','echo deploy cloud target',4,5,'success'],['Verify and promote','Run smoke tests and health checks. Promote only after validation and retain the previous version for rollback.','curl -fsS https://demo.example.invalid/health',5,6,'response']] as const;
 const stages:Stage[]=steps.map(([title,detail,command,from,to,kind])=>({title,detail,command,node:nodes[to].id,from:nodes[from].id,to:nodes[to].id,kind}));
 return {id:s.id,name:s.name,provider,category:s.category,summary:s.summary,nodes,links:nodes.slice(0,-1).map((n,i)=>[n.id,nodes[i+1].id] as [string,string]),stages};
}
const cloudDeploymentScenarios:Scenario[]=[
makeCloudFlow("AWS CLOUD",{id:"ecs-fargate-ci",name:"GitHub Actions → Amazon ECS Fargate",category:"CONTAINERS",target:"Amazon ECS Fargate",runtime:"ECS Service",artifact:"ECR Image",summary:"Build an image, publish it to ECR and roll out an ECS Fargate service behind an Application Load Balancer."}),
makeCloudFlow("AWS CLOUD",{id:"lambda-sam",name:"AWS SAM → Lambda",category:"SERVERLESS",target:"AWS Lambda",runtime:"Lambda Alias",artifact:"S3 Artifact",summary:"Package a serverless function, publish a version and shift an alias after validation."}),
makeCloudFlow("AWS CLOUD",{id:"s3-cloudfront",name:"GitHub Actions → S3 + CloudFront",category:"STATIC WEB",target:"Amazon S3",runtime:"CloudFront Distribution",artifact:"Static Build",summary:"Build a frontend, sync assets to a private S3 origin and invalidate CloudFront."}),
makeCloudFlow("AWS CLOUD",{id:"rds-flyway",name:"Flyway → Amazon RDS",category:"DATABASE",target:"Amazon RDS PostgreSQL",runtime:"RDS Database",artifact:"SQL Migrations",summary:"Validate and apply versioned SQL migrations to a private RDS database."}),
makeCloudFlow("AWS CLOUD",{id:"elastic-beanstalk",name:"CodePipeline → Elastic Beanstalk",category:"PAAS",target:"Elastic Beanstalk",runtime:"EB Environment",artifact:"S3 Application Bundle",summary:"Build a ZIP/JAR bundle, store it in S3 and deploy it to Elastic Beanstalk."}),
makeCloudFlow("AWS CLOUD",{id:"app-runner",name:"ECR → AWS App Runner",category:"PAAS CONTAINERS",target:"AWS App Runner",runtime:"App Runner Service",artifact:"ECR Image",summary:"Publish an image to ECR and configure App Runner to deploy a managed web service."}),
makeCloudFlow("AWS CLOUD",{id:"step-functions",name:"SAM → Step Functions",category:"WORKFLOWS",target:"AWS Step Functions",runtime:"State Machine",artifact:"Lambda Artifacts",summary:"Deploy Lambda task functions and a Step Functions state machine as a versioned workflow."}),
makeCloudFlow("AWS CLOUD",{id:"glue-etl",name:"GitHub Actions → AWS Glue ETL",category:"DATA PIPELINE",target:"AWS Glue",runtime:"Glue Job",artifact:"S3 ETL Script",summary:"Upload ETL scripts and dependencies to S3 and update a Glue job."}),
makeCloudFlow("AWS CLOUD",{id:"cloudformation",name:"CloudFormation → VPC + EC2",category:"INFRASTRUCTURE",target:"AWS CloudFormation",runtime:"EC2 Auto Scaling",artifact:"CloudFormation Template",summary:"Validate and deploy a template that provisions VPC, security groups and an EC2 application tier."}),
makeCloudFlow("MICROSOFT AZURE",{id:"azure-functions",name:"Azure DevOps → Azure Functions",category:"SERVERLESS",target:"Azure Functions",runtime:"Function App",artifact:"ZIP Package",summary:"Build a function package and deploy to an Azure Functions staging slot before swap."}),
makeCloudFlow("MICROSOFT AZURE",{id:"azure-appservice",name:"Azure DevOps → App Service",category:"PAAS WEB",target:"Azure App Service",runtime:"App Service Slot",artifact:"ZIP Package",summary:"Build a web application, deploy to staging, smoke test and swap into production."}),
makeCloudFlow("MICROSOFT AZURE",{id:"azure-container-apps",name:"Azure DevOps → Container Apps",category:"CONTAINERS",target:"Azure Container Apps",runtime:"Container App Revision",artifact:"ACR Image",summary:"Build an image, push it to ACR and deploy a new Container Apps revision."}),
makeCloudFlow("MICROSOFT AZURE",{id:"azure-vm",name:"Azure Pipelines → Linux VM",category:"VIRTUAL MACHINE",target:"Azure Linux VM",runtime:"VM Application Service",artifact:"Pipeline Artifact",summary:"Publish a versioned JAR/ZIP and deploy it to Linux VMs using deployment groups."}),
makeCloudFlow("MICROSOFT AZURE",{id:"azure-sql",name:"Flyway → Azure SQL Database",category:"DATABASE",target:"Azure SQL Database",runtime:"Azure SQL Schema",artifact:"SQL Migrations",summary:"Validate and run versioned database migrations against an Azure SQL target."}),
makeCloudFlow("MICROSOFT AZURE",{id:"azure-static-web",name:"Azure Static Web Apps → Frontend",category:"STATIC WEB",target:"Azure Static Web Apps",runtime:"Static Web App",artifact:"Frontend Build",summary:"Build and publish static assets with preview environments and production deployment."}),
makeCloudFlow("MICROSOFT AZURE",{id:"azure-aks-helm",name:"Azure DevOps → AKS with Helm",category:"KUBERNETES",target:"Azure Kubernetes Service",runtime:"AKS Helm Release",artifact:"ACR Image",summary:"Build and scan an image, publish to ACR and upgrade AKS using a Helm chart."}),
makeCloudFlow("MICROSOFT AZURE",{id:"azure-data-factory",name:"Azure DevOps → Data Factory",category:"DATA PIPELINE",target:"Azure Data Factory",runtime:"ADF Pipeline",artifact:"ARM/Bicep Templates",summary:"Validate and publish Data Factory pipeline and linked-service templates."}),
makeCloudFlow("MICROSOFT AZURE",{id:"azure-bicep",name:"Bicep → Azure Infrastructure",category:"INFRASTRUCTURE",target:"Azure Resource Manager",runtime:"Azure Resources",artifact:"Bicep Template",summary:"Lint, validate and deploy Bicep templates for networking and application resources."}),
makeCloudFlow("GOOGLE CLOUD",{id:"cloudrun",name:"Cloud Build → Cloud Run",category:"SERVERLESS CONTAINERS",target:"Cloud Run",runtime:"Cloud Run Service",artifact:"Artifact Registry Image",summary:"Build a container, push it to Artifact Registry and deploy a Cloud Run revision."}),
makeCloudFlow("GOOGLE CLOUD",{id:"gcp-functions",name:"Cloud Build → Cloud Functions",category:"SERVERLESS",target:"Cloud Functions",runtime:"Function Revision",artifact:"Source Archive",summary:"Package function source, deploy a new revision and verify its HTTP trigger."}),
makeCloudFlow("GOOGLE CLOUD",{id:"gcp-appengine",name:"Cloud Build → App Engine",category:"PAAS WEB",target:"App Engine",runtime:"App Engine Version",artifact:"Source Bundle",summary:"Test, stage a source bundle and deploy a new App Engine version."}),
makeCloudFlow("GOOGLE CLOUD",{id:"gcp-gce",name:"Cloud Build → Compute Engine",category:"VIRTUAL MACHINE",target:"Compute Engine",runtime:"Managed Instance Group",artifact:"Build Artifact",summary:"Publish an application package and roll out a new VM instance template."}),
makeCloudFlow("GOOGLE CLOUD",{id:"cloudsql-migrate",name:"Flyway → Cloud SQL",category:"DATABASE",target:"Cloud SQL PostgreSQL",runtime:"Cloud SQL Database",artifact:"SQL Migrations",summary:"Run schema validation and migrations against a private Cloud SQL database."}),
makeCloudFlow("GOOGLE CLOUD",{id:"gcs-cdn",name:"Cloud Build → Cloud Storage + CDN",category:"STATIC WEB",target:"Cloud Storage",runtime:"Cloud CDN Backend",artifact:"Static Build",summary:"Build frontend assets, sync to Cloud Storage and refresh CDN cache."}),
makeCloudFlow("GOOGLE CLOUD",{id:"gke-helm",name:"Cloud Build → GKE with Helm",category:"KUBERNETES",target:"Google Kubernetes Engine",runtime:"GKE Helm Release",artifact:"Artifact Registry Image",summary:"Build and scan an image, publish it and upgrade a GKE release using Helm."}),
makeCloudFlow("GOOGLE CLOUD",{id:"dataflow",name:"Cloud Build → Dataflow",category:"DATA PIPELINE",target:"Dataflow",runtime:"Dataflow Job",artifact:"Flex Template Image",summary:"Build a Dataflow Flex Template image, publish it and launch a versioned job."}),
makeCloudFlow("GOOGLE CLOUD",{id:"terraform-gcp",name:"Terraform → GCP Infrastructure",category:"INFRASTRUCTURE",target:"Google Cloud resources",runtime:"GCP Network + Compute",artifact:"Terraform Plan",summary:"Validate Terraform changes before an approved apply provisions GCP resources."})
];
const scenarios:Scenario[]=[
{id:"eks",name:"GitHub Actions → Amazon EKS",provider:"AWS CLOUD",category:"KUBERNETES",summary:"Follow a container release from a Git commit through CI, Amazon ECR, Kubernetes scheduling and production traffic.",nodes:[
{id:"dev",name:"Developer",sub:"Code commit",kind:"source",pos:[-5,0,1],description:"A developer commits application changes and pushes them to the remote Git repository.",tech:["Git","GitHub"]},
{id:"git",name:"GitHub",sub:"Source repository",kind:"source",pos:[-3,0,-1],description:"The repository stores application source, Dockerfile, manifests and the workflow definition.",tech:["Repository","Webhook","Workflow YAML"]},
{id:"ci",name:"GitHub Actions",sub:"CI / CD pipeline",kind:"pipeline",pos:[-1,0,1],description:"A workflow checks out source, runs tests, builds the image and authenticates to AWS using short-lived OIDC credentials.",tech:["Actions runner","OIDC","Docker build"]},
{id:"ecr",name:"Amazon ECR",sub:"Container registry",kind:"registry",pos:[1,0,-1],description:"Amazon Elastic Container Registry stores versioned container images. Worker nodes pull the image when Pods are scheduled.",tech:["Image repository","Tags","IAM"]},
{id:"eks",name:"Amazon EKS",sub:"Kubernetes control plane",kind:"cluster",pos:[3,0,1],description:"EKS provides a managed Kubernetes control plane. The API server receives the desired Deployment state.",tech:["Kubernetes API","Deployment","ReplicaSet"]},
{id:"pods",name:"Application Pods",sub:"3 running replicas",kind:"workload",pos:[5,0,-1],description:"The scheduler places Pods onto worker nodes. Readiness probes determine when each replica can receive traffic.",tech:["Pods","Containers","Readiness probes"]},
{id:"alb",name:"Load Balancer",sub:"Ingress / HTTPS",kind:"network",pos:[3,0,3],description:"The AWS Load Balancer Controller provisions an ALB and routes external requests to healthy application targets.",tech:["ALB","Ingress","Target groups"]},
{id:"users",name:"End users",sub:"HTTPS requests",kind:"source",pos:[5,0,4],description:"Clients resolve the application hostname and send HTTPS requests to the public load balancer.",tech:["DNS","TLS","HTTPS"]}
],links:[["dev","git"],["git","ci"],["ci","ecr"],["ecr","eks"],["eks","pods"],["pods","alb"],["users","alb"]],stages:[
{title:"Developer pushes code",detail:"A new commit is pushed to the GitHub repository. The configured workflow trigger starts the release pipeline.",command:"git push origin main",node:"git",from:"dev",to:"git",kind:"request"},
{title:"CI workflow starts",detail:"GitHub Actions checks out the selected commit and prepares an isolated runner for the build.",command:"actions/checkout@v4",node:"ci",from:"git",to:"ci",kind:"request"},
{title:"Test and build image",detail:"The workflow runs automated tests, then packages the application into a container image tagged with the commit SHA.",command:"docker build -t web:$GITHUB_SHA .",node:"ci",from:"ci",to:"ci",kind:"request"},
{title:"Push image to ECR",detail:"The workflow obtains temporary AWS credentials using OIDC and pushes the image to Amazon ECR.",command:"docker push $ECR_REPOSITORY:$GITHUB_SHA",node:"ecr",from:"ci",to:"ecr",kind:"request"},
{title:"Apply Kubernetes Deployment",detail:"The deployment manifest is submitted to the EKS API. Kubernetes controllers reconcile the desired replica count.",command:"kubectl apply -f deployment.yaml",node:"eks",from:"ecr",to:"eks",kind:"request"},
{title:"Schedule application Pods",detail:"The scheduler assigns Pods to worker nodes. Kubelet pulls the image and starts containers; readiness probes run.",command:"kubectl rollout status deploy/web",node:"pods",from:"eks",to:"pods",kind:"success"},
{title:"Route production traffic",detail:"Healthy Pods become endpoints behind the Service and ingress load balancer. Users can now access the application.",command:"kubectl get pods,svc,ingress",node:"alb",from:"pods",to:"alb",kind:"response"}
]},
{id:"ec2",name:"Jenkins → Amazon EC2",provider:"AWS CLOUD",category:"VIRTUAL MACHINE",summary:"See a traditional server deployment: Jenkins builds an artifact, transfers it to a Linux EC2 instance and restarts the application service.",nodes:[
{id:"repo",name:"Git Repository",sub:"Application source",kind:"source",pos:[-4,0,0],description:"Source code and release history are maintained in Git.",tech:["Git","Branches"]},
{id:"jenkins",name:"Jenkins",sub:"Build pipeline",kind:"pipeline",pos:[-1.5,0,-1],description:"Jenkins checks out source, executes tests, packages the application and orchestrates deployment.",tech:["Jenkinsfile","Pipeline","Agents"]},
{id:"artifact",name:"Build Artifact",sub:"Versioned package",kind:"registry",pos:[1,0,1],description:"The immutable release package is archived so deployments are traceable and rollback is possible.",tech:["JAR / ZIP","Artifact version"]},
{id:"ec2",name:"Amazon EC2",sub:"Linux instance",kind:"server",pos:[3.5,0,-1],description:"An EC2 virtual machine runs Linux. Security groups control permitted network access.",tech:["EC2","Linux","Security groups"]},
{id:"nginx",name:"Nginx + App",sub:"systemd service",kind:"workload",pos:[5.5,0,1],description:"Nginx reverse-proxies requests to the application process supervised by systemd.",tech:["Nginx","systemd","Health check"]},
{id:"users",name:"Users",sub:"Web traffic",kind:"source",pos:[5.5,0,3],description:"Users access the application through its DNS name and HTTP or HTTPS endpoint.",tech:["DNS","HTTP","TLS"]}
],links:[["repo","jenkins"],["jenkins","artifact"],["artifact","ec2"],["ec2","nginx"],["users","nginx"]],stages:[
{title:"Source checkout",detail:"Jenkins checks out the release commit from the Git repository.",command:"git checkout $GIT_COMMIT",node:"jenkins",from:"repo",to:"jenkins",kind:"request"},
{title:"Build and test",detail:"The Jenkins agent installs dependencies, runs automated tests and packages the application.",command:"./gradlew clean test build",node:"artifact",from:"jenkins",to:"artifact",kind:"request"},
{title:"Archive release artifact",detail:"Jenkins archives a versioned artifact for traceability and rollback.",command:"archiveArtifacts 'build/libs/*.jar'",node:"artifact",from:"jenkins",to:"artifact",kind:"success"},
{title:"Transfer artifact to EC2",detail:"The pipeline transfers the release package to the target Linux instance using a restricted deployment identity.",command:"scp app.jar deploy@host:/opt/app/",node:"ec2",from:"artifact",to:"ec2",kind:"request"},
{title:"Restart application service",detail:"systemd restarts the application. Nginx continues to proxy traffic to the service after it becomes healthy.",command:"sudo systemctl restart webapp",node:"nginx",from:"ec2",to:"nginx",kind:"success"},
{title:"Verify endpoint",detail:"A health check confirms the application responds successfully after deployment.",command:"curl -fsS https://app.example.com/health",node:"users",from:"nginx",to:"users",kind:"response"}
]},
{id:"docker",name:"GitLab CI → Docker on Linux",provider:"ON-PREMISES",category:"CONTAINER DEPLOYMENT",summary:"Trace a container deployment to an on-premises Linux VM using GitLab Runner and a private container registry.",nodes:[
{id:"gitlab",name:"GitLab",sub:"Source repository",kind:"source",pos:[-4,0,0],description:"GitLab stores application code and the .gitlab-ci.yml pipeline definition.",tech:["Git","GitLab CI"]},
{id:"runner",name:"GitLab Runner",sub:"CI pipeline",kind:"pipeline",pos:[-1.5,0,-1],description:"The runner executes lint, test and Docker image build jobs.",tech:["Runner","CI jobs","Docker"]},
{id:"registry",name:"Private Registry",sub:"OCI images",kind:"registry",pos:[1,0,1],description:"The private registry stores the tagged image so the target host can pull the exact release.",tech:["OCI registry","Image tags"]},
{id:"host",name:"Linux Server",sub:"On-premises VM",kind:"server",pos:[3.5,0,-1],description:"An on-premises Linux virtual machine runs Docker Engine and retrieves the release image.",tech:["Ubuntu","Docker Engine","Firewall"]},
{id:"container",name:"App Container",sub:"Docker Compose",kind:"workload",pos:[5.5,0,1],description:"Docker Compose starts the application container with ports, environment configuration, restart policy and health check.",tech:["Docker Compose","Container","Healthcheck"]},
{id:"staff",name:"Internal users",sub:"Private network",kind:"source",pos:[5.5,0,3],description:"Internal users reach the application over the organization's private network.",tech:["LAN","DNS","HTTP"]}
],links:[["gitlab","runner"],["runner","registry"],["registry","host"],["host","container"],["staff","container"]],stages:[
{title:"Commit triggers pipeline",detail:"A developer pushes a commit. GitLab evaluates the pipeline configuration and schedules jobs on a runner.",command:"git push origin main",node:"gitlab",from:"gitlab",to:"runner",kind:"request"},
{title:"Run tests",detail:"The runner installs dependencies and executes the project's automated test suite.",command:"npm ci && npm test",node:"runner",from:"runner",to:"runner",kind:"request"},
{title:"Build container image",detail:"Docker packages the application and its runtime dependencies into an OCI image.",command:"docker build -t registry.local/web:$CI_COMMIT_SHA .",node:"registry",from:"runner",to:"registry",kind:"request"},
{title:"Push image to registry",detail:"The runner authenticates to the private registry and publishes the commit-tagged image.",command:"docker push registry.local/web:$CI_COMMIT_SHA",node:"registry",from:"runner",to:"registry",kind:"success"},
{title:"Pull image on server",detail:"The on-premises Linux host pulls the exact image version from the private registry.",command:"docker pull registry.local/web:$CI_COMMIT_SHA",node:"host",from:"registry",to:"host",kind:"request"},
{title:"Start container",detail:"Docker Compose starts the updated container and checks its health before the service is considered ready.",command:"docker compose up -d && docker compose ps",node:"container",from:"host",to:"container",kind:"success"},
{title:"Application receives traffic",detail:"Internal users can now access the application through the private network endpoint.",command:"curl http://app.internal/health",node:"staff",from:"container",to:"staff",kind:"response"}
]},
{id:"aks",name:"GitHub Actions → Azure AKS",provider:"MICROSOFT AZURE",category:"KUBERNETES",summary:"Build and release a container to Azure Kubernetes Service using Azure Container Registry, federated identity and Azure ingress.",nodes:[
{id:"dev",name:"Developer",sub:"Git commit",kind:"source",pos:[-5,0,0],description:"A developer pushes reviewed application changes to GitHub.",tech:["Git","Pull request"]},
{id:"git",name:"GitHub",sub:"Source repository",kind:"source",pos:[-3,0,0],description:"GitHub stores application source, tests, Dockerfile and Kubernetes manifests.",tech:["Git","Actions workflow"]},
{id:"azureci",name:"GitHub Actions",sub:"CI / CD runner",kind:"pipeline",pos:[-1,0,0],description:"The workflow tests the application, builds an OCI image and obtains short-lived Azure credentials through workload identity federation.",tech:["GitHub Actions","OIDC federation","Azure login"]},
{id:"acr",name:"Azure Container Registry",sub:"Private image registry",kind:"registry",pos:[1,0,0],description:"ACR stores immutable application image versions. AKS kubelet identity is granted AcrPull to retrieve images.",tech:["ACR","AcrPull","Image digest"]},
{id:"aks",name:"Azure Kubernetes Service",sub:"Managed control plane",kind:"cluster",pos:[3,0,0],description:"AKS receives Kubernetes manifests and reconciles Deployments, ReplicaSets and Pods.",tech:["AKS","Microsoft Entra ID","Kubernetes API"]},
{id:"pods",name:"Application Pods",sub:"Workload replicas",kind:"workload",pos:[5,0,0],description:"AKS node pools run application containers. Readiness probes gate traffic and autoscaling can add replicas.",tech:["Node pools","HPA","Readiness probes"]},
{id:"gateway",name:"Application Gateway",sub:"Ingress / WAF",kind:"network",pos:[7,0,0],description:"An Azure ingress integration or Application Gateway routes HTTPS requests to healthy Kubernetes services.",tech:["Ingress","WAF","TLS"]},
{id:"users",name:"Customers",sub:"HTTPS traffic",kind:"source",pos:[9,0,0],description:"Customers reach the deployed application through its public DNS endpoint.",tech:["DNS","HTTPS"]}
],links:[["dev","git"],["git","azureci"],["azureci","azureci"],["azureci","acr"],["acr","aks"],["aks","pods"],["pods","gateway"],["gateway","users"]],stages:[
{title:"Push application changes",detail:"A reviewed commit reaches GitHub and triggers the release workflow.",command:"git push origin main",node:"git",from:"dev",to:"git",kind:"request"},
{title:"Run CI validation",detail:"GitHub Actions checks out the commit, runs tests and scans dependencies and the container image.",command:"npm ci && npm test",node:"azureci",from:"git",to:"azureci",kind:"request"},
{title:"Authenticate to Azure",detail:"GitHub Actions exchanges its OIDC identity for short-lived Microsoft Entra credentials instead of storing a long-lived client secret.",command:"azure/login@v2 (OIDC)",node:"azureci",from:"azureci",to:"azureci",kind:"success"},
{title:"Build and push image to ACR",detail:"The runner builds a commit-tagged container image and pushes it to Azure Container Registry.",command:"docker build -t $ACR/web:$GITHUB_SHA . && docker push $ACR/web:$GITHUB_SHA",node:"acr",from:"azureci",to:"acr",kind:"request"},
{title:"Apply manifests to AKS",detail:"The deployment identity targets the AKS API and applies the Kubernetes Deployment. The AKS kubelet identity has AcrPull permission on ACR.",command:"kubectl apply -f k8s/ && kubectl rollout status deploy/web",node:"aks",from:"acr",to:"aks",kind:"request"},
{title:"Schedule and verify Pods",detail:"The scheduler places Pods on AKS node pools, kubelet pulls the image from ACR and readiness probes determine when replicas can receive traffic.",command:"kubectl get pods -o wide",node:"pods",from:"aks",to:"pods",kind:"success"},
{title:"Expose application through ingress",detail:"The ingress or Application Gateway integration routes HTTPS traffic to healthy Service endpoints.",command:"kubectl get svc,ingress",node:"gateway",from:"pods",to:"gateway",kind:"success"},
{title:"Verify production endpoint",detail:"A synthetic health check confirms the application is reachable through its public endpoint.",command:"curl -fsS https://app.example.com/health",node:"users",from:"gateway",to:"users",kind:"response"}
]},
{id:"gke",name:"Cloud Build → Google GKE",provider:"GOOGLE CLOUD",category:"KUBERNETES",summary:"Deploy through Cloud Build, Artifact Registry and Cloud Deploy to Google Kubernetes Engine with staged promotion.",nodes:[
{id:"dev",name:"Developer",sub:"Git commit",kind:"source",pos:[-5,0,0],description:"A developer commits application code and deployment configuration to GitHub.",tech:["Git","Pull request"]},
{id:"git",name:"GitHub",sub:"Application repository",kind:"source",pos:[-3,0,0],description:"The application repository contains source, Dockerfile and Kubernetes configuration.",tech:["GitHub","Cloud Build trigger"]},
{id:"cloudbuild",name:"Cloud Build",sub:"CI pipeline",kind:"pipeline",pos:[-1,0,0],description:"Cloud Build validates code, runs tests and builds the container image.",tech:["Cloud Build","Build triggers","Cloud Build YAML"]},
{id:"gar",name:"Artifact Registry",sub:"Container images",kind:"registry",pos:[1,0,0],description:"Artifact Registry stores versioned container images. GKE nodes retrieve the selected image using IAM permissions.",tech:["Artifact Registry","Image digest","IAM"]},
{id:"deploy",name:"Cloud Deploy",sub:"Release orchestration",kind:"pipeline",pos:[3,0,0],description:"Cloud Deploy manages release targets, rollout phases, verification and promotion between environments.",tech:["Delivery pipeline","Rollouts","Approvals"]},
{id:"gke",name:"Google Kubernetes Engine",sub:"Managed Kubernetes",kind:"cluster",pos:[5,0,0],description:"GKE manages the Kubernetes control plane and reconciles workloads onto cluster nodes.",tech:["GKE","Control plane","Workload Identity"]},
{id:"pods",name:"Application Pods",sub:"GKE workloads",kind:"workload",pos:[7,0,0],description:"Pods run across GKE nodes with probes, resource requests, autoscaling and Kubernetes Services.",tech:["Pods","HPA","Services"]},
{id:"users",name:"External users",sub:"HTTPS traffic",kind:"source",pos:[9,0,0],description:"Users access the application through an external load balancer or Gateway.",tech:["Cloud Load Balancing","DNS","TLS"]}
],links:[["dev","git"],["git","cloudbuild"],["cloudbuild","cloudbuild"],["cloudbuild","gar"],["gar","deploy"],["deploy","gke"],["gke","pods"],["pods","users"]],stages:[
{title:"Commit application and config",detail:"The developer pushes application changes to the source repository.",command:"git push origin main",node:"git",from:"dev",to:"git",kind:"request"},
{title:"Cloud Build trigger starts",detail:"A repository trigger starts a build that checks out the source and validates the application.",command:"gcloud builds submit --config=cloudbuild.yaml",node:"cloudbuild",from:"git",to:"cloudbuild",kind:"request"},
{title:"Test and build container",detail:"Cloud Build runs tests and creates an OCI container image from the Dockerfile.",command:"docker build -t web:$COMMIT_SHA .",node:"cloudbuild",from:"cloudbuild",to:"cloudbuild",kind:"request"},
{title:"Publish image to Artifact Registry",detail:"The pipeline pushes the immutable image to Artifact Registry for downstream deployment.",command:"docker push REGION-docker.pkg.dev/PROJECT/REPO/web:$COMMIT_SHA",node:"gar",from:"cloudbuild",to:"gar",kind:"success"},
{title:"Create Cloud Deploy release",detail:"The release references the image and rendered Kubernetes manifests. Cloud Deploy creates a rollout for the first target.",command:"gcloud deploy releases create release-$SHORT_SHA",node:"deploy",from:"gar",to:"deploy",kind:"request"},
{title:"Promote through environments",detail:"The rollout deploys to a test target, runs verification and promotes the same artifact to production after approval.",command:"gcloud deploy releases promote --release=release-$SHORT_SHA",node:"gke",from:"deploy",to:"gke",kind:"request"},
{title:"GKE schedules application Pods",detail:"GKE schedules Pods onto nodes, pulls the image from Artifact Registry and waits for readiness.",command:"kubectl rollout status deployment/web",node:"pods",from:"gke",to:"pods",kind:"success"},
{title:"Serve production traffic",detail:"The Kubernetes Service and external load balancer route HTTPS requests to healthy replicas.",command:"kubectl get svc,ingress",node:"users",from:"pods",to:"users",kind:"response"}
]},
{id:"marketplace",name:"Flipkart-style Marketplace (Reference)",provider:"REAL-WORLD PATTERN",category:"E-COMMERCE MICROSERVICES",summary:"A representative high-scale marketplace architecture: deploy catalog, cart, order and payment services, with event streaming, cache, databases and edge routing. Not Flipkart's actual internal design.",nodes:[
{id:"dev",name:"Engineering team",sub:"Service code",kind:"source",pos:[-5,0,0],description:"Teams own independently deployable catalog, cart, order and payment services in source control.",tech:["Git","Microservices","Pull requests"]},
{id:"ci",name:"CI / CD Platform",sub:"Build and release",kind:"pipeline",pos:[-3,0,0],description:"Pipelines test each service, scan dependencies and images, sign artifacts and promote releases.",tech:["GitHub Actions","Argo CD","Image signing"]},
{id:"registry",name:"Container Registry",sub:"Immutable images",kind:"registry",pos:[-1,0,0],description:"A private registry stores versioned service images by immutable digest.",tech:["Amazon ECR / GAR / ACR","SBOM","Image digest"]},
{id:"market",name:"Kubernetes Platform",sub:"Microservices cluster",kind:"cluster",pos:[1,0,0],description:"A managed Kubernetes platform runs independently scalable Catalog, Cart, Order and Payment services.",tech:["EKS / AKS / GKE","Namespaces","HPA"]},
{id:"services",name:"Business Services",sub:"Catalog · Cart · Order · Payment",kind:"workload",pos:[3,0,0],description:"Domain services expose APIs and own business workflows. Payment processing is isolated behind strict authorization and idempotency controls.",tech:["REST / gRPC","Service mesh","Idempotency"]},
{id:"events",name:"Event Streaming",sub:"Order events",kind:"pipeline",pos:[5,0,0],description:"Order, inventory and payment events decouple asynchronous work such as notifications, fulfillment and stock updates.",tech:["Kafka / Pub/Sub","Outbox pattern","Consumers"]},
{id:"data",name:"Data Platform",sub:"SQL · Cache · Search",kind:"database",pos:[7,0,0],description:"Services use fit-for-purpose data stores: relational transactions, cache for hot reads and search indexes for product discovery.",tech:["PostgreSQL","Redis","OpenSearch / Elasticsearch"]},
{id:"edge",name:"CDN + API Gateway",sub:"WAF · Routing",kind:"network",pos:[9,0,0],description:"An edge layer terminates TLS, applies WAF/rate limits and routes API traffic to the correct service.",tech:["CDN","WAF","API Gateway"]},
{id:"users",name:"Shoppers",sub:"Web · Mobile apps",kind:"source",pos:[11,0,0],description:"Customers browse products, manage carts and place orders through web and mobile clients.",tech:["Web","Mobile","HTTPS"]}
],links:[["dev","ci"],["ci","registry"],["registry","market"],["market","services"],["services","events"],["events","data"],["data","edge"],["edge","users"]],stages:[
{title:"Commit a domain service change",detail:"A team updates one independently deployable service, such as Catalog or Cart, and opens a reviewed change.",command:"git push origin feature/catalog-search",node:"dev",from:"dev",to:"ci",kind:"request"},
{title:"Run service CI checks",detail:"The pipeline runs unit, contract and integration tests, dependency checks and static analysis for the changed service.",command:"npm ci && npm test && npm run build",node:"ci",from:"ci",to:"ci",kind:"request"},
{title:"Build and sign immutable image",detail:"The service image is built once, scanned and tagged with a commit identifier and digest.",command:"docker buildx build --tag marketplace/catalog:$GIT_SHA .",node:"ci",from:"ci",to:"registry",kind:"request"},
{title:"Publish image to registry",detail:"The signed image and its software bill of materials are published to the private registry.",command:"docker push registry.example.com/marketplace/catalog:$GIT_SHA",node:"registry",from:"ci",to:"registry",kind:"success"},
{title:"Promote release to Kubernetes",detail:"A GitOps change updates the desired image digest. Argo CD reconciles the service Deployment in the cluster.",command:"kubectl set image deployment/catalog catalog=registry.example.com/catalog@$DIGEST",node:"market",from:"registry",to:"market",kind:"request"},
{title:"Roll out domain services",detail:"Kubernetes gradually replaces replicas and waits for readiness. Catalog, Cart, Order and Payment scale independently.",command:"kubectl rollout status deployment/catalog",node:"services",from:"market",to:"services",kind:"success"},
{title:"Publish business events and persist data",detail:"Order and payment workflows publish durable events. Consumers update inventory, fulfillment and notifications; services persist transactional state and cache hot reads.",command:"kubectl get pods,svc && kafka-consumer-groups --describe",node:"events",from:"services",to:"events",kind:"request"},
{title:"Expose marketplace APIs",detail:"The API Gateway routes shopper traffic through the CDN/WAF to healthy service endpoints. Search and catalog reads use indexed and cached data.",command:"kubectl get ingress,gateway",node:"edge",from:"data",to:"edge",kind:"success"},
{title:"Shoppers use the marketplace",detail:"Web and mobile clients browse, add items to cart and submit orders. Payment authorization and order state changes are handled by separate services.",command:"curl -fsS https://shop.example.com/health",node:"users",from:"edge",to:"users",kind:"response"}
]}
,...cloudDeploymentScenarios
];

const caseStudies=[
{id:"retail",name:"Amazon-style Retail Platform",provider:"REFERENCE ARCHITECTURE",category:"E-COMMERCE",summary:"A high-scale retail platform with product discovery, cart, checkout, orders, inventory, recommendations and asynchronous fulfillment.",app:[
["shopper","Shoppers","Web and mobile","source","Customers browse, search, add products to carts and place orders.",["Web","Mobile","HTTPS"]],
["edge","CDN + WAF","Edge delivery","network","Caches static assets, terminates TLS and filters malicious traffic before requests enter the platform.",["CDN","WAF","TLS"]],
["gateway","API Gateway","Routing and auth","network","Routes client requests to domain services and enforces authentication, throttling and API policies.",["API Gateway","OAuth2","Rate limits"]],
["catalog","Catalog + Search","Product discovery","workload","Serves product details, categories, pricing and search results.",["Search","OpenSearch","Product API"]],
["cart","Cart + Checkout","Basket and checkout","workload","Maintains customer carts, validates prices and coordinates checkout.",["Cart API","Idempotency","Sessions"]],
["orders","Order Service","Order lifecycle","workload","Creates orders and coordinates order state transitions.",["Order API","Saga","Outbox"]],
["inventory","Inventory Service","Stock reservation","workload","Reserves stock and publishes inventory availability updates.",["Inventory","Reservations","Events"]],
["payments","Payment Service","Payment orchestration","workload","Coordinates payment authorization and status without storing raw card data.",["Payment gateway","Tokenization","PCI boundaries"]],
["events","Event Bus","Async fulfillment","pipeline","Distributes order and inventory events to fulfillment, notifications and analytics consumers.",["Kafka","Event consumers","DLQ"]],
["data","Data Platform","SQL · Cache · Search","database","Uses transactional databases, cache and search indexes for distinct access patterns.",["Relational DB","Redis","Search index"]]
],appLinks:[["shopper","edge"],["edge","gateway"],["gateway","catalog"],["gateway","cart"],["cart","orders"],["orders","payments"],["orders","inventory"],["orders","events"],["inventory","events"],["catalog","data"],["cart","data"],["orders","data"],["events","data"]]},
{id:"streaming",name:"Netflix-style Streaming Platform",provider:"REFERENCE ARCHITECTURE",category:"VIDEO STREAMING",summary:"A video streaming reference design covering playback APIs, entitlement, encoding, origin storage, CDN delivery, recommendations and telemetry.",app:[
["viewer","Viewers","TV · Web · Mobile","source","Viewers discover titles, request playback and stream adaptive-bitrate video.",["TV apps","Mobile","Web"]],
["edge","Global CDN","Edge delivery","network","Delivers video segments from edge caches close to viewers.",["CDN","Edge cache","TLS"]],
["gateway","Playback API","Session orchestration","network","Creates playback sessions and returns manifests and signed delivery URLs.",["API Gateway","Playback sessions","Token auth"]],
["catalog","Content Catalog","Titles and metadata","database","Stores title metadata, artwork, availability windows and regional licensing.",["Catalog API","Metadata","SQL"]],
["auth","Identity + Entitlement","Access decisions","workload","Checks identity, subscription status, profiles and content entitlements.",["OAuth2","Entitlements","Policy"]],
["origin","Video Origin","Encoded assets","registry","Stores manifests and encoded video segments for CDN origin fetches.",["Object storage","HLS","MPEG-DASH"]],
["encode","Encoding Pipeline","Transcode + package","pipeline","Transcodes source media into multiple codecs, resolutions and bitrates.",["Transcoding","Packaging","Queues"]],
["recommend","Recommendation Engine","Personalization","workload","Uses viewing history and ranking models to personalize title discovery.",["Feature store","Ranking","ML inference"]],
["events","Playback Telemetry","QoE events","pipeline","Collects playback starts, buffering, errors and completion events for analytics.",["Event streaming","Metrics","Analytics"]]
],appLinks:[["viewer","edge"],["edge","gateway"],["gateway","auth"],["gateway","catalog"],["gateway","origin"],["origin","edge"],["encode","origin"],["catalog","recommend"],["viewer","events"],["events","recommend"]]},
{id:"food-delivery",name:"Swiggy-style Food Delivery",provider:"REFERENCE ARCHITECTURE",category:"ON-DEMAND DELIVERY",summary:"A food delivery system connecting customer, restaurant, order, payment, dispatch, courier location and notifications.",app:[
["customer","Customers","Consumer app","source","Customers browse restaurants, place orders and track deliveries.",["Android","iOS","Web"]],
["edge","API Edge","WAF + routing","network","Authenticates mobile traffic, applies rate limits and routes API calls.",["API Gateway","WAF","JWT"]],
["restaurant","Restaurant Service","Menus and availability","workload","Maintains restaurant profiles, menus, opening hours and order acceptance.",["Restaurant API","Menu","Availability"]],
["orders","Order Service","Order state","workload","Coordinates order creation, confirmation, preparation and delivery state.",["Order API","Saga","State machine"]],
["dispatch","Dispatch Engine","Courier matching","workload","Matches orders with available delivery partners using proximity and capacity.",["Geo queries","Matching","Optimization"]],
["location","Location Service","Live tracking","workload","Ingests courier GPS updates and serves near-real-time tracking.",["Geospatial","WebSockets","Streams"]],
["payments","Payment Service","Payment status","workload","Coordinates payment authorization, refunds and reconciliation with payment providers.",["Payment gateway","Idempotency","Ledger refs"]],
["events","Event Bus","Order events","pipeline","Distributes order, restaurant and courier events to dispatch and notifications.",["Kafka","Pub/Sub","Retries"]],
["notify","Notifications","Push · SMS","workload","Sends order updates and delivery notifications through external providers.",["Push","SMS","Templates"]],
["data","Operational Stores","SQL · Geo · Cache","database","Persists orders and restaurant data while using geospatial indexes and cache for location and discovery.",["PostgreSQL","Redis","Geo index"]]
],appLinks:[["customer","edge"],["edge","restaurant"],["edge","orders"],["orders","payments"],["orders","events"],["restaurant","events"],["events","dispatch"],["dispatch","location"],["location","customer"],["events","notify"],["orders","data"],["location","data"]]},
{id:"banking",name:"Digital Banking Platform",provider:"REFERENCE ARCHITECTURE",category:"BANKING",summary:"A secure digital banking reference architecture with identity, API protection, account services, ledger, fraud controls, payments and audit.",app:[
["customer","Bank customers","Mobile · Web","source","Customers authenticate, view accounts, transfer funds and review statements.",["Mobile banking","Web","MFA"]],
["edge","WAF + API Gateway","Secure ingress","network","Applies DDoS protection, API authentication, quotas and request validation.",["WAF","API Gateway","mTLS"]],
["identity","Identity Service","Authentication","workload","Manages customer identity, MFA, sessions and authorization scopes.",["OIDC","MFA","RBAC"]],
["accounts","Account Service","Balances and accounts","workload","Serves account details and coordinates balance reads with ledger-backed data.",["Account API","CQRS","Read models"]],
["payments","Payment Orchestrator","Transfers","workload","Validates and coordinates internal and external transfers with idempotency and limits.",["Payment rails","Idempotency","Limits"]],
["ledger","Core Ledger","Double-entry journal","database","Records immutable balanced journal entries and authoritative transaction state.",["Double-entry","ACID","PostgreSQL"]],
["fraud","Risk + Fraud Engine","Risk decisions","workload","Evaluates transactions against velocity, device, behavioral and risk rules.",["Rules engine","Risk scoring","ML"]],
["events","Event Backbone","Audit + notifications","pipeline","Distributes transaction events to audit, statements, alerts and reconciliation consumers.",["Kafka","Schema registry","DLQ"]],
["audit","Audit + Compliance","Evidence trail","database","Stores tamper-evident audit records and compliance evidence.",["Append-only logs","Retention","SIEM"]]
],appLinks:[["customer","edge"],["edge","identity"],["edge","accounts"],["edge","payments"],["payments","fraud"],["payments","ledger"],["ledger","events"],["events","audit"],["events","accounts"]]},
{id:"upi",name:"UPI-style Real-time Payments",provider:"REFERENCE ARCHITECTURE",category:"PAYMENT NETWORK",summary:"A conceptual instant-payment flow with payer and payee apps, participant bank systems, routing, risk checks, transaction state, reconciliation and notifications.",app:[
["payer","Payer App","Payment request","source","The payer selects a payee, enters an amount and authorizes a payment.",["Mobile app","Device binding","PIN UX"]],
["gateway","Payment Gateway","Participant ingress","network","Validates participant requests, authenticates channels and routes transactions.",["API gateway","mTLS","Rate limits"]],
["switch","Payment Switch","Routing + orchestration","pipeline","Routes requests between participant institutions and coordinates transaction state.",["Message routing","Timeouts","Retries"]],
["risk","Risk Controls","Fraud + limits","workload","Applies transaction limits, velocity checks, device signals and risk decisions.",["Risk engine","Velocity","Rules"]],
["payerbank","Payer Bank","Debit authorization","workload","Validates the payer account and authorizes the debit through its core banking system.",["Core banking","Debit posting","Limits"]],
["payeeBank","Payee Bank","Credit posting","workload","Validates the beneficiary and posts the credit to the receiving account.",["Core banking","Credit posting","Status"]],
["ledger","Transaction Journal","State + references","database","Maintains transaction references, state transitions and idempotent processing records.",["Transaction journal","Idempotency","ACID"]],
["recon","Reconciliation","Settlement + disputes","workload","Reconciles participant outcomes, handles exceptions and supports dispute workflows.",["Reconciliation","Exceptions","Settlement"]],
["events","Notifications","Status updates","pipeline","Publishes transaction status for payer and payee notifications and audit.",["Event bus","Push","SMS"]],
["payee","Payee App","Payment confirmation","source","The payee receives confirmation after the participant flow reaches a final state.",["Mobile app","Notifications"]]
],appLinks:[["payer","gateway"],["gateway","switch"],["switch","risk"],["risk","payerbank"],["payerbank","switch"],["switch","payeeBank"],["payeeBank","ledger"],["payerbank","ledger"],["ledger","recon"],["ledger","events"],["events","payer"],["events","payee"]]},
{id:"saas",name:"Multi-tenant SaaS Platform",provider:"REFERENCE ARCHITECTURE",category:"SAAS PLATFORM",summary:"A multi-tenant SaaS design with tenant-aware identity, API routing, application services, metering, asynchronous jobs, isolated data access and observability.",app:[
["tenant","Tenant users","Browser · API clients","source","Users from multiple customer organizations access the same SaaS product.",["Web","API clients","SSO"]],
["edge","Edge + WAF","Global ingress","network","Terminates TLS, filters traffic and routes requests to the SaaS control plane.",["CDN","WAF","TLS"]],
["identity","Identity + Tenant","SSO · RBAC","workload","Resolves tenant identity, membership, roles and policy context for each request.",["OIDC","SAML","RBAC"]],
["gateway","API Gateway","Tenant-aware routing","network","Enforces quotas and routes tenant-scoped requests to application services.",["API Gateway","Rate limits","Tenant context"]],
["app","Product Services","Core SaaS features","workload","Runs independently deployable product domains with tenant-aware authorization.",["Microservices","REST / gRPC","Feature flags"]],
["jobs","Async Workers","Background jobs","pipeline","Processes scheduled tasks, imports, exports, webhooks and long-running jobs.",["Queues","Workers","Retries"]],
["metering","Usage + Billing","Metering events","workload","Aggregates tenant usage and produces billing and quota events.",["Usage events","Billing","Quotas"]],
["data","Tenant Data Layer","Isolation policies","database","Enforces tenant data isolation using database-per-tenant, schema or row-level controls as appropriate.",["PostgreSQL","RLS","Encryption"]],
["events","Event Backbone","Domain events","pipeline","Moves domain events between product services, workers, metering and integrations.",["Kafka / Pub/Sub","Outbox","DLQ"]],
["observability","Observability","Logs · Metrics · Traces","workload","Correlates tenant-scoped traces, service metrics, audit logs and SLOs.",["OpenTelemetry","Prometheus","Grafana"]]
],appLinks:[["tenant","edge"],["edge","identity"],["identity","gateway"],["gateway","app"],["app","data"],["app","events"],["events","jobs"],["jobs","data"],["events","metering"],["app","observability"],["jobs","observability"]]}
];
function caseNode(row:(string|string[])[],index:number):NodeDef{return {id:String(row[0]),name:String(row[1]),sub:String(row[2]),kind:String(row[3]) as NodeKind,pos:[-5+index*2,0,0],description:String(row[4]),tech:Array.isArray(row[5])?row[5]:String(row[5]).split("|")};}
for(const spec of caseStudies){
 const nodes:NodeDef[]=spec.app.map((row:(string|string[])[],i:number)=>caseNode(row,i));
 const links=spec.appLinks as [string,string][];
 const nodeById=(id:string)=>nodes.find(n=>n.id===id)!;
 const stages:Stage[]=links.map(([fromId,toId],i)=>{
  const from=nodeById(fromId),to=nodeById(toId);
  return {
   title:`Flow ${i+1}: ${from.name} → ${to.name}`,
   detail:`${from.description} This step passes the relevant request, event or data to ${to.name.toLowerCase()}.`,
   command:`trace --from "${from.name}" --to "${to.name}"`,
   node:to.id,from:from.id,to:to.id,kind:"request"
  };
 });
 scenarios.push({id:spec.id,name:spec.name,provider:spec.provider,category:spec.category,summary:spec.summary,nodes,links,stages,appNodes:nodes,appLinks:links});
}


type DeploymentSpec={id:string;name:string;provider:string;category:string;summary:string;nodes:(string|string[])[][];steps:[string,string,string,string,string,Stage["kind"]?][]};
function addDeployment(spec:DeploymentSpec){
 const nodes=spec.nodes.map((row,i)=>caseNode(row,i));
 const links=spec.steps.map(step=>[step[3],step[4]] as [string,string]);
 const stages:Stage[]=spec.steps.map(([title,detail,command,from,to,kind="request"])=>({title,detail,command,node:to,from,to,kind}));
 scenarios.push({id:spec.id,name:spec.name,provider:spec.provider,category:spec.category,summary:spec.summary,nodes,links,stages});
}
addDeployment({
 id:"ecs-fargate",name:"GitHub Actions → AWS ECS Fargate",provider:"AWS CLOUD",category:"CONTAINER PLATFORM",
 summary:"Build a container image, publish it to Amazon ECR and roll out a service on ECS Fargate without managing EC2 worker nodes.",
 nodes:[
 ["dev","Developer","Application commit","source","Pushes reviewed code and task definition changes to the repository.",["Git","Pull requests"]],
 ["repo","GitHub","Source repository","source","Stores application code, Dockerfile and ECS task definitions.",["GitHub","Workflow YAML"]],
 ["ci","GitHub Actions","Build + release","pipeline","Runs tests, builds an OCI image and assumes an AWS role using OIDC.",["GitHub Actions","OIDC","Docker"]],
 ["ecr","Amazon ECR","Container image","registry","Stores immutable image versions for the ECS service.",["ECR","Image digest","Lifecycle policy"]],
 ["ecs","Amazon ECS","Service scheduler","cluster","Maintains the desired task count and coordinates rolling deployments.",["ECS","Task definition","Service"]],
 ["fargate","Fargate Tasks","Serverless containers","workload","Runs application tasks without provisioning or patching EC2 instances.",["Fargate","CPU / memory","Health checks"]],
 ["alb","Application Load Balancer","HTTPS routing","network","Routes requests to healthy ECS task targets.",["ALB","Target groups","TLS"]],
 ["users","End users","Production traffic","source","Access the application through its public HTTPS endpoint.",["DNS","HTTPS"]]
 ],
 steps:[
 ["Commit application code","A reviewed commit updates the application and deployment definitions.","git push origin main","dev","repo"],
 ["Run CI validation","GitHub Actions checks out source and runs automated tests.","npm ci && npm test","repo","ci"],
 ["Build and publish image","The workflow builds a versioned image and pushes it to ECR.","docker build -t web:$GITHUB_SHA . && docker push $ECR/web:$GITHUB_SHA","ci","ecr"],
 ["Register task definition","The release updates the ECS task definition to reference the immutable image digest.","aws ecs register-task-definition --cli-input-json file://task-definition.json","ecr","ecs"],
 ["Roll out Fargate tasks","ECS replaces tasks according to the deployment configuration and waits for health checks.","aws ecs update-service --cluster prod --service web --force-new-deployment","ecs","fargate"],
 ["Route traffic to healthy tasks","The load balancer target group sends requests only to healthy tasks.","aws elbv2 describe-target-health --target-group-arn $TG","fargate","alb","success"],
 ["Verify production endpoint","A smoke test checks the public application health endpoint.","curl -fsS https://app.example.com/health","alb","users","response"]
 ]
});
addDeployment({
 id:"lambda-serverless",name:"AWS Lambda Serverless Deployment",provider:"AWS CLOUD",category:"SERVERLESS",
 summary:"Deploy an event-driven serverless application with API Gateway, Lambda functions, versioned releases and asynchronous messaging.",
 nodes:[
 ["dev","Developer","Function code","source","Commits function code, dependencies and infrastructure definitions.",["Git","Python / Node.js"]],
 ["repo","GitHub","Source repository","source","Stores Lambda source, tests and deployment templates.",["GitHub","Pull requests"]],
 ["ci","CI Pipeline","Test + package","pipeline","Runs tests, scans dependencies and packages the function artifact.",["GitHub Actions","Unit tests"]],
 ["artifact","Lambda Package","Versioned artifact","registry","Holds the packaged function code and dependency bundle.",["ZIP","Container image"]],
 ["lambda","AWS Lambda","Function runtime","workload","Runs functions on demand and scales concurrency based on incoming events.",["Lambda","IAM role","Concurrency"]],
 ["api","API Gateway","HTTP API","network","Authenticates and routes HTTP requests to Lambda integrations.",["Routes","Authorizers","Throttling"]],
 ["queue","Amazon SQS","Async events","pipeline","Buffers background work and supports retry and dead-letter handling.",["SQS","DLQ","Visibility timeout"]],
 ["users","API clients","HTTPS requests","source","Call the serverless API endpoint.",["HTTPS","JWT"]]
 ],
 steps:[
 ["Push function changes","The developer pushes a function update to the repository.","git push origin main","dev","repo"],
 ["Test and package","CI runs unit tests and packages the function with its runtime dependencies.","pytest && zip -r function.zip src/","repo","ci"],
 ["Publish function artifact","The packaged artifact is uploaded to the deployment artifact store.","aws s3 cp function.zip s3://deployment-artifacts/releases/","ci","artifact"],
 ["Update Lambda function","The deployment publishes the new function code and creates a versioned release.","aws lambda update-function-code --function-name orders --s3-bucket deployment-artifacts --s3-key releases/function.zip","artifact","lambda"],
 ["Connect API and event sources","API Gateway routes synchronous calls while SQS triggers asynchronous processing.","aws lambda update-alias --function-name orders --name prod --function-version 12","lambda","api","success"],
 ["Process queued work","Lambda consumes queued events with retry and dead-letter handling configured.","aws sqs get-queue-attributes --queue-url $QUEUE_URL","lambda","queue"],
 ["Verify serverless endpoint","A smoke test invokes the API and validates the response.","curl -fsS https://api.example.com/orders/health","api","users","response"]
 ]
});
addDeployment({
 id:"argocd-gitops",name:"Argo CD GitOps → Kubernetes",provider:"KUBERNETES",category:"GITOPS",
 summary:"Use Git as the desired-state source: CI builds and publishes an image, updates manifests, and Argo CD reconciles the Kubernetes cluster.",
 nodes:[
 ["dev","Developer","Code change","source","Creates an application change and opens a reviewed pull request.",["Git","Pull request"]],
 ["repo","Git repository","Application source","source","Stores source code, Helm charts or Kustomize manifests.",["Git","Helm / Kustomize"]],
 ["ci","CI Pipeline","Test + image build","pipeline","Tests the application, builds the image and publishes it to a registry.",["GitHub Actions","Docker"]],
 ["registry","Container Registry","Immutable image","registry","Stores the image referenced by the GitOps configuration.",["OCI","Image digest"]],
 ["config","GitOps repository","Desired cluster state","source","Contains environment-specific manifests and pinned image versions.",["Git","Helm values"]],
 ["argocd","Argo CD","Reconciliation controller","pipeline","Watches Git and compares the desired state with live Kubernetes resources.",["Argo CD","Sync","Health"]],
 ["k8s","Kubernetes cluster","Workload platform","cluster","Runs the reconciled Deployments, Services and Pods.",["Kubernetes","Deployments"]],
 ["users","Application users","Production traffic","source","Reach the application through the Kubernetes ingress or gateway.",["Ingress","HTTPS"]]
 ],
 steps:[
 ["Commit application change","The developer pushes code and opens a pull request for review.","git push origin feature/update","dev","repo"],
 ["Run tests and build image","CI validates the code and builds a container image.","docker build -t registry.example.com/web:$GIT_SHA .","repo","ci"],
 ["Publish immutable image","The CI pipeline pushes the image and records its digest.","docker push registry.example.com/web:$GIT_SHA","ci","registry"],
 ["Update desired state in Git","The deployment automation updates the environment manifest to the new image digest.","yq -i '.image.tag = env(GIT_SHA)' environments/prod/values.yaml","registry","config"],
 ["Argo CD detects Git change","Argo CD refreshes the application and identifies the desired-state difference.","argocd app diff web-prod","config","argocd"],
 ["Synchronize Kubernetes resources","Argo CD applies the desired manifests and waits for resource health.","argocd app sync web-prod","argocd","k8s","success"],
 ["Verify application health","The ingress endpoint and Argo CD application health are checked.","argocd app get web-prod && curl -fsS https://app.example.com/health","k8s","users","response"]
 ]
});
addDeployment({
 id:"terraform-aws",name:"Terraform → AWS Infrastructure",provider:"AWS CLOUD",category:"INFRASTRUCTURE AS CODE",
 summary:"Provision version-controlled AWS infrastructure through Terraform plan, review, apply and post-deployment validation.",
 nodes:[
 ["dev","Platform engineer","Infrastructure change","source","Edits Terraform modules and submits an infrastructure change for review.",["Terraform","HCL"]],
 ["repo","Git repository","Terraform code","source","Stores reusable modules, environment variables and backend configuration.",["Git","Modules"]],
 ["ci","CI Pipeline","Validate + plan","pipeline","Runs formatting, validation, security checks and creates a saved plan.",["GitHub Actions","terraform plan"]],
 ["review","Change approval","Plan review","pipeline","Reviewers inspect the proposed resource changes before apply.",["Pull request","Policy checks"]],
 ["state","Remote state","State backend","database","Stores Terraform state with locking and controlled access.",["S3 backend","Locking","Encryption"]],
 ["terraform","Terraform","IaC engine","pipeline","Calculates and applies the desired infrastructure graph using provider APIs.",["Providers","Dependency graph"]],
 ["aws","AWS resources","VPC · IAM · Compute","cluster","Represents provisioned networking, identity and compute resources.",["VPC","IAM","EC2 / EKS"]],
 ["ops","Platform team","Operational handoff","source","Receives outputs and validates infrastructure readiness.",["Outputs","Runbooks"]]
 ],
 steps:[
 ["Commit Terraform change","The engineer commits the infrastructure configuration to Git.","git push origin feature/network-update","dev","repo"],
 ["Format and validate","CI checks formatting and validates the Terraform configuration.","terraform fmt -check && terraform validate","repo","ci"],
 ["Generate execution plan","Terraform calculates proposed additions, changes and deletions without applying them.","terraform plan -out=tfplan","ci","terraform"],
 ["Review infrastructure plan","The team reviews the saved plan and policy results before approval.","terraform show tfplan","terraform","review"],
 ["Read and update remote state","Terraform uses the configured remote backend and state locking during operations.","terraform init -backend-config=backend.hcl","review","state"],
 ["Apply approved changes","The approved plan provisions or updates the selected AWS resources.","terraform apply tfplan","state","aws","success"],
 ["Validate infrastructure outputs","The platform team verifies resource outputs, connectivity and operational readiness.","terraform output && aws ec2 describe-vpcs","aws","ops","response"]
 ]
});
addDeployment({
 id:"azure-appservice",name:"GitHub Actions → Azure App Service",provider:"MICROSOFT AZURE",category:"PAAS WEB APP",
 summary:"Deploy a web application to Azure App Service using GitHub Actions, a build artifact, deployment slots and a controlled production swap.",
 nodes:[
 ["dev","Developer","Application commit","source","Pushes application changes and deployment configuration to GitHub.",["Git","Pull requests"]],
 ["repo","GitHub","Source repository","source","Stores application code, tests and workflow definitions.",["GitHub","Actions"]],
 ["ci","GitHub Actions","Build + test","pipeline","Runs tests, creates a deployable package and authenticates to Azure.",["OIDC","Build pipeline"]],
 ["artifact","Build artifact","ZIP package","registry","Stores the tested web application package.",["ZIP deploy","Versioning"]],
 ["app","Azure App Service","Web app runtime","workload","Runs the web application on a managed App Service plan.",["App Service","Managed runtime"]],
 ["slot","Staging slot","Pre-production","server","Hosts the candidate release for smoke tests before production swap.",["Deployment slots","Warm-up"]],
 ["monitor","Application Insights","Telemetry","database","Collects request traces, failures and performance telemetry.",["Application Insights","Availability tests"]],
 ["users","Customers","HTTPS traffic","source","Access the production web application.","HTTPS|Custom domain"]
 ],
 steps:[
 ["Push application changes","A reviewed code change is pushed to the source repository.","git push origin main","dev","repo"],
 ["Run CI tests","GitHub Actions checks out the commit and runs the application test suite.","npm ci && npm test","repo","ci"],
 ["Create release package","The workflow builds the application and creates a versioned deployment package.","npm run build && zip -r app.zip dist/","ci","artifact"],
 ["Deploy to staging slot","The package is deployed to the App Service staging slot, leaving production unchanged.","az webapp deploy --resource-group rg-app --name web-prod --slot staging --src-path app.zip","artifact","slot"],
 ["Warm up and smoke test","The staging slot is checked for startup, health and critical application behavior.","curl -fsS https://web-prod-staging.azurewebsites.net/health","slot","app","success"],
 ["Swap staging into production","After approval, the warmed staging slot is swapped with production.","az webapp deployment slot swap --resource-group rg-app --name web-prod --slot staging","app","users"],
 ["Inspect application telemetry","Application Insights is checked for availability, errors and response-time regressions.","az monitor app-insights query --app app-prod --analytics-query 'requests | take 10'","users","monitor","response"]
 ]
});

const marketplaceCase=scenarios.find(s=>s.id==="marketplace")!;
marketplaceCase.appNodes=[
caseNode(["shoppers","Shoppers","Web · Mobile","source","Customers browse products, manage carts and place orders.","Web|Mobile"],0),
caseNode(["edge","CDN + WAF","Edge protection","network","Caches assets and protects public endpoints before API traffic enters the platform.","CDN|WAF|TLS"],1),
caseNode(["gateway","API Gateway","Routing + identity","network","Authenticates clients and routes requests to domain services.","OAuth2|Rate limits"],2),
caseNode(["catalog","Catalog + Search","Product discovery","workload","Serves product listings, search, categories, pricing and recommendations.","Search API|OpenSearch"],3),
caseNode(["cart","Cart Service","Basket management","workload","Maintains carts and validates product availability and pricing.","Cart API|Redis"],4),
caseNode(["orders","Order Service","Order lifecycle","workload","Coordinates checkout, order state and fulfillment hand-off.","Order API|Saga"],5),
caseNode(["payments","Payment Service","Payment orchestration","workload","Coordinates payment authorization and status with external payment providers.","Payment API|Idempotency"],6),
caseNode(["events","Event Backbone","Kafka-style events","pipeline","Distributes order and inventory events to fulfillment, analytics and notifications.","Kafka|Consumers"],7),
caseNode(["data","Data Platform","SQL · Cache · Search","database","Persists orders and catalog data with fit-for-purpose databases, cache and search indexes.","PostgreSQL|Redis|Search"],8)
];
marketplaceCase.appLinks=[["shoppers","edge"],["edge","gateway"],["gateway","catalog"],["gateway","cart"],["cart","orders"],["orders","payments"],["orders","events"],["events","data"],["catalog","data"]];


addDeployment({
 id:"azure-devops-aks",name:"Azure DevOps → Azure AKS",provider:"MICROSOFT AZURE",category:"CI/CD · KUBERNETES",
 summary:"Use Azure Repos and Azure Pipelines to compile, test, scan, publish an image to ACR and deploy manifests to Azure Kubernetes Service.",
 nodes:[
 ["dev","Developer","Code change","source","Pushes reviewed application and pipeline changes to Azure Repos.",["Git","Pull requests"]],
 ["repo","Azure Repos","Source repository","source","Stores source code, YAML pipeline definitions and Kubernetes manifests.",["Azure Repos","Git"]],
 ["pipeline","Azure Pipelines","Build + release","pipeline","Runs multi-stage CI/CD with build agents, approvals and deployment environments.",["azure-pipelines.yml","Agents","Environments"]],
 ["sonar","SonarQube","Code quality gate","workload","Analyses code quality, bugs, vulnerabilities and coverage before artifact publication.",["Quality gate","Coverage","SAST"]],
 ["acr","Azure Container Registry","Image repository","registry","Stores the versioned OCI image consumed by AKS.",["ACR","Image tags","Digest"]],
 ["aks","Azure Kubernetes Service","Managed cluster","cluster","Runs Kubernetes workloads and reconciles the submitted manifests.",["AKS","Kubernetes","Namespaces"]],
 ["pods","Application Pods","Running replicas","workload","Run the application containers and report readiness to Kubernetes.",["Pods","Probes","ReplicaSets"]],
 ["users","Customers","HTTPS traffic","source","Reach the deployed application through its ingress or gateway.",["Ingress","TLS","HTTPS"]]
 ],
 steps:[
 ["Commit code to Azure Repos","The developer pushes a commit and opens a pull request for review.","git push origin feature/release","dev","repo"],
 ["Start Azure Pipeline","The YAML pipeline checks out the repository and selects a Microsoft-hosted or self-hosted agent.","az pipelines run --name demo-ci","repo","pipeline"],
 ["Build and run tests","The agent restores dependencies, compiles the application and runs unit tests.","mvn -B clean verify","pipeline","pipeline","success"],
 ["Run SonarQube quality gate","The pipeline submits analysis and waits for the configured quality gate result.","mvn sonar:sonar -Dsonar.projectKey=demo-app","pipeline","sonar"],
 ["Build and push image to ACR","The pipeline builds an image and pushes the version tagged with the commit ID.","docker build -t demo.azurecr.io/web:$BUILD_BUILDID . && docker push demo.azurecr.io/web:$BUILD_BUILDID","sonar","acr"],
 ["Deploy manifests to AKS","The release stage authenticates to the target environment and applies Kubernetes resources.","kubectl apply -f k8s/","acr","aks"],
 ["Verify rollout and endpoint","The pipeline waits for rollout completion and checks the application health endpoint.","kubectl rollout status deploy/web -n demo","aks","pods","success"],
 ["Validate production access","A smoke test confirms the ingress endpoint responds successfully.","curl -fsS https://demo.example.invalid/health","pods","users","response"]
 ]
});
addDeployment({
 id:"sonar-nexus-ec2",name:"Jenkins + SonarQube + Nexus → EC2",provider:"HYBRID / AWS",category:"CI/CD · CODE QUALITY · ARTIFACT REPOSITORY",
 summary:"A common enterprise pipeline: Jenkins builds and tests, SonarQube enforces code quality, Nexus stores versioned artifacts, then Ansible deploys to Linux EC2.",
 nodes:[
 ["dev","Developer","Code commit","source","Commits source code and build configuration to Git.",["Git","Pull requests"]],
 ["repo","Git Repository","Source control","source","Stores application code, Maven build file and Jenkinsfile.",["Git","Branches"]],
 ["jenkins","Jenkins","CI/CD orchestrator","pipeline","Coordinates checkout, Maven build, test, quality analysis, artifact upload and deployment.",["Jenkinsfile","Agents","Credentials"]],
 ["sonar","SonarQube","Quality gate","workload","Analyses source for maintainability, reliability, security issues and coverage.",["SonarScanner","Quality gate"]],
 ["nexus","Nexus Repository","Maven artifact store","registry","Stores immutable JAR/WAR artifacts and supports release versioning.",["Maven hosted","SNAPSHOT","Release"]],
 ["ansible","Ansible","Configuration + deploy","pipeline","Copies the approved artifact and configures the target Linux host.",["Inventory","Playbook","SSH"]],
 ["ec2","Amazon EC2","Linux application host","server","Runs the Java service under systemd behind a reverse proxy.",["EC2","Linux","systemd"]],
 ["users","Application users","HTTPS traffic","source","Access the deployed application through the public endpoint.",["DNS","HTTPS"]]
 ],
 steps:[
 ["Push code to Git","A developer pushes a reviewed change to the application repository.","git push origin main","dev","repo"],
 ["Jenkins checks out and builds","Jenkins checks out the commit and runs the Maven build and unit tests.","mvn -B clean verify","repo","jenkins"],
 ["SonarQube analysis","Jenkins submits source analysis and blocks promotion if the quality gate fails.","mvn sonar:sonar -Dsonar.projectKey=demo","jenkins","sonar"],
 ["Publish artifact to Nexus","The versioned JAR is uploaded to the Nexus Maven hosted repository.","mvn deploy -DaltDeploymentRepository=demo::default::https://nexus.example.invalid/repository/releases/","sonar","nexus"],
 ["Ansible deploys to EC2","Ansible downloads the approved artifact and copies it to the application directory.","ansible-playbook -i inventories/demo deploy.yml","nexus","ansible"],
 ["Restart and verify service","The EC2 service is restarted and its health endpoint is checked.","sudo systemctl restart demo-app && curl -fsS http://127.0.0.1:8080/health","ansible","ec2","success"],
 ["Verify production access","A final smoke test checks the application through its HTTPS endpoint.","curl -fsS https://app.example.invalid/health","ec2","users","response"]
 ]
});
addDeployment({
 id:"s3-cloudfront",name:"GitHub Actions → Amazon S3 + CloudFront",provider:"AWS CLOUD",category:"STATIC WEBSITE · CDN",
 summary:"Build a static web application, publish versioned assets to an S3 bucket, invalidate CloudFront cache and verify the public website.",
 nodes:[
 ["dev","Developer","Frontend commit","source","Commits frontend code and build configuration.",["Git","React / Vite"]],
 ["repo","GitHub","Source repository","source","Stores frontend source, tests and workflow YAML.",["GitHub","Actions"]],
 ["ci","GitHub Actions","Build + validate","pipeline","Installs dependencies, runs tests and creates optimized static assets.",["Node.js","npm","OIDC"]],
 ["artifact","Build output","dist/ assets","registry","Contains HTML, JavaScript, CSS, fonts and static media files.",["HTML","CSS","JS"]],
 ["s3","Amazon S3","Static asset bucket","database","Stores the published website files with controlled bucket access.",["S3","Versioning","Bucket policy"]],
 ["cdn","Amazon CloudFront","CDN distribution","network","Caches static assets at edge locations and serves HTTPS traffic.",["CloudFront","TLS","Cache policy"]],
 ["dns","Route 53","DNS record","network","Maps the website hostname to the CloudFront distribution.",["DNS","Alias record"]],
 ["users","Website visitors","HTTPS requests","source","Load the website through its custom domain.",["Browser","HTTPS"]]
 ],
 steps:[
 ["Commit frontend changes","A developer pushes the website change to the main branch.","git push origin main","dev","repo"],
 ["Install and test dependencies","CI installs locked dependencies and runs lint and unit tests.","npm ci && npm test","repo","ci"],
 ["Build static website","The frontend bundler generates optimized files in the dist directory.","npm run build","ci","artifact"],
 ["Sync files to S3","The pipeline uploads the static build and applies cache headers to the bucket.","aws s3 sync dist/ s3://demo-web-bucket --delete","artifact","s3"],
 ["Invalidate CloudFront cache","The release invalidates changed paths so visitors receive the latest entry point and assets.","aws cloudfront create-invalidation --distribution-id E123DEMO --paths '/*'","s3","cdn"],
 ["Verify DNS and HTTPS","The website hostname resolves to CloudFront and returns the expected response.","curl -I https://www.example.invalid","cdn","dns","success"],
 ["Confirm website delivery","A browser smoke test checks the deployed website and static assets.","curl -fsS https://www.example.invalid/","dns","users","response"]
 ]
});
addDeployment({
 id:"rds-flyway",name:"Flyway Database Migration → Amazon RDS",provider:"AWS CLOUD",category:"DATABASE · SCHEMA MIGRATION",
 summary:"Deploy database schema changes safely: validate migration scripts, review the migration plan, apply versioned Flyway migrations to Amazon RDS and verify schema health.",
 nodes:[
 ["dev","Developer","SQL migration","source","Creates an ordered, versioned SQL migration and application compatibility change.",["SQL","Git"]],
 ["repo","Git Repository","Migration source","source","Stores Flyway migration scripts and database configuration templates.",["V1__*.sql","flyway.conf"]],
 ["ci","CI Pipeline","Validate migrations","pipeline","Checks migration naming, SQL syntax and compatibility before release.",["Flyway","CI validation"]],
 ["review","DBA approval","Change review","pipeline","Reviews lock strategy, backup status, backward compatibility and deployment window.",["Change record","DBA review"]],
 ["flyway","Flyway","Migration runner","workload","Tracks applied migration versions and executes pending scripts in order.",["Schema history","Versioned SQL"]],
 ["rds","Amazon RDS","Managed database","database","Hosts the relational database in private subnets with backups and monitoring.",["PostgreSQL","Private subnet","Backups"]],
 ["app","Application service","Database client","workload","Connects using a least-privilege database role and validates application compatibility.",["JDBC","Connection pool"]],
 ["ops","Operations","DB health checks","source","Checks connectivity, migration history, errors and database performance.",["CloudWatch","SQL checks"]]
 ],
 steps:[
 ["Create versioned SQL migration","The developer adds an ordered migration file and tests it against a disposable database.","V12__add_customer_status.sql","dev","repo"],
 ["Validate migration scripts","CI checks naming, SQL syntax and migration ordering without touching production data.","flyway validate","repo","ci"],
 ["Review database change","The DBA reviews execution time, locks, rollback approach, backup and compatibility.","flyway info","ci","review"],
 ["Prepare migration runner","The deployment job receives the database endpoint and a scoped migration identity from a secret store.","flyway -configFiles=conf/flyway.conf info","review","flyway"],
 ["Apply schema migration","Flyway connects to the private RDS endpoint and applies pending versioned scripts.","flyway migrate","flyway","rds","success"],
 ["Deploy compatible application","The application release starts using the updated schema and verifies database connectivity.","./gradlew test && ./deploy-app.sh","rds","app"],
 ["Verify schema and service health","Operations checks Flyway schema history, database connectivity and application health.","flyway info && psql -c 'select now()'","app","ops","response"]
 ]
});
addDeployment({
 id:"postgres-ec2",name:"Ansible → PostgreSQL on Linux VM",provider:"ON-PREMISES / AWS",category:"DATABASE SERVER DEPLOYMENT",
 summary:"Provision a Linux database host, install PostgreSQL, apply secure configuration, create roles and schema, then validate backups and application connectivity.",
 nodes:[
 ["dev","DB engineer","DB change request","source","Defines the database version, storage, parameters, roles and migration scripts.",["SQL","Change review"]],
 ["repo","Git repository","DB automation","source","Stores Ansible playbooks, PostgreSQL configuration templates and SQL migrations.",["Git","YAML","SQL"]],
 ["ci","CI pipeline","Lint + validate","pipeline","Lints playbooks and validates SQL/configuration before the maintenance window.",["ansible-lint","SQL checks"]],
 ["ansible","Ansible","Host configuration","pipeline","Installs PostgreSQL packages, configures service settings and manages filesystem permissions.",["Inventory","Roles","Templates"]],
 ["vm","Linux database VM","Database host","server","Provides the operating system, attached data volume and firewall boundary.",["Linux","LVM","Firewall"]],
 ["postgres","PostgreSQL","Database engine","database","Runs the relational database and listens only on approved private interfaces.",["PostgreSQL","pg_hba.conf","WAL"]],
 ["backup","Backup storage","WAL + snapshots","registry","Stores encrypted logical backups and scheduled volume snapshots.",["pg_dump","WAL archive"]],
 ["app","Application service","DB connection","workload","Connects to the database using a dedicated least-privilege role.",["JDBC","Connection pool"]]
 ],
 steps:[
 ["Commit database automation","The DB engineer commits the host configuration and SQL migration files.","git push origin main","dev","repo"],
 ["Validate Ansible and SQL","CI checks playbook syntax, lint rules and migration scripts.","ansible-playbook --syntax-check site.yml && ansible-lint","repo","ci"],
 ["Configure Linux database host","Ansible installs PostgreSQL packages, mounts the data volume and configures the service.","ansible-playbook -i inventory site.yml","ci","ansible"],
 ["Install and configure PostgreSQL","The playbook renders postgresql.conf and pg_hba.conf, then enables the database service.","sudo systemctl enable --now postgresql","ansible","vm"],
 ["Create database and roles","A controlled SQL migration creates the application database, schema and least-privilege role.","psql -f sql/bootstrap.sql","vm","postgres","success"],
 ["Configure backup and recovery","A scheduled job creates a logical backup and validates that the artifact is readable.","pg_dump -Fc demo_db > demo_db.dump","postgres","backup"],
 ["Verify application connectivity","The application checks a read-only query and connection-pool health.","psql -h db.internal.example.invalid -U app_user -d demo_db -c 'select 1'","postgres","app","response"]
 ]
});


addDeployment({
 id:"maven-jfrog-vault",name:"Jenkins + Maven → JFrog Artifactory + Vault",provider:"ENTERPRISE DEVOPS",category:"JAVA CI/CD · ARTIFACTS · SECRETS",
 summary:"Build a Java application with Maven, enforce a SonarQube quality gate, publish versioned artifacts to JFrog Artifactory, retrieve secrets from Vault and deploy to Linux.",
 nodes:[
 ["dev","Developer","Java code change","source","Commits application code, Maven build files and pipeline definitions.",["Java","Git","Maven"]],
 ["repo","Git repository","Source control","source","Stores source, pom.xml, tests and Jenkinsfile.",["Git","pom.xml"]],
 ["jenkins","Jenkins","Pipeline orchestrator","pipeline","Runs Maven lifecycle, quality analysis, artifact publication and deployment stages.",["Jenkinsfile","Agents","Credentials"]],
 ["sonar","SonarQube","Code quality gate","workload","Analyses source code, test coverage, bugs and vulnerabilities before release promotion.",["SonarScanner","Quality gate"]],
 ["jfrog","JFrog Artifactory","Maven repository","registry","Stores immutable Maven release artifacts and build metadata.",["Maven repository","Build info","Promotion"]],
 ["vault","HashiCorp Vault","Secrets service","database","Issues short-lived or scoped secrets to the pipeline and deployment process.",["KV","Dynamic secrets","Policies"]],
 ["server","Linux application host","Java runtime","server","Runs the approved JAR as a systemd service with controlled file permissions.",["Linux","JRE","systemd"]],
 ["users","Application users","HTTPS traffic","source","Access the released application through its endpoint.",["DNS","HTTPS"]]
 ],
 steps:[
 ["Commit Java application code","The developer pushes source, tests and Maven configuration to Git.","git push origin main","dev","repo"],
 ["Run Maven build and tests","Jenkins checks out source and runs the Maven validate, compile, test and package lifecycle.","mvn -B clean verify","repo","jenkins"],
 ["Run SonarQube quality gate","The pipeline submits source analysis and waits for the quality gate before continuing.","mvn sonar:sonar -Dsonar.projectKey=demo-java","jenkins","sonar"],
 ["Publish release to Artifactory","Maven deploy publishes the versioned JAR and POM to the configured Artifactory repository.","mvn -B deploy -DaltDeploymentRepository=demo::default::https://artifactory.example.invalid/artifactory/libs-release-local","sonar","jfrog"],
 ["Retrieve deployment secrets from Vault","The deploy stage authenticates using a short-lived identity and reads only the required deployment secret path.","vault kv get -mount=kv apps/demo/deploy","jfrog","vault"],
 ["Deploy approved artifact to Linux","The deployment retrieves the exact artifact version and restarts the application service.","ansible-playbook -i inventory deploy.yml","vault","server","success"],
 ["Verify application health","A smoke test checks the application endpoint and confirms the deployed release version.","curl -fsS http://192.0.2.70:8080/health","server","users","response"]
 ]
});
addDeployment({
 id:"gradle-helm-argocd",name:"Gradle + Helm + Argo CD → Kubernetes",provider:"KUBERNETES",category:"GRADLE · HELM · GITOPS",
 summary:"Build and test a JVM application with Gradle, publish its container image, package Kubernetes resources with Helm and let Argo CD continuously reconcile the cluster from Git.",
 nodes:[
 ["dev","Developer","Application commit","source","Commits Java/Kotlin code, Gradle wrapper and chart changes.",["Git","Gradle","Kotlin / Java"]],
 ["repo","GitHub","Application repository","source","Stores source code, Gradle build files and Dockerfile.",["GitHub","build.gradle"]],
 ["gradle","Gradle CI","Build + test","pipeline","Uses the Gradle Wrapper to compile, test, scan and package the application.",["gradlew","Build cache","JUnit"]],
 ["registry","Container Registry","OCI image","registry","Stores immutable image tags and digests created by CI.",["Docker / OCI","Image digest"]],
 ["charts","Helm chart","Release package","registry","Defines Kubernetes templates, values and versioned chart metadata.",["Chart.yaml","values.yaml","Templates"]],
 ["gitops","GitOps repository","Environment desired state","source","Stores environment-specific Helm values and pinned chart/image versions.",["Git","Helm values"]],
 ["argocd","Argo CD","GitOps controller","pipeline","Watches Git, renders Helm charts and reconciles desired resources with the cluster.",["Application","Sync","Health"]],
 ["cluster","Kubernetes cluster","Workload runtime","cluster","Runs the Helm-rendered Deployments, Services and Pods.",["Kubernetes","Rollouts","Namespaces"]],
 ["users","Application users","HTTPS traffic","source","Reach the application through ingress or gateway after healthy rollout.",["Ingress","TLS"]]
 ],
 steps:[
 ["Commit application and chart changes","The developer pushes application code and chart updates to Git.","git push origin main","dev","repo"],
 ["Run Gradle build and tests","CI uses the checked-in Gradle Wrapper to compile, test and create the application artifact.","./gradlew clean test build","repo","gradle"],
 ["Build and publish container image","The pipeline packages the JAR into an image and pushes it using a commit-based tag.","docker build -t registry.example.invalid/demo/web:$GIT_SHA . && docker push registry.example.invalid/demo/web:$GIT_SHA","gradle","registry"],
 ["Validate Helm chart","The chart is linted and rendered with the target environment values before promotion.","helm lint ./charts/demo && helm template demo ./charts/demo -f values-prod.yaml","registry","charts"],
 ["Update GitOps desired state","The release updates the image digest or chart version in the environment repository.","yq -i '.image.tag = env(GIT_SHA)' environments/prod/values.yaml","charts","gitops"],
 ["Argo CD synchronizes Kubernetes","Argo CD detects the Git change, renders the Helm chart and reconciles the target cluster.","argocd app sync demo-prod","gitops","argocd","success"],
 ["Verify rollout and service","The release checks Argo CD health, Kubernetes rollout and application endpoint.","argocd app wait demo-prod --health && kubectl rollout status deploy/demo -n prod","argocd","cluster"],
 ["Confirm production traffic","A smoke test verifies the public endpoint after all workload checks pass.","curl -fsS https://demo.example.invalid/health","cluster","users","response"]
 ]
});
addDeployment({
 id:"observability-prom-grafana-datadog",name:"Prometheus + Grafana + Datadog Observability",provider:"CLOUD / KUBERNETES",category:"MONITORING · LOGS · TRACES",
 summary:"Instrument a deployed application, collect metrics with Prometheus, build Grafana dashboards and route logs, traces and infrastructure telemetry to Datadog for alerting and incident response.",
 nodes:[
 ["app","Application service","Instrumented workload","workload","Exposes health and Prometheus metrics and emits structured logs and traces.",["OpenTelemetry","/metrics","Health endpoint"]],
 ["otel","OpenTelemetry Collector","Telemetry pipeline","pipeline","Receives, processes and exports application telemetry using configured pipelines.",["OTLP","Processors","Exporters"]],
 ["prom","Prometheus","Metrics collection","database","Scrapes configured targets, stores time-series metrics and evaluates alert rules.",["PromQL","Service discovery","Rules"]],
 ["grafana","Grafana","Dashboards + alerts","workload","Queries Prometheus metrics and presents dashboards, alert panels and service health.",["PromQL","Dashboards","Alerting"]],
 ["datadog","Datadog Agent","Infra + APM telemetry","workload","Collects host/container metrics, logs and traces and forwards them to the Datadog platform.",["Agent","APM","Logs"]],
 ["alerts","Alert routing","Incident notifications","network","Routes actionable alerts to the on-call channel based on severity and ownership.",["Alertmanager","Monitors","On-call"]],
 ["ops","SRE / Platform team","Incident response","source","Uses dashboards, traces and logs to diagnose issues and validate recovery.",["SLOs","Runbooks","Postmortems"]],
 ["users","End users","Service requests","source","Generate real application traffic that produces telemetry signals.",["HTTP","User experience"]]
 ],
 steps:[
 ["Generate application telemetry","The application serves requests and emits metrics, logs and traces with service and environment labels.","curl -fsS http://demo.internal.example.invalid/actuator/prometheus","users","app"],
 ["Collect and process telemetry","The OpenTelemetry Collector receives OTLP data, applies processors and exports selected signals.","otelcol --config=/etc/otelcol/config.yaml","app","otel"],
 ["Scrape metrics with Prometheus","Prometheus discovers the application target and scrapes its metrics endpoint on the configured interval.","promtool check config /etc/prometheus/prometheus.yml","otel","prom"],
 ["Build Grafana dashboards","Grafana queries Prometheus for request rate, error rate, latency, saturation and availability panels.","curl -fsS http://grafana.example.invalid/api/health","prom","grafana"],
 ["Forward logs and traces to Datadog","The Datadog Agent receives configured host/container logs and APM traces for correlation.","datadog-agent status","otel","datadog"],
 ["Evaluate alerts and notify on-call","Prometheus alert rules and Datadog monitors evaluate thresholds and route incidents to responders.","amtool alert query --alertmanager.url=http://alertmanager:9093","grafana","alerts","success"],
 ["Investigate and validate recovery","The SRE team correlates dashboard metrics, logs and traces, then confirms service health after remediation.","curl -fsS http://demo.internal.example.invalid/health","alerts","ops","response"]
 ]
});


// Keep one canonical flow per ID. Several flows have an early generic definition and a later detailed version;
 // duplicate React keys caused stale AWS rows to remain visible after switching provider filters.
 const canonicalFlows=new Map<string,Scenario>();
 scenarios.forEach(flow=>canonicalFlows.set(flow.id,flow));
 scenarios.splice(0,scenarios.length,...canonicalFlows.values());

 const palette:Record<NodeKind,string>={source:"#b9d8a8",pipeline:"#efbd79",registry:"#c8b5d9",cluster:"#9eb9d4",workload:"#a8c7e4",network:"#b9d8a8",server:"#d9bd91",database:"#c8b5d9"};
const nodeXY=(node:NodeDef,nodes:NodeDef[],tierMode:2|3=3,flowMode=false):[number,number]=>{
  if(flowMode){const index=Math.max(0,nodes.findIndex(n=>n.id===node.id));return [125+index*220,140];}
  const tierFor=(n:NodeDef)=>{if(n.kind==="source"||n.kind==="network")return 1;if(n.kind==="database")return tierMode===3?3:2;return 2;};
  const tier=tierFor(node);const sameTier=nodes.filter(n=>tierFor(n)===tier);const inTier=Math.max(0,sameTier.findIndex(n=>n.id===node.id));
  const column=inTier%3;const row=Math.floor(inTier/3);const x=100+column*220;
  const y=tierMode===2?(tier===1?132+row*74:400+row*74):(tier===1?92+row*74:tier===2?277+row*74:462+row*62);
  return [x,y];
 };
 
function wrapNodeLabel(value:string,maxChars:number,maxLines=2):string[]{
 const words=value.trim().split(/\s+/).flatMap(word=>{const parts:string[]=[];for(let i=0;i<word.length;i+=maxChars)parts.push(word.slice(i,i+maxChars));return parts;});
 const lines:string[]=[];let line="";
 for(const word of words){const next=line?line+" "+word:word;if(next.length>maxChars&&line){lines.push(line);line=word;}else line=next;}
 if(line)lines.push(line);
 if(lines.length>maxLines){const kept=lines.slice(0,maxLines);kept[maxLines-1]=kept[maxLines-1].replace(/[.,;:]?$/,"")+"…";return kept;}
 return lines;
}
function Scene({scenario,stageIndex,selected,playing,onSelect,tierMode=3,flowMode=false}:{scenario:Scenario;stageIndex:number;selected:string;playing:boolean;onSelect:(id:string)=>void;tierMode?:2|3;flowMode?:boolean}){
 const activeStage=scenario.stages[stageIndex];
 const doneStages=stageIndex<0?[]:scenario.stages.slice(0,stageIndex);
 const nodes=scenario.nodes;
 const sceneWidth=flowMode?250+Math.max(nodes.length-1,0)*220:1400;
  const cardWidth=174;
 const nodeById=(id:string)=>nodes.find(n=>n.id===id)!;
 const route=(from:NodeDef,to:NodeDef)=>{
  const [x1,y1]=nodeXY(from,nodes,tierMode,flowMode),[x2,y2]=nodeXY(to,nodes,tierMode,flowMode);
  if(from.id===to.id)return `M ${x1+48} ${y1-24} C ${x1+112} ${y1-78}, ${x1+112} ${y1+78}, ${x1+48} ${y1+24}`;
  const dx=x2-x1,dy=y2-y1;
  if(Math.abs(dx)<165){
   const direction=dy>=0?1:-1;
   const startY=y1+direction*33,endY=y2-direction*33,midY=(startY+endY)/2;
   return `M ${x1} ${startY} V ${midY} H ${x2} V ${endY}`;
  }
  const direction=dx>=0?1:-1;
  const halfCard=flowMode?87:87;
   const startX=x1+direction*halfCard,endX=x2-direction*halfCard;
  const midX=(startX+endX)/2;
  return `M ${startX} ${y1} H ${midX} V ${y2} H ${endX}`;
 };
 return <div className={flowMode?"architecture-2d flow-map":"architecture-2d"}>
  <svg viewBox={`0 0 ${sceneWidth} ${flowMode?280:600}`} style={flowMode?{width:`${sceneWidth}px`,minWidth:`${sceneWidth}px`,maxWidth:"none"}:undefined} preserveAspectRatio="xMidYMid meet" role="img" aria-label={scenario.name+" deployment architecture"}>
   <defs>
    <pattern id="map-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="#e5ecf6" strokeWidth="1"/></pattern>
    <marker id="route-arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" markerUnits="userSpaceOnUse" orient="auto"><path d="M0,0 L12,6 L0,12 z" fill="#7188aa"/></marker>
    <filter id="card-shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#554a38" floodOpacity=".12"/></filter>
   </defs>
   <rect width={sceneWidth} height={flowMode?280:600} fill="#f8faff"/><rect width={sceneWidth} height={flowMode?280:600} fill="url(#map-grid)"/>
   {flowMode?<g><rect x="14" y="12" width={sceneWidth-28} height="256" rx="14" fill="#edf3fc" opacity=".32" stroke="#d4dadd"/></g>:tierMode===2?<><rect x="14" y="92" width="1372" height="190" rx="14" fill="#eaf2ff" opacity=".65" stroke="#c8d9f0"/><rect x="14" y="315" width="1372" height="265" rx="14" fill="#edf3fc" opacity=".72" stroke="#d0def0"/><text x="34" y="120" fontSize="13" fontWeight="700" fill="#356daF">TIER 1 · PRESENTATION / CLIENT</text><text x="34" y="343" fontSize="13" fontWeight="700" fill="#496b9c">TIER 2 · APPLICATION + DATA</text></>:<><rect x="14" y="20" width="1372" height="165" rx="14" fill="#eaf2ff" opacity=".65" stroke="#c8d9f0"/><rect x="14" y="205" width="1372" height="165" rx="14" fill="#edf3fc" opacity=".72" stroke="#d0def0"/><rect x="14" y="390" width="1372" height="190" rx="14" fill="#fff4e6" opacity=".72" stroke="#f0dfc7"/><text x="34" y="47" fontSize="13" fontWeight="700" fill="#356daF">TIER 1 · PRESENTATION</text><text x="34" y="232" fontSize="13" fontWeight="700" fill="#496b9c">TIER 2 · APPLICATION / SERVICES</text><text x="34" y="417" fontSize="13" fontWeight="700" fill="#a77b38">TIER 3 · DATA</text></>}
   {scenario.links.map(([a,b],i)=>{const from=nodeById(a),to=nodeById(b),d=route(from,to);const active=activeStage?.from===a&&activeStage?.to===b;const done=doneStages.some(s=>s.from===a&&s.to===b);return <g key={i}><path d={d} fill="none" stroke={active?"#ff8a65":done?"#39b58b":"#9aacc4"} strokeWidth={active?3:2} strokeLinecap="round" markerEnd="url(#route-arrow)"/>{active&&playing&&<circle r="6" fill="#e68f36" stroke="#fff" strokeWidth="2"><animateMotion path={d} dur="2.2s" repeatCount="indefinite"/></circle>}</g>})}
   {nodes.map(n=>{const [x,y]=nodeXY(n,nodes,tierMode,flowMode);const active=n.id===activeStage?.node;const done=doneStages.some(s=>s.node===n.id);const icon=iconForNode(n);const labelX=60;const titleLines=wrapNodeLabel(n.name,19,2);const subLines=wrapNodeLabel(n.sub,22,2);return <g key={n.id} transform={`translate(${x-cardWidth/2} ${y-35})`} onClick={()=>onSelect(n.id)} role="button" tabIndex={0} aria-label={"Select "+n.name} style={{cursor:"pointer"}} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();onSelect(n.id);}}}>
    <rect x="0" y="0" width={cardWidth} height="70" rx="11" fill={selected===n.id?"#eaf2ff":"#ffffff"} stroke={active?"#ff9b62":selected===n.id?"#78a8e6":"#dce5f2"} strokeWidth={active?3:selected===n.id?2:1.3} filter="url(#card-shadow)"/>
    <rect x="8" y="12" width={Math.min(44,cardWidth*.28)} height="46" rx="9" fill={palette[n.kind]} opacity=".38"/>
    {<text x={8+Math.min(44,cardWidth*.28)/2} y="41" textAnchor="middle" fontSize="21" fontWeight="700" fill="#294b78" opacity={icon?0:1}>{n.name.slice(0,1)}</text>}{icon&&<image href={icon} x="12" y="19" width={Math.min(32,cardWidth*.22)} height="32" preserveAspectRatio="xMidYMid meet" onError={e=>{e.currentTarget.style.display="none";const fallback=e.currentTarget.previousElementSibling as SVGTextElement|null;if(fallback)fallback.style.opacity="1";}}/>}
    <text x={labelX} y={titleLines.length>1?21:29} fontSize="8.5" fontWeight="700" fill="#17294b">{titleLines.map((line,i)=><tspan key={i} x={labelX} dy={i===0?0:10}>{line}</tspan>)}</text>
    <text x={labelX} y={titleLines.length>1?48:44} fontSize="7.1" fill="#71829e">{subLines.map((line,i)=><tspan key={i} x={labelX} dy={i===0?0:9}>{line}</tspan>)}</text>
    {(active||done)&&<circle cx="162" cy="10" r="4.5" fill={active?"#e59a43":"#6fa576"}/>}
   </g>})}
   {activeStage&&(()=>{const from=nodeById(activeStage.from),to=nodeById(activeStage.to),d=route(from,to);return <g><path d={d} fill="none" stroke="#ff8a65" strokeWidth="5" strokeOpacity=".18" strokeLinecap="round"/>{playing&&<circle r="8" fill="#e58c35" stroke="#fff" strokeWidth="2"><animateMotion path={d} dur="2.2s" repeatCount="indefinite"/></circle>}</g>})()}
  </svg>
 </div>
}
export default function App(){
 const [workspace,setWorkspace]=useState<"architectures"|"kubernetes"|"troubleshoot"|"terminal"|"monitoring"|"strategies"|"iac"|"learning">("architectures");
 const [scenarioId,setScenarioId]=useState("eks");const scenario=scenarios.find(s=>s.id===scenarioId)!;
 const [architectureView,setArchitectureView]=useState<"application"|"deployment">("deployment");const [tierMode,setTierMode]=useState<2|3>(3);
 const [stageIndex,setStageIndex]=useState(-1);const [playing,setPlaying]=useState(false);const [selected,setSelected]=useState("git");const [tab,setTab]=useState<"overview"|"steps"|"commands"|"files">("overview");const [speed,setSpeed]=useState(1);const [dark,setDark]=useState(false);const [query,setQuery]=useState("");const [libraryCategory,setLibraryCategory]=useState("all");const [leftCollapsed,setLeftCollapsed]=useState(false);const [rightCollapsed,setRightCollapsed]=useState(false);
 const baseSceneScenario=architectureView==="application"&&scenario.appNodes?{...scenario,nodes:scenario.appNodes,links:scenario.appLinks||[]}:scenario;
 const sceneScenario=baseSceneScenario;
 const stage=architectureView==="deployment"?scenario.stages[stageIndex]:undefined;const node=sceneScenario.nodes.find(n=>n.id===selected)||sceneScenario.nodes[0];const hasApplicationView=!!scenario.appNodes;
 useEffect(()=>{if(stage)setSelected(stage.node);},[stage?.node]);
 useEffect(()=>{if(!playing)return;const timer=window.setTimeout(()=>{if(stageIndex+1>=scenario.stages.length){setPlaying(false);return;}setStageIndex(stageIndex+1);},2600/speed);return()=>window.clearTimeout(timer);},[playing,stageIndex,scenario,speed]);
 useEffect(()=>{setArchitectureView("deployment");setTierMode(3);setStageIndex(-1);setPlaying(false);setSelected(scenario.nodes[0].id);setTab("overview");setWorkspace("architectures");},[scenarioId]);
 useEffect(()=>{setPlaying(false);setStageIndex(-1);setSelected(sceneScenario.nodes[0].id);if(architectureView==="application"){setTab("overview");}},[architectureView]);
 const hasKubernetes=scenario.category.toLowerCase().includes("kubernetes")||scenario.nodes.some(n=>n.kind==="cluster"||/kubernetes|eks|aks|gke|k8s/i.test(n.name+" "+n.sub));
 const hasTerraform=scenario.category.toLowerCase().includes("infrastructure")||/terraform|cloudformation|bicep/i.test(scenario.name+" "+scenario.category);
 const hasMonitoring=scenario.nodes.some(n=>/observability|prometheus|grafana|datadog|monitoring/i.test(n.name+" "+n.sub+" "+n.tech.join(" ")));
 const workspaceTabs=[["architectures","Architectures"],...(hasKubernetes?[["kubernetes","Kubernetes"]]:[]),["troubleshoot","Troubleshoot"],["terminal","Terminal"],...(hasMonitoring?[["monitoring","Monitoring"]]:[]),["strategies","Strategies"],...(hasTerraform?[["iac","Terraform"]]:[]),["learning","Learn"]] as [string,string][];
 const progress=architectureView==="application"?0:stageIndex<0?0:Math.round((stageIndex+1)/scenario.stages.length*100);
 const reset=()=>{setPlaying(false);setStageIndex(-1);};
 const next=()=>{setPlaying(false);setStageIndex(i=>Math.min(i+1,scenario.stages.length-1));};
 return <div className={(dark?"app dark":"app")+(tab==="files"?" files-expanded":"")+(leftCollapsed?" left-collapsed":"")+(rightCollapsed?" right-collapsed":"")}>
  <header className="topbar"><div className="brand"><div className="brand-icon"><Layers size={22}/></div><div><strong>DEPLOY<span>LAB</span></strong><small>VISUALIZE HOW SOFTWARE SHIPS</small></div></div><div className="topbar-spacer"><span>DEPLOYMENT LEARNING ENVIRONMENT</span></div><div className="topbar-creator-actions"><a className="coffee-support" href="https://www.buymeacoffee.com/gpavankumar27" target="_blank" rel="noopener noreferrer" aria-label="Support DeployLab on Buy Me a Coffee"><span aria-hidden="true">☕</span><b>Buy Me a Coffee</b></a><span className="creator-credit"><span aria-hidden="true">&lt;/&gt;</span> Designed by <strong>G Pavan Kumar</strong></span></div><div className="top-actions"><label className="header-search"><Search size={16}/><input aria-label="Search deployment architectures" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search architectures..."/></label><button className="icon-btn" aria-label={dark?"Switch to light theme":"Switch to dark theme"} onClick={()=>setDark(!dark)}>{dark?<Sun size={17}/>:<Moon size={17}/>}</button></div></header>
  <aside className="left-panel"><button className="panel-collapse left-collapse" type="button" title={leftCollapsed?"Show deployment library":"Hide deployment library"} aria-label={leftCollapsed?"Show deployment library":"Hide deployment library"} onClick={()=>setLeftCollapsed(v=>!v)}>{leftCollapsed?"›":"‹"}</button>{!leftCollapsed&&<><div className="panel-title"><div><small>DEPLOYMENT LIBRARY</small><h2>Explore flows</h2></div></div><div className="group-label">FLOW CATEGORIES</div><div className="library-filters">{[{id:"all",label:"All flows"},{id:"aws",label:"AWS"},{id:"azure",label:"Azure"},{id:"gcp",label:"GCP"},{id:"apps",label:"Application architectures"},{id:"other",label:"Other deployments"}].map(item=><button key={item.id} className={libraryCategory===item.id?"library-filter active":"library-filter"} onClick={()=>setLibraryCategory(item.id)}>{item.label}<span>{scenarios.filter(s=>(item.id==="all"||(item.id==="aws"&&s.provider==="AWS CLOUD")||(item.id==="azure"&&s.provider==="MICROSOFT AZURE")||(item.id==="gcp"&&s.provider==="GOOGLE CLOUD")||(item.id==="apps"&&(s.provider==="REFERENCE ARCHITECTURE"||s.provider==="REAL-WORLD PATTERN"))||(item.id==="other"&&s.provider!=="AWS CLOUD"&&s.provider!=="MICROSOFT AZURE"&&s.provider!=="GOOGLE CLOUD"&&s.provider!=="REFERENCE ARCHITECTURE"&&s.provider!=="REAL-WORLD PATTERN"))).length}</span></button>)}</div><div className="group-label">AVAILABLE FLOWS</div>{scenarios.filter(s=>(libraryCategory==="all"||(libraryCategory==="aws"&&s.provider==="AWS CLOUD")||(libraryCategory==="azure"&&s.provider==="MICROSOFT AZURE")||(libraryCategory==="gcp"&&s.provider==="GOOGLE CLOUD")||(libraryCategory==="apps"&&(s.provider==="REFERENCE ARCHITECTURE"||s.provider==="REAL-WORLD PATTERN"))||(libraryCategory==="other"&&s.provider!=="AWS CLOUD"&&s.provider!=="MICROSOFT AZURE"&&s.provider!=="GOOGLE CLOUD"&&s.provider!=="REFERENCE ARCHITECTURE"&&s.provider!=="REAL-WORLD PATTERN"))&&(s.name.toLowerCase().includes(query.toLowerCase())||s.category.toLowerCase().includes(query.toLowerCase())||s.summary.toLowerCase().includes(query.toLowerCase()))).map(s=><button key={s.id} className={scenarioId===s.id?"scenario active":"scenario"} onClick={()=>setScenarioId(s.id)}><span className={"scenario-icon "+(s.provider==="MICROSOFT AZURE"?"azure":s.provider==="GOOGLE CLOUD"?"gcp":s.provider==="AWS CLOUD"?"aws":"docker")}>{s.provider==="MICROSOFT AZURE"?<Cloud size={17}/>:s.provider==="GOOGLE CLOUD"?<Cloud size={17}/>:s.provider==="AWS CLOUD"?<Cloud size={17}/>:<Layers size={17}/>}</span><span><b>{s.name}</b><small>{s.provider} · {s.category}</small></span></button>)}{scenarios.filter(s=>(libraryCategory==="all"||(libraryCategory==="aws"&&s.provider==="AWS CLOUD")||(libraryCategory==="azure"&&s.provider==="MICROSOFT AZURE")||(libraryCategory==="gcp"&&s.provider==="GOOGLE CLOUD")||(libraryCategory==="apps"&&(s.provider==="REFERENCE ARCHITECTURE"||s.provider==="REAL-WORLD PATTERN"))||(libraryCategory==="other"&&s.provider!=="AWS CLOUD"&&s.provider!=="MICROSOFT AZURE"&&s.provider!=="GOOGLE CLOUD"&&s.provider!=="REFERENCE ARCHITECTURE"&&s.provider!=="REAL-WORLD PATTERN"))&&(s.name.toLowerCase().includes(query.toLowerCase())||s.category.toLowerCase().includes(query.toLowerCase())||s.summary.toLowerCase().includes(query.toLowerCase()))).length===0&&<p className="no-results">No flows match this category and search.</p>}<div className="sidebar-foot"><ShieldCheck size={15}/><span>Simulation only · No cloud access</span></div></>}</aside>
  <main className="main"><nav className="workspace-nav" aria-label="DeployLab workspaces">{workspaceTabs.map(([id,label])=><button key={id} className={workspace===id?"active":""} onClick={()=>setWorkspace(id as typeof workspace)}>{label}</button>)}</nav>{workspace==="architectures"?<><div className="page-heading"><div><div className="eyebrow"><span className="pulse"/> INTERACTIVE DEPLOYMENT MAP</div><h1>{scenario.name}</h1><p>{scenario.summary}</p></div><div className="heading-tags"><span>{scenario.provider}</span><span>{scenario.category}</span></div></div>
  <section className="visual-card"><div className="visual-top"><div><b>{architectureView==="application"?"APPLICATION ARCHITECTURE":"DEPLOYMENT ARCHITECTURE"}</b><span>{architectureView==="application"?"Explore service calls, events and data dependencies":"Select a component · Follow the deployment path"}</span></div><div className="view-actions"><button className={architectureView==="application"?"view-selected":""} disabled={!hasApplicationView} onClick={()=>setArchitectureView("application")}>Application</button><button className={architectureView==="deployment"?"view-selected":""} onClick={()=>setArchitectureView("deployment")}>Deployment</button>{architectureView==="application"&&<><button className={tierMode===2?"view-selected":""} onClick={()=>setTierMode(2)}>2-tier</button><button className={tierMode===3?"view-selected":""} onClick={()=>setTierMode(3)}>3-tier</button></>}{architectureView==="deployment"&&<><button onClick={()=>setSpeed(s=>s===1?1.5:s===1.5?2:1)}>{speed}× speed <ChevronDown size={12}/></button><button onClick={reset}><RotateCcw size={14}/> Restart flow</button></>}</div></div><div className="scene"><Scene scenario={sceneScenario} stageIndex={architectureView==="deployment"?stageIndex:-1} selected={selected} playing={playing} onSelect={setSelected} tierMode={tierMode} flowMode={architectureView==="deployment"}/><div className="scene-legend"><span><i className="dot request"/> Request / build</span><span><i className="dot response"/> Response</span><span><i className="dot done"/> Completed</span></div><div className="scene-hint">2D · ARCHITECTURE VIEW</div></div><div className="playbar"><div className="play-status"><span className={playing?"pulse":"status-dot"}/><b>{architectureView==="application"?"APPLICATION FLOW · INTERACTIVE MAP":playing?"SIMULATION RUNNING":stage?"STAGE "+(stageIndex+1)+" OF "+scenario.stages.length:"READY TO EXPLORE"}</b></div>{architectureView==="deployment"&&<div className="play-controls"><button onClick={reset} title="Restart flow"><RotateCcw size={15}/></button><button onClick={()=>{setPlaying(false);setStageIndex(i=>Math.max(i-1,0));}} title="Previous stage" disabled={stageIndex<=0}><SkipBack size={15}/></button><button className="play-button" onClick={()=>{if(stageIndex===scenario.stages.length-1)reset();setPlaying(!playing||stageIndex===scenario.stages.length-1);}}>{playing?<Pause size={15}/>:<Play size={15} fill="currentColor"/>}{playing?"Pause":"Play flow"}</button><button onClick={next} title="Next step"><SkipForward size={15}/></button></div>}<div className="play-progress"><i style={{width:progress+"%"}}/></div></div></section>
  {architectureView==="deployment"?<section className="timeline-card"><div className="timeline-head"><div><b>DEPLOYMENT SEQUENCE</b><span>Follow each stage from source to production</span></div><span className="stage-counter">{Math.max(stageIndex+1,0)} / {scenario.stages.length}</span></div><div className="timeline">{scenario.stages.map((s,i)=><button key={s.title} className={i===stageIndex?"timeline-step current":i<stageIndex?"timeline-step done":"timeline-step"} onClick={()=>{setPlaying(false);setStageIndex(i);setSelected(scenario.nodes.find(n=>n.id===s.node)?.id||"");setTab("steps");}}><span className="step-circle">{i<stageIndex?<Check size={13}/>:i+1}</span><b>{s.title}</b></button>)}</div><div className="stage-detail"><div className="stage-icon"><Workflow size={18}/></div><div className="stage-copy"><small>{stage?"CURRENT DEPLOYMENT STAGE":"READY · SELECT A STAGE"}</small><b>{stage?.title||"Start the deployment flow"}</b><p>{stage?.detail||"Press Play flow to watch the complete architecture animate, or select any step in the sequence below."}</p>{stage&&<code>{stage.command}</code>}</div><button className="next-button" onClick={next}>Next stage <ArrowRight size={14}/></button></div></section>:<section className="timeline-card application-note"><div className="timeline-head"><div><b>APPLICATION FLOW</b><span>Follow the arrows to understand service dependencies and data movement</span></div><span className="stage-counter">{sceneScenario.nodes.length} COMPONENTS</span></div><p>This view describes how the application works at runtime. Switch to <b>Deployment</b> to follow how these services are built, released, scaled and monitored.</p></section>}
  </>:<LabWorkspace mode={workspace}/>}  <footer>DEPLOYLAB <span>·</span> Interactive deployment education <span>·</span> No real infrastructure is created</footer></main>
  <aside className="right-panel"><button className="panel-collapse right-collapse" type="button" title={rightCollapsed?"Show inspector panel":"Hide inspector panel"} aria-label={rightCollapsed?"Show inspector panel":"Hide inspector panel"} onClick={()=>setRightCollapsed(v=>!v)}>{rightCollapsed?"‹":"›"}</button>{!rightCollapsed&&<><div className="right-tabs"><button className={tab==="overview"?"selected":""} onClick={()=>setTab("overview")}>OVERVIEW</button>{architectureView==="deployment"&&<><button className={tab==="steps"?"selected":""} onClick={()=>setTab("steps")}>STAGES</button><button className={tab==="commands"?"selected":""} onClick={()=>setTab("commands")}>COMMANDS</button><button className={tab==="files"?"selected":""} onClick={()=>setTab("files")}>FILES</button></>}</div>{tab==="overview"?<>{node?<><div className="inspector-kicker">COMPONENT INSPECTOR</div><div className="node-heading"><div className="node-glyph"><Box size={20}/></div><div><h2>{node.name}</h2><span>{node.sub}</span></div></div><div className="active-pill"><span/> ARCHITECTURE COMPONENT</div><div className="info-block"><label>WHAT DOES IT DO?</label><p>{node.description}</p></div><div className="info-block"><label>KEY TECHNOLOGIES</label><div className="chips">{node.tech.map(t=><span key={t}>{t}</span>)}</div></div><div className="info-block"><label>{architectureView==="application"?"IN THIS APPLICATION":"IN THIS DEPLOYMENT"}</label><p>{architectureView==="application"?scenario.name+" uses this component in its runtime application architecture.":scenario.name+" uses this component as part of its delivery architecture."}</p></div></>:<div className="empty-inspector"><Box size={22}/><b>Select a component</b><p>Click any block in the architecture to learn what it does.</p></div>}</>:tab==="steps"?<div className="right-content"><div className="inspector-kicker">DEPLOYMENT STAGES</div>{scenario.stages.map((s,i)=><button className="right-stage" key={s.title} onClick={()=>{setPlaying(false);setStageIndex(i);setSelected(s.node);}}><span>{i+1}</span><div><b>{s.title}</b><small>{s.detail}</small></div></button>)}{stage&&<div className="stage-learning-card"><div className="inspector-kicker">STAGE WALKTHROUGH · {stageIndex+1}/{scenario.stages.length}</div><h3>{stage.title}</h3><p>{stage.detail}</p><label>COMMAND / ACTION</label><code>{stage.command}</code><div className="stage-learning-actions"><button onClick={()=>setTab("files")}>Open related project files <ArrowRight size={13}/></button><button onClick={()=>setTab("commands")}>View all commands</button></div></div>}</div>:tab==="files"?<DeploymentFiles scenarioId={scenario.id} scenarioName={scenario.name} provider={scenario.provider} stageTitle={stage?.title}/>:<div className="right-content"><div className="inspector-kicker">ILLUSTRATIVE COMMANDS</div>{scenario.stages.map((s,i)=><div className="command-item" key={s.title}><b>{i+1}. {s.title}</b><code>{s.command}</code></div>)}</div>}<div className="right-note"><ShieldCheck size={15}/><span>Educational simulation. Commands are examples and are never executed.</span></div></>}</aside>
 </div>
}