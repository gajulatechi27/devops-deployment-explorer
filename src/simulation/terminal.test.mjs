import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source=await readFile(new URL("./terminal.ts",import.meta.url),"utf8");
const javascript=ts.transpile(source,{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022});
const simulator=await import("data:text/javascript;base64,"+Buffer.from(javascript).toString("base64"));
const run=(state,command)=>simulator.executeTerminalCommand(state,command);

test("does not invent Pods before a Kubernetes deployment",()=>{
 const state=simulator.createTerminalState(false,true);
 const result=run(state,"kubectl get pods");
 assert.match(result.output,/No resources found/);
 assert.equal(result.state.workloads.length,0);
});

test("applies all five workload types and exposes their Pods and nodes",()=>{
 let state=simulator.createTerminalState(false,true);
 let result=run(state,"kubectl apply -f k8s/");
 state=result.state;
 for(const kind of ["Deployment","StatefulSet","DaemonSet","Job","CronJob"])assert.ok(state.workloads.some(w=>w.kind===kind));
 result=run(state,"kubectl get deploy,sts,ds,job,cronjob,pods -o wide");
 for(const name of ["orders-api","orders-db","node-log-agent","orders-db-migration","orders-cleanup","10.244."])assert.ok(result.output.includes(name));
 assert.equal(state.workloads.find(w=>w.kind==="DaemonSet").pods.length,3);
 assert.ok(state.workloads.find(w=>w.kind==="Job").pods.every(p=>p.status==="Completed"));
 assert.equal(state.workloads.find(w=>w.kind==="CronJob").pods.length,0);\n assert.ok(state.workloads.some(w=>w.kind==="Job"&&w.name==="orders-cleanup-9f8d2"&&w.pods.every(p=>p.status==="Completed")));
});

test("StatefulSet Pods have stable ordinal names and simulated PVCs",()=>{
 let state=simulator.createTerminalState(false,true);
 state=run(state,"kubectl apply -f k8s/statefulset.yaml").state;
 const sts=state.workloads.find(w=>w.kind==="StatefulSet");
 assert.deepEqual(sts.pods.map(p=>p.name),["orders-db-0","orders-db-1","orders-db-2"]);
 assert.match(run(state,"kubectl get pvc").output,/data-orders-db-0/);
});

test("DaemonSet schedules one Pod on each simulated worker node",()=>{
 let state=simulator.createTerminalState(false,true);
 state=run(state,"kubectl apply -f k8s/daemonset.yaml").state;
 const ds=state.workloads.find(w=>w.kind==="DaemonSet");
 assert.equal(new Set(ds.pods.map(p=>p.node)).size,3);
});

test("Deployment scaling updates the desired Pod count",()=>{
 let state=simulator.createTerminalState(false,true);
 state=run(state,"kubectl apply -f k8s/deployment.yaml").state;
 state=run(state,"kubectl scale deployment/orders-api --replicas=5").state;
 assert.equal(state.workloads.find(w=>w.kind==="Deployment").pods.length,5);
});

test("Docker image build, local Docker containers and Kubernetes containers are distinct",()=>{
 let state=simulator.createTerminalState(false,true);
 let result=run(state,"docker images");
 assert.match(result.output,/no local images yet/);
 state=run(state,"docker build -t orders:1.0.0 .").state;
 assert.match(run(state,"docker images").output,/orders:1.0.0/);
 assert.match(run(state,"docker ps").output,/no local containers running/);
 state=run(state,"docker run -d orders:1.0.0").state;
 assert.match(run(state,"docker ps").output,/a81c2f9/);
});

test("manifest application is rejected without a Kubernetes cluster",()=>{
 let state=simulator.createTerminalState(false,false);
 const result=run(state,"kubectl apply -f k8s/");
 assert.match(result.output,/no Kubernetes cluster/);
 assert.equal(result.state.workloads.length,0);
});

test("repository tree exposes JAR, Dockerfile, pipeline and workload manifests",()=>{
 const state=simulator.createTerminalState(false,true);
 const result=run(state,"tree");
 for(const path of ["target/orders-service-1.0.0.jar","Dockerfile","deploy.yml","deployment.yaml","statefulset.yaml","daemonset.yaml","job.yaml","cronjob.yaml"])assert.ok(result.output.includes(path));
});
