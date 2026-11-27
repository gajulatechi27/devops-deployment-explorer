export type WorkloadKind = "Deployment" | "StatefulSet" | "DaemonSet" | "Job" | "CronJob";
export type SimPod = { name:string; ip:string; node:string; status:string; ready:string; restarts:number; age:string; image:string; owner:string; };
export type SimWorkload = { kind:WorkloadKind; name:string; desired:number; image:string; pods:SimPod[]; revision:number; };
export type TerminalState = { deployed:boolean; kubernetes:boolean; namespace:string; workloads:SimWorkload[]; image:string; imageBuilt:boolean; containers:boolean; service:boolean; };
export type TerminalResult = { state:TerminalState; output:string; };
const nodes=[{name:"worker-10-0-1-21",ip:"10.0.1.21"},{name:"worker-10-0-2-18",ip:"10.0.2.18"},{name:"worker-10-0-3-14",ip:"10.0.3.14"}];
const files:Record<string,string>={
"README.md":"# DeployLab sample application\nSpring Boot service deployed to Kubernetes. All files are simulated.",
"pom.xml":"<project>\n  <groupId>com.deploylab</groupId>\n  <artifactId>orders-service</artifactId>\n  <version>1.0.0</version>\n  <packaging>jar</packaging>\n</project>",
"target/orders-service-1.0.0.jar":"[SIMULATED JAR] Spring Boot executable archive · 42.8 MB",
"Dockerfile":"FROM eclipse-temurin:21-jre\nWORKDIR /app\nCOPY target/orders-service-1.0.0.jar app.jar\nEXPOSE 8080\nENTRYPOINT [\"java\",\"-jar\",\"app.jar\"]",
".dockerignore":"target/*.original\n.git\nREADME.md",
".github/workflows/deploy.yml":"name: build-and-deploy\non: [push]\njobs:\n  build:\n    steps:\n      - uses: actions/checkout@v4\n      - run: mvn clean package\n      - run: docker build -t registry.example.com/orders:1.0.0 .\n      - run: kubectl apply -f k8s/",
"k8s/deployment.yaml":"apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: orders-api\n  namespace: production\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: orders-api\n  template:\n    metadata:\n      labels:\n        app: orders-api\n    spec:\n      containers:\n        - name: orders-api\n          image: registry.example.com/orders:1.0.0\n          ports:\n            - containerPort: 8080",
"k8s/statefulset.yaml":"apiVersion: apps/v1\nkind: StatefulSet\nmetadata:\n  name: orders-db\n  namespace: production\nspec:\n  serviceName: orders-db\n  replicas: 3\n  selector:\n    matchLabels:\n      app: orders-db\n  template:\n    metadata:\n      labels:\n        app: orders-db\n    spec:\n      containers:\n        - name: postgres\n          image: postgres:16",
"k8s/daemonset.yaml":"apiVersion: apps/v1\nkind: DaemonSet\nmetadata:\n  name: node-log-agent\n  namespace: production\nspec:\n  selector:\n    matchLabels:\n      app: node-log-agent\n  template:\n    metadata:\n      labels:\n        app: node-log-agent\n    spec:\n      containers:\n        - name: agent\n          image: example/log-agent:1.0",
"k8s/job.yaml":"apiVersion: batch/v1\nkind: Job\nmetadata:\n  name: orders-db-migration\n  namespace: production\nspec:\n  completions: 1\n  template:\n    spec:\n      restartPolicy: Never\n      containers:\n        - name: migrate\n          image: registry.example.com/orders:1.0.0",
"k8s/cronjob.yaml":"apiVersion: batch/v1\nkind: CronJob\nmetadata:\n  name: orders-cleanup\n  namespace: production\nspec:\n  schedule: \"0 2 * * *\"\n  jobTemplate:\n    spec:\n      template:\n        spec:\n          restartPolicy: OnFailure\n          containers:\n            - name: cleanup\n              image: registry.example.com/orders:1.0.0",
"k8s/service.yaml":"apiVersion: v1\nkind: Service\nmetadata:\n  name: orders-api\nspec:\n  type: ClusterIP\n  selector:\n    app: orders-api\n  ports:\n    - port: 80\n      targetPort: 8080",
"scripts/deploy.sh":"#!/usr/bin/env bash\nset -euo pipefail\nmvn clean package\ndocker build -t registry.example.com/orders:1.0.0 .\nkubectl apply -f k8s/"
};
const makePods=(kind,name,count,image,owner)=>Array.from({length:count},(_,i)=>{
 const daemonNode=kind==="DaemonSet"?nodes[i%nodes.length]:nodes[(i+(kind==="StatefulSet"?1:0))%nodes.length];
 const podName=kind==="StatefulSet"?name+"-"+i:kind==="DaemonSet"?name+"-"+daemonNode.name.split("-").slice(-3).join("-"):kind==="Job"?name+"-run-"+String(i+1).padStart(5,"0"):kind==="CronJob"?name+"-scheduled-"+String(i+1).padStart(5,"0"):name+"-7c9d"+["4f","8b","a1","c2","e3"][i%5];
 return {name:podName,ip:"10.244."+[1,2,3][i%3]+"."+[11,12,13,14,15][i%5],node:daemonNode.name,status:kind==="Job"||kind==="CronJob"?"Completed":"Running",ready:kind==="Job"||kind==="CronJob"?"0/1":"1/1",restarts:0,age:"2m",image,owner};
});
const initialWorkloads=(deployed:boolean):SimWorkload[]=>deployed?[{kind:"Deployment",name:"orders-api",desired:3,image:"registry.example.com/orders:1.0.0",pods:makePods("Deployment","orders-api",3,"registry.example.com/orders:1.0.0","ReplicaSet/orders-api-7c9d"),revision:1}]:[];
export function createTerminalState(deployed=false,kubernetes=true):TerminalState{return {deployed:deployed&&kubernetes,kubernetes,namespace:"production",workloads:initialWorkloads(deployed&&kubernetes),image:"registry.example.com/orders:1.0.0",imageBuilt:deployed,containers:false,service:deployed};}
const allPods=(s:TerminalState)=>s.workloads.flatMap(w=>w.pods);
const table=(rows:string[],headers:string[])=>[headers.join("   "),...rows].join("\n");
function applyManifest(s:TerminalState,path:string):{state:TerminalState;output:string}{
 if(!s.kubernetes)return {state:s,output:"error: no Kubernetes cluster is attached to this architecture."};
 const lower=path.toLowerCase();
 const kinds:WorkloadKind[]=lower.endsWith("/")||lower==="k8s"||lower==="k8s/"?["Deployment","StatefulSet","DaemonSet","Job","CronJob"]:lower.includes("statefulset")?["StatefulSet"]:lower.includes("daemonset")?["DaemonSet"]:lower.includes("cronjob")?["CronJob"]:lower.includes("/job")||lower.endsWith("job.yaml")?["Job"]:lower.includes("deployment")?["Deployment"]:[];
 if(!kinds.length&&lower.includes("service.yaml"))return {state:{...s,service:true},output:"service/orders-api configured\n(simulated manifest apply; no cluster was contacted)"};\n if(!kinds.length)return {state:s,output:"error: manifest not found. Try ls k8s/ or kubectl apply -f k8s/."};
 let workloads=[...s.workloads];const messages:string[]=[];
 for(const kind of kinds){
  const name=kind==="Deployment"?"orders-api":kind==="StatefulSet"?"orders-db":kind==="DaemonSet"?"node-log-agent":kind==="Job"?"orders-db-migration":"orders-cleanup";
  const desired=kind==="Deployment"||kind==="StatefulSet"?3:kind==="DaemonSet"?nodes.length:1;
  const image=kind==="StatefulSet"?"postgres:16":kind==="DaemonSet"?"example/log-agent:1.0":kind==="CronJob"?"registry.example.com/orders:1.0.0":"registry.example.com/orders:1.0.0";
  const pods=makePods(kind,name,desired,image,kind==="Deployment"?"ReplicaSet/orders-api-7c9d":kind);
  const workload:SimWorkload={kind,name,desired,image,pods,revision:1};
  workloads=[...workloads.filter(w=>w.name!==name),workload];
  messages.push(kind.toLowerCase()+".apps/"+name+" configured",... (kind==="Deployment"?["replicaset.apps/orders-api-7c9d created"]:[]),desired+" Pod(s) "+(kind==="Job"||kind==="CronJob"?"completed":"created"));
 }
 return {state:{...s,deployed:true,workloads,imageBuilt:true,service:s.service||lower.endsWith("/")||lower==="k8s"||lower==="k8s/"||lower.includes("service.yaml")},output:messages.join("\n")+"\n(simulated manifest apply; no cluster was contacted)"};
}
export function executeTerminalCommand(state:TerminalState,raw:string):TerminalResult{
 const command=raw.trim();if(!command)return {state,output:""};
 const parts=command.split(/\s*(?:&&|;)\s*/).filter(Boolean);let current=state;const outputs:string[]=[];
 for(const part of parts){const p=part.trim();let out="";
 if(p==="help")out="FILES / REPOSITORY\npwd · ls · ls -R · tree · find . -name '*.jar' · cat <path>\ngit status · git log --oneline · git remote -v\nBUILD / CONTAINERS\nmvn clean package · java -jar target/orders-service-1.0.0.jar\ndocker build -t orders:1.0.0 . · docker images · docker ps · docker logs orders-api\nKUBERNETES INSPECTION\nkubectl get all -n production · kubectl get deploy,sts,ds,job,cronjob,pods -o wide\nkubectl get pods -o wide · kubectl get nodes -o wide · kubectl get svc,endpoints\nkubectl describe <deployment|statefulset|daemonset|job|cronjob|pod> <name>\nkubectl logs <pod-name> · kubectl get events · kubectl top nodes|pods\nAPPLY / OPERATE\nkubectl apply -f k8s/ · kubectl apply -f k8s/statefulset.yaml (also daemonset.yaml, job.yaml, cronjob.yaml)\nkubectl scale deployment/orders-api --replicas=5 · kubectl rollout status deployment/orders-api\nAll commands and IP addresses are simulated.";
 else if(p==="pwd")out="/workspace/orders-service";
 else if(p==="ls"||p==="ls -la"||p==="ls -l")out="README.md  pom.xml  Dockerfile  .dockerignore  .github/  target/  k8s/  scripts/";
 else if(p==="ls target/")out="orders-service-1.0.0.jar";
 else if(p==="ls k8s/"||p==="ls k8s")out="deployment.yaml  statefulset.yaml  daemonset.yaml  job.yaml  cronjob.yaml  service.yaml";
 else if(p==="ls .github/workflows/")out="deploy.yml";
 else if(p==="ls scripts/")out="deploy.sh";
 else if(p==="ls -R"||p==="tree"||p==="tree -L 4")out="orders-service/\n├── .github/workflows/deploy.yml\n├── target/orders-service-1.0.0.jar\n├── k8s/\n│   ├── deployment.yaml\n│   ├── statefulset.yaml\n│   ├── daemonset.yaml\n│   ├── job.yaml\n│   ├── cronjob.yaml\n│   └── service.yaml\n├── scripts/deploy.sh\n├── Dockerfile\n├── pom.xml\n└── README.md";
 else if(p.startsWith("find ")||p.startsWith("find ."))out=Object.keys(files).filter(path=>p.includes("*.jar")?path.endsWith(".jar"):p.includes("*.yml")?path.endsWith(".yml"):p.includes("*.yaml")?path.endsWith(".yaml"):true).map(path=>path.startsWith(".")?path:"./"+path).join("\n")||"No matching files.";
 else if(p.startsWith("cat ")||p.startsWith("less ")||p.startsWith("head ")){const path=p.split(/\s+/)[1]?.replace(/^\.\//,"");out=files[path]??"cat: "+path+": No such file or directory";}
 else if(p==="git status")out="On branch main\nYour branch is up to date with 'origin/main'.\nworking tree clean";
 else if(p==="git log --oneline")out="a31b2c1 (HEAD -> main, origin/main) Add deployment simulation\n71fa8d0 Add application source and Dockerfile\n2f6a9d1 Initial commit";
 else if(p==="git remote -v")out="origin  https://github.com/demo-org/orders-service.git (fetch)\norigin  https://github.com/demo-org/orders-service.git (push)";
 else if(p==="mvn clean package"||p==="./mvnw clean package"){out="[INFO] Scanning for projects...\n[INFO] Building orders-service 1.0.0\n[INFO] Tests run: 24, Failures: 0, Errors: 0\n[INFO] Building target/orders-service-1.0.0.jar\n[INFO] BUILD SUCCESS";}
 else if(p.startsWith("java -jar ")){out=p.includes("orders-service")?"Started OrdersApplication on port 8080 (simulated)\nTomcat initialized with port 8080\nApplication started successfully.":"Error: unable to access jarfile";}
 else if(p.startsWith("docker build")){const tag=p.match(/-t\\s+(\\S+)/)?.[1]||"orders:latest";current={...current,image:tag,imageBuilt:true};out="Step 1/4 : FROM eclipse-temurin:21-jre\\nStep 2/4 : COPY target/orders-service-1.0.0.jar app.jar\\nSuccessfully built a81c2f9\\nSuccessfully tagged "+tag;}
 else if(p==="docker images")out=current.imageBuilt?table([current.image+"  248MB  a81c2f9","postgres:16  432MB  9a82d11","example/log-agent:1.0  82MB  3c2a1d0"],["REPOSITORY:TAG   SIZE   IMAGE ID"]):"REPOSITORY:TAG   IMAGE ID   SIZE\\n(no local images yet; run docker build first)";
 else if(p==="docker ps"||p==="docker ps -a")out=current.containers?table(["a81c2f9  "+current.image+"  Up 2 minutes  0.0.0.0:8080->8080/tcp"],["CONTAINER ID   IMAGE   STATUS   PORTS"]):"CONTAINER ID   IMAGE   STATUS\\n(no local containers running; use docker run or inspect Kubernetes containers with crictl ps)";
 else if(p.startsWith("docker run ")){if(!current.imageBuilt)out="Unable to find image locally. Build it first with docker build -t orders:1.0.0 .";else{current={...current,containers:true};out="a81c2f9d2b1a  "+current.image+"  Up 2 seconds  0.0.0.0:8080->8080/tcp (simulated)";}}
 else if(p==="docker stop orders-api"){current={...current,containers:false};out="orders-api stopped (simulated)";}
 else if(p==="crictl ps")out=allPods(current).length?table(allPods(current).map(pod=>pod.name+"  "+pod.image+"  Running  "+pod.name),["CONTAINER   IMAGE   STATE   POD"]):"CONTAINER   IMAGE   STATE\\n(no Kubernetes containers; no Pods are running)";
 else if(p.startsWith("docker logs"))out="Started OrdersApplication on port 8080\nConnected to PostgreSQL at orders-db:5432\nGET /actuator/health 200 OK";
 else if(p.startsWith("kubectl apply -f")){const applied=applyManifest(current,p.split(/\s+/).slice(3).join(" "));current=applied.state;out=applied.output;}
 else if(p==="kubectl get nodes"||p==="kubectl get nodes -o wide")out=current.kubernetes?table(nodes.map(n=>n.name+"   Ready   worker   12d   v1.30.2   "+n.ip),["NAME   STATUS   ROLES   AGE   VERSION   INTERNAL-IP"]):"No Kubernetes cluster is attached.";
 else if(p.startsWith("kubectl get ")){
  const arg=p.slice("kubectl get ".length).split(/\s+/)[0];const wide=p.includes("-o wide");const names=arg.split(",");const wanted=new Set(names.map(x=>x.replace(/s$/,"").toLowerCase()));
  const ws=current.workloads.filter(w=>wanted.has(w.kind.toLowerCase())||wanted.has(w.kind==="StatefulSet"?"sts":w.kind==="DaemonSet"?"ds":w.kind==="Deployment"?"deploy":w.kind.toLowerCase()));
  if(arg==="all")out=current.workloads.length?[...current.workloads.map(w=>w.kind+"/"+w.name+" "+(w.pods.filter(pod=>pod.status==="Running").length)+"/"+w.desired),...(current.service?["service/orders-api ClusterIP 10.96.12.4:80"]:[]),...allPods(current).map(pod=>"pod/"+pod.name+" "+pod.status)].join("\n"):"No resources found in "+current.namespace+" namespace.";
  else if(wanted.has("pod")||wanted.has("pods")){const pods=allPods(current);out=pods.length?table(pods.map(pod=>pod.name+"   "+pod.ready+"   "+pod.status+"   "+pod.restarts+"   "+pod.ip+(wide?"   "+pod.node+"   "+pod.image:"")),wide?["NAME   READY   STATUS   RESTARTS   IP   NODE   IMAGE"]:["NAME   READY   STATUS   RESTARTS   AGE"]):"No resources found in "+current.namespace+" namespace.";}
  else if(names.length>1){const lines=ws.map(w=>w.kind+"/"+w.name+"   "+(w.kind==="Deployment"||w.kind==="StatefulSet"?w.pods.filter(x=>x.status==="Running").length+"/"+w.desired:w.kind==="DaemonSet"?w.pods.length+"/"+nodes.length:w.kind==="Job"?"1/1 Complete":"schedule 0 2 * * *"));if(wanted.has("pod")||wanted.has("pods"))lines.push(...allPods(current).map(pod=>"pod/"+pod.name+"   "+pod.ready+"   "+pod.status+"   "+pod.ip+"   "+pod.node));if((wanted.has("svc")||wanted.has("service"))&&current.service)lines.push("service/orders-api   ClusterIP   10.96.12.4   80/TCP");if((wanted.has("endpoints")||wanted.has("ep"))&&current.service)lines.push("endpoints/orders-api   "+allPods(current).filter(x=>x.owner.startsWith("ReplicaSet")).map(x=>x.ip+":8080").join(","));out=lines.length?lines.join("\n"):"No resources found in "+current.namespace+" namespace."; }
  else if(wanted.has("deployment")||wanted.has("deploy"))out=ws.filter(w=>w.kind==="Deployment").length?table(ws.filter(w=>w.kind==="Deployment").map(w=>w.name+"   "+w.pods.filter(x=>x.status==="Running").length+"/"+w.desired+"   "+w.desired+"   "+w.desired),["NAME   READY   UP-TO-DATE   AVAILABLE"]):"No resources found in "+current.namespace+" namespace.";
  else if(wanted.has("statefulset")||wanted.has("sts"))out=ws.filter(w=>w.kind==="StatefulSet").length?table(ws.filter(w=>w.kind==="StatefulSet").map(w=>w.name+"   "+w.pods.length+"/"+w.desired+"   "+w.desired),["NAME   READY   AGE"]):"No resources found in "+current.namespace+" namespace.";
  else if(wanted.has("daemonset")||wanted.has("ds"))out=ws.filter(w=>w.kind==="DaemonSet").length?table(ws.filter(w=>w.kind==="DaemonSet").map(w=>w.name+"   "+w.pods.length+"   "+nodes.length+"   "+nodes.length),["NAME   DESIRED   CURRENT   READY"]):"No resources found in "+current.namespace+" namespace.";
  else if(wanted.has("job"))out=ws.filter(w=>w.kind==="Job").length?table(ws.filter(w=>w.kind==="Job").map(w=>w.name+"   1/1   Complete"),["NAME   COMPLETIONS   STATUS"]):"No resources found in "+current.namespace+" namespace.";
  else if(wanted.has("cronjob")||wanted.has("cj"))out=ws.filter(w=>w.kind==="CronJob").length?table(ws.filter(w=>w.kind==="CronJob").map(w=>w.name+"   0 */2 * * *   orders-cleanup-xxxxx   1m"),["NAME   SCHEDULE   SUSPEND   ACTIVE   LAST SCHEDULE"]):"No resources found in "+current.namespace+" namespace.";
  else if(wanted.has("rs")||wanted.has("replicaset"))out=ws.filter(w=>w.kind==="Deployment").length?table(ws.filter(w=>w.kind==="Deployment").map(w=>w.name+"-7c9d   "+w.desired+"   "+w.desired+"   "+w.desired),["NAME   DESIRED   CURRENT   READY"]):"No resources found in "+current.namespace+" namespace.";
  else if(wanted.has("svc")||wanted.has("service"))out=current.service?"NAME         TYPE        CLUSTER-IP     PORT(S)\norders-api   ClusterIP   10.96.12.4   80/TCP":"No resources found in "+current.namespace+" namespace.";
  else if(wanted.has("endpoints")||wanted.has("ep"))out=current.service?"orders-api   10.244.1.11:8080,10.244.2.12:8080,10.244.3.13:8080":"No resources found in "+current.namespace+" namespace.";
  else if(wanted.has("pvc")||wanted.has("persistentvolumeclaim"))out=current.workloads.some(w=>w.kind==="StatefulSet")?"NAME                 STATUS   VOLUME\ndata-orders-db-0     Bound    pvc-a1b2\ndata-orders-db-1     Bound    pvc-c3d4\ndata-orders-db-2     Bound    pvc-e5f6":"No resources found in "+current.namespace+" namespace.";\n  else if(wanted.has("ingress")||wanted.has("ing"))out=current.deployed?"orders-api   nginx   orders.example.test   203.0.113.20":"No resources found in "+current.namespace+" namespace.";
  else out="No resources found in "+current.namespace+" namespace.";
 }
 else if(p.startsWith("kubectl describe ")){const parts2=p.split(/\s+/);const kind=parts2[2]?.toLowerCase();const name=parts2[3];const w=current.workloads.find(x=>x.name===name||x.kind.toLowerCase()===kind&&x.name===name);const pod=allPods(current).find(x=>x.name===name);out=w?"Name: "+w.name+"\nKind: "+w.kind+"\nNamespace: "+current.namespace+"\nDesired replicas/completions: "+w.desired+"\nImage: "+w.image+"\nPods: "+w.pods.map(x=>x.name+" ("+x.status+", "+x.ip+")").join("\n")+"\nEvents: Created successfully (simulated)":pod?"Name: "+pod.name+"\nNamespace: "+current.namespace+"\nNode: "+pod.node+"\nIP: "+pod.ip+"\nStatus: "+pod.status+"\nImage: "+pod.image+"\nControlled by: "+pod.owner+"\nEvents: Scheduled, Pulled, Started (simulated)":"Error from server (NotFound): resource not found";}
 else if(p.startsWith("kubectl logs")){const pod=allPods(current).find(x=>x.name===p.split(/\s+/).pop());out=pod?"INFO Starting "+pod.image+"\nINFO Application health check passed\nINFO Request GET /health 200 OK":"INFO OrdersApplication started on :8080\nINFO Connected to database\nINFO GET /actuator/health 200 OK (simulated)";}
 else if(p==="kubectl get events"||p==="kubectl get events --sort-by=.lastTimestamp")out=current.workloads.length?"LAST SEEN   TYPE    REASON       OBJECT\n1m          Normal  Scheduled    Pod/orders-api-7c9d4f\n1m          Normal  Pulled       Container image pulled\n1m          Normal  Started      Container started":"No events found in "+current.namespace+" namespace.";
 else if(p==="kubectl top nodes")out=current.kubernetes?"NAME                 CPU(cores)   CPU%   MEMORY(bytes)\nworker-10-0-1-21     240m         12%    1180Mi\nworker-10-0-2-18     310m         15%    1320Mi":"No metrics available.";
 else if(p==="kubectl top pods")out=allPods(current).length?allPods(current).map(x=>x.name+"   24m   128Mi").join("\n"):"No resources found.";
 else if(p.startsWith("kubectl scale ")){const match=p.match(/deployment\/([^\s]+)/);const count=Number(p.match(/--replicas=(\d+)/)?.[1]);const w=current.workloads.find(x=>x.kind==="Deployment"&&x.name===match?.[1]);if(!w)out="Error from server (NotFound): deployment not found.";else if(!Number.isInteger(count)||count<1||count>10)out="error: replicas must be between 1 and 10";else{const pods=makePods("Deployment",w.name,count,w.image,"ReplicaSet/"+w.name+"-7c9d");current={...current,workloads:current.workloads.map(x=>x.name===w.name?{...x,desired:count,pods,revision:x.revision+1}:x)};out="deployment.apps/"+w.name+" scaled\n"+count+" replica(s) desired (simulated)";}}
 else if(p.startsWith("kubectl rollout status")){const name=p.split(/\s+/).pop()?.split("/").pop();const w=current.workloads.find(x=>x.kind==="Deployment"&&x.name===name);out=w?'deployment "'+w.name+'" successfully rolled out':"error: deployment not found.";}
 else if(p.startsWith("kubectl config set-context")&&p.includes("--namespace=")){const ns=p.match(/--namespace=([^\s]+)/)?.[1]||current.namespace;current={...current,namespace:ns};out="Context modified. Active namespace: "+ns;}
 else if(p==="terraform plan")out="Plan: 2 to add, 0 to change, 0 to destroy. (simulation)";
 else out="command not found in this simulated environment. Type help.";
 outputs.push("$ "+p,out);
 }
 return {state:current,output:outputs.join("\n")};
}
