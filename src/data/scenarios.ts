import type { Scenario } from "../types";
export const scenarios: Scenario[] = [
 { id:"eks", name:"GitHub Actions → Amazon EKS", provider:"AWS", category:"Kubernetes", durationLabel:"8 stages", description:"A production-style container delivery pipeline: source control, CI, image registry, Kubernetes rollout and public traffic.",
 architecture:[
 {id:"github",label:"GitHub",sublabel:"Source repository",kind:"source",x:0,y:120,description:"Developers push commits and open pull requests. A workflow trigger starts the delivery pipeline.",tech:["Git","GitHub"]},
 {id:"actions",label:"GitHub Actions",sublabel:"CI / CD workflow",kind:"pipeline",x:250,y:120,description:"Checks out code, runs tests, builds an OCI image, authenticates to AWS and updates the cluster.",tech:["Workflow YAML","OIDC","BuildKit"]},
 {id:"ecr",label:"Amazon ECR",sublabel:"Container registry",kind:"registry",x:500,y:120,description:"Stores versioned container images. EKS worker nodes pull the image during scheduling.",tech:["OCI image","Image tags","IAM"]},
 {id:"eks",label:"Amazon EKS",sublabel:"Managed control plane",kind:"cluster",x:760,y:120,description:"AWS-managed Kubernetes API server and control plane. The cluster reconciles desired workload state.",tech:["Kubernetes","Deployment","ReplicaSet"]},
 {id:"pods",label:"Application Pods",sublabel:"3 replicas",kind:"workload",x:1020,y:120,description:"Pods run the application containers. Readiness probes determine whether they can receive traffic.",tech:["Pod","Container","Readiness probe"]},
 {id:"alb",label:"AWS Load Balancer",sublabel:"Ingress traffic",kind:"network",x:1020,y:330,description:"An ingress controller / AWS Load Balancer Controller provisions an ALB and routes external requests to healthy targets.",tech:["ALB","Ingress","Target groups"]},
 {id:"users",label:"End users",sublabel:"HTTPS requests",kind:"source",x:760,y:330,description:"Clients resolve the application DNS name and send HTTPS requests to the public load balancer.",tech:["DNS","HTTPS","TLS"]}
 ],
 connections:[{source:"github",target:"actions",label:"git push"},{source:"actions",target:"ecr",label:"docker push"},{source:"ecr",target:"eks",label:"image pull"},{source:"eks",target:"pods",label:"schedule"},{source:"pods",target:"alb",label:"healthy targets"},{source:"users",target:"alb",label:"HTTPS"}],
 steps:[
 {id:"checkout",title:"Checkout source code",detail:"The workflow checks out the selected commit so the build uses a known source revision.",command:"actions/checkout@v4",duration:850,nodeIds:["github","actions"]},
 {id:"test",title:"Run tests and quality checks",detail:"Unit tests and static checks validate the change before creating a release artifact.",command:"npm ci && npm test",duration:1050,nodeIds:["actions"]},
 {id:"build",title:"Build container image",detail:"A reproducible container image is assembled from the Dockerfile and tagged with the commit SHA.",command:"docker build -t app:$GITHUB_SHA .",duration:1200,nodeIds:["actions"]},
 {id:"auth",title:"Authenticate to AWS",detail:"The workflow obtains short-lived credentials through GitHub OIDC and an IAM role. No long-lived access key is required in this pattern.",command:"aws-actions/configure-aws-credentials@v4",duration:900,nodeIds:["actions","ecr"]},
 {id:"push",title:"Push image to ECR",detail:"The image is uploaded to Amazon ECR and becomes available to the cluster nodes.",command:"docker push $ECR_REPOSITORY:$GITHUB_SHA",duration:1150,nodeIds:["actions","ecr"]},
 {id:"manifest",title:"Update Kubernetes workload",detail:"The deployment image is updated and submitted to the Kubernetes API server.",command:"kubectl set image deployment/web web=$IMAGE",duration:950,nodeIds:["eks"]},
 {id:"rollout",title:"Roll out new Pods",detail:"The Deployment controller creates a new ReplicaSet. Kubernetes schedules Pods and waits for readiness.",command:"kubectl rollout status deployment/web",duration:1400,nodeIds:["eks","pods"]},
 {id:"traffic",title:"Route production traffic",detail:"Healthy targets receive requests through the load balancer. The new version is now serving traffic.",command:"kubectl get ingress,svc,pods",duration:900,nodeIds:["pods","alb","users"]}
 ]},
 {id:"ec2",name:"CI/CD → Amazon EC2",provider:"AWS",category:"Virtual machine",durationLabel:"6 stages",description:"Deploy a web application onto a Linux virtual machine using a CI pipeline and a reverse proxy.",
 architecture:[
 {id:"repo",label:"Git Repository",sublabel:"Application code",kind:"source",x:0,y:160,description:"The team stores source code and version history in Git.",tech:["Git","Pull requests"]},
 {id:"ci",label:"Jenkins",sublabel:"Build pipeline",kind:"pipeline",x:280,y:160,description:"Jenkins checks out the project, tests it, packages an artifact and connects to the target host using a controlled deployment identity.",tech:["Jenkinsfile","Pipeline","SSH"]},
 {id:"artifact",label:"Build artifact",sublabel:"Versioned package",kind:"registry",x:560,y:160,description:"A versioned application bundle is retained so releases can be traced and rolled back.",tech:["Artifact","Versioning"]},
 {id:"vm",label:"Amazon EC2",sublabel:"Linux instance",kind:"server",x:840,y:160,description:"An EC2 virtual machine runs Linux. Security groups control allowed network traffic.",tech:["EC2","Amazon Linux","Security groups"]},
 {id:"nginx",label:"Nginx + App",sublabel:"systemd service",kind:"workload",x:1120,y:160,description:"Nginx terminates or proxies HTTP traffic while systemd supervises the application process.",tech:["Nginx","systemd","Linux"]}
 ],connections:[{source:"repo",target:"ci",label:"webhook"},{source:"ci",target:"artifact",label:"build"},{source:"artifact",target:"vm",label:"secure copy"},{source:"vm",target:"nginx",label:"systemd restart"}],
 steps:[
 {id:"checkout",title:"Checkout repository",detail:"Jenkins checks out the commit associated with the release.",command:"git checkout $GIT_COMMIT",duration:800,nodeIds:["repo","ci"]},
 {id:"test",title:"Build and test application",detail:"The build agent installs dependencies, runs tests and packages the application.",command:"./gradlew clean test build",duration:1200,nodeIds:["ci"]},
 {id:"package",title:"Publish release artifact",detail:"The pipeline stores an immutable, versioned artifact for deployment and rollback.",command:"archiveArtifacts artifacts: 'build/libs/*.jar'",duration:850,nodeIds:["ci","artifact"]},
 {id:"transfer",title:"Transfer artifact to EC2",detail:"The release artifact is copied to the instance using a restricted deployment identity.",command:"scp app.jar deploy@ec2:/opt/app/releases/",duration:1100,nodeIds:["artifact","vm"]},
 {id:"restart",title:"Restart application service",detail:"A controlled systemd restart activates the new release. Health checks verify the process.",command:"sudo systemctl restart webapp",duration:1050,nodeIds:["vm","nginx"]},
 {id:"verify",title:"Verify endpoint health",detail:"The pipeline checks the service endpoint before marking the release successful.",command:"curl -fsS https://app.example.com/health",duration:900,nodeIds:["nginx"]}
 ]},
 {id:"docker-vm",name:"Docker → Linux VM",provider:"On-premises",category:"Containers",durationLabel:"6 stages",description:"Package an application as a container and run it on an on-premises Linux host behind Nginx.",
 architecture:[
 {id:"git",label:"Git",sublabel:"Source code",kind:"source",x:0,y:160,description:"A developer pushes application code to the repository.",tech:["Git","GitLab"]},
 {id:"runner",label:"GitLab Runner",sublabel:"CI pipeline",kind:"pipeline",x:280,y:160,description:"A runner executes lint, test and image build jobs in the CI pipeline.",tech:["GitLab CI","Runner"]},
 {id:"registry",label:"Container Registry",sublabel:"Private images",kind:"registry",x:560,y:160,description:"A private registry stores the container image for the on-premises environment.",tech:["OCI registry","Image tags"]},
 {id:"host",label:"Linux Server",sublabel:"On-premises VM",kind:"server",x:840,y:160,description:"A Linux virtual machine pulls the image and runs it with Docker Engine.",tech:["Ubuntu","Docker Engine","Firewall"]},
 {id:"service",label:"Docker container",sublabel:"Application service",kind:"workload",x:1120,y:160,description:"The container runs the app with explicit ports, environment configuration and restart policy.",tech:["Docker","Container","Healthcheck"]}
 ],connections:[{source:"git",target:"runner",label:"push event"},{source:"runner",target:"registry",label:"image push"},{source:"registry",target:"host",label:"image pull"},{source:"host",target:"service",label:"docker run"}],
 steps:[
 {id:"checkout",title:"Fetch source",detail:"GitLab Runner retrieves the repository revision for this pipeline.",command:"git clone $CI_REPOSITORY_URL",duration:800,nodeIds:["git","runner"]},
 {id:"test",title:"Run application tests",detail:"The CI job runs checks before the application is packaged.",command:"npm ci && npm run test",duration:950,nodeIds:["runner"]},
 {id:"build",title:"Build Docker image",detail:"Docker builds a portable image from the application Dockerfile.",command:"docker build -t registry.local/web:$CI_COMMIT_SHA .",duration:1200,nodeIds:["runner"]},
 {id:"push",title:"Push to private registry",detail:"The runner authenticates and pushes the tagged image to the private registry.",command:"docker push registry.local/web:$CI_COMMIT_SHA",duration:1050,nodeIds:["runner","registry"]},
 {id:"pull",title:"Pull image on Linux host",detail:"The on-premises host pulls the exact release image from the registry.",command:"docker pull registry.local/web:$CI_COMMIT_SHA",duration:1000,nodeIds:["registry","host"]},
 {id:"run",title:"Start and verify container",detail:"The container starts with a restart policy and health check. The service is ready for internal traffic.",command:"docker compose up -d && docker compose ps",duration:1100,nodeIds:["host","service"]}
 ]}
];