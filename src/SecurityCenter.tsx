import { useMemo, useState } from "react";
import { Activity, AlertCircle, CheckCircle2, ChevronRight, ClipboardCheck, Code2, FileCode2, FileSearch, Fingerprint, GitBranch, Layers3, LockKeyhole, Network, PackageCheck, Search, ShieldCheck, ShieldAlert, Workflow } from "lucide-react";
import { buildSecurityPack } from "./simulation/security";

type Props = {
  scenarioId: string;
  deploymentName: string;
  deploymentProvider: string;
  deploymentCompleted: boolean;
  deploymentTriggered: boolean;
  deploymentProgress: number;
  deploymentStageIndex: number;
  deploymentStages: string[];
};

type Tab = "overview" | "files" | "execution" | "configurations" | "evidence" | "audit";
const tabs: {id:Tab;label:string;icon:typeof ShieldCheck}[] = [
  {id:"overview",label:"Overview",icon:Layers3},
  {id:"files",label:"Security files",icon:FileCode2},
  {id:"execution",label:"Execution",icon:Activity},
  {id:"configurations",label:"Configurations",icon:LockKeyhole},
  {id:"evidence",label:"Evidence",icon:ClipboardCheck},
  {id:"audit",label:"Audit trail",icon:GitBranch}
];

const securityChecks = [
  {name:"Source and workflow permissions",area:"GitHub Actions",stage:0,detail:"Review workflow token permissions, protected environments and approved deployment branches.",command:"Review .github/workflows/deploy.yml",icon:Workflow},
  {name:"OIDC identity and role trust",area:"Cloud identity",stage:1,detail:"Confirm the runner assumes the intended cloud role using short-lived OIDC credentials.",command:"aws sts get-caller-identity",icon:Fingerprint},
  {name:"Container vulnerability scan",area:"Image build",stage:2,detail:"Scan the built image and inspect package-level findings before promotion.",command:"trivy image IMAGE:TAG",icon:ShieldAlert},
  {name:"Registry image controls",area:"Amazon ECR",stage:3,detail:"Review image scanning, immutable tags, encryption and repository access.",command:"aws ecr describe-repositories --repository-names REPOSITORY",icon:PackageCheck},
  {name:"Kubernetes access and workload policy",area:"Amazon EKS",stage:4,detail:"Validate namespace-scoped RBAC, Pod Security Admission and workload security context.",command:"kubectl auth can-i --list -n production",icon:LockKeyhole},
  {name:"Network and secret delivery",area:"Runtime",stage:5,detail:"Verify NetworkPolicy enforcement and the configured external secret delivery path.",command:"kubectl get networkpolicy,externalsecret -n production",icon:Network}
];

const ecsSecurityChecks = [
  {name:"GitHub Actions OIDC permissions",area:"CI/CD identity",stage:0,detail:"Review repository and environment restrictions, id-token permissions and the assumed deployment role.",command:"Review .github/workflows/deploy.yml and the OIDC trust policy",icon:Fingerprint},
  {name:"ECR image scan and provenance",area:"Image supply chain",stage:2,detail:"Review the exact image tag or digest, vulnerability scan findings, immutable tag policy and repository access.",command:"aws ecr describe-image-scan-findings --repository-name REPOSITORY --image-id imageTag=TAG",icon:PackageCheck},
  {name:"Task execution and application roles",area:"ECS task identity",stage:3,detail:"Keep image-pull/logging permissions in the execution role and application API permissions in the separate task role.",command:"aws ecs describe-task-definition --task-definition TASK_FAMILY",icon:LockKeyhole},
  {name:"Fargate network boundary",area:"VPC and security groups",stage:4,detail:"Verify private task subnets, disabled public IP assignment and task ingress restricted to the load balancer security group.",command:"aws ec2 describe-security-groups --group-ids ALB_SG_ID TASK_SG_ID",icon:Network},
  {name:"Secrets and runtime hardening",area:"ECS runtime",stage:4,detail:"Review secret references, read-only root filesystem, container health checks and deployment circuit breaker.",command:"aws ecs describe-services --cluster CLUSTER --services SERVICE",icon:ShieldCheck},
  {name:"CloudWatch and audit logging",area:"Observability",stage:5,detail:"Review container log group, retention, sensitive-data handling and release traceability fields.",command:"aws logs describe-log-groups --log-group-name-prefix /ecs/",icon:Activity}
];

const statusForStage = (stage:number, triggered:boolean, current:number, completed:boolean) => {
  if (!triggered) return {label:"Waiting",kind:"waiting" as const};
  if (completed || current >= stage) return {label:"Stage reached · simulated",kind:"reached" as const};
  if (current === stage - 1) return {label:"Current stage",kind:"current" as const};
  return {label:"Upcoming",kind:"waiting" as const};
};

function StageState({stage,triggered,current,completed}:{stage:number;triggered:boolean;current:number;completed:boolean}) {
  const state=statusForStage(stage,triggered,current,completed);
  return <span className={"sc-state "+state.kind}>{state.label}</span>;
}

export default function SecurityCenter({scenarioId,deploymentName,deploymentProvider,deploymentCompleted,deploymentTriggered,deploymentProgress,deploymentStageIndex,deploymentStages}:Props) {
  const [tab,setTab] = useState<Tab>("overview");
  const [selectedPath,setSelectedPath] = useState("");
  const [query,setQuery] = useState("");
  const [category,setCategory] = useState("All");
  const files = useMemo(()=>buildSecurityPack(scenarioId,deploymentProvider,deploymentName),[scenarioId,deploymentProvider,deploymentName]);
  const activeFile = files.find(file=>file.path===selectedPath) || files[0];
  const categories = ["All",...Array.from(new Set(files.map(file=>file.category)))];
  const filteredFiles = files.filter(file=>(category==="All"||file.category===category) && (file.path+" "+file.title+" "+file.purpose).toLowerCase().includes(query.toLowerCase()));
  const reachedStages = deploymentStages.filter((_,i)=>deploymentTriggered&&(deploymentCompleted||i<=deploymentStageIndex)).length;
  const stageNames = deploymentStages.length ? deploymentStages : ["Source control","CI/CD identity","Build and scan","Container registry","Kubernetes access","Runtime protection"];
  const securityFilesForStage = (index:number) => files.filter(file=>file.stage===index+1);
  const checks = (scenarioId==="eks" && deploymentProvider==="AWS CLOUD" ? securityChecks : scenarioId==="ecs-fargate-ci" && deploymentProvider==="AWS CLOUD" ? ecsSecurityChecks : [{name:"Provider-specific security mapping",area:deploymentProvider,stage:0,detail:"This architecture has a workflow-specific reference security guide. Provider checks are not yet authored for this pattern.",command:"Review the selected workflow and define provider-specific controls.",icon:ShieldCheck}]).map((check,index)=>({...check,stage:Math.min(check.stage,Math.max(0,stageNames.length-1)),index}));
  const timelineLabel = deploymentCompleted ? "Deployment flow completed" : deploymentTriggered ? "Deployment flow in progress" : "Deployment not started";

  if (!deploymentCompleted) return <div className="deployment-module security-center">
    <header className="sc-hero"><div className="sc-hero-copy"><span className="sc-eyebrow"><ShieldCheck size={13}/> DEPLOYMENT SECURITY CENTER</span><h2>{deploymentTriggered?deploymentName:"No deployment selected"}</h2><p>{deploymentTriggered?`${deploymentProvider} · ${scenarioId.toUpperCase()} deployment`:"Select an architecture and start its deployment to load security context."}</p></div><div className="sc-hero-state"><span className="sc-live-dot"/><b>{deploymentTriggered?"Deployment in progress":"Waiting for deployment"}</b><small>SECURITY PACK OPENS AFTER COMPLETION</small></div></header>
    <section className="sc-panel"><div className="sc-section-head"><div><span>DEPLOYMENT-SPECIFIC SECURITY</span><h3>{deploymentTriggered?"Security information will appear after deployment completes":"Security context is not loaded yet"}</h3><p>{deploymentTriggered?"Complete this deployment flow to load its matching security files, identity policies, image controls, runtime configuration and verification guidance.":"No architecture is active in this workspace. Choose an architecture and trigger its deployment; the Security Center will then display only the matching security files and controls."}</p></div></div>{deploymentTriggered&&<div className="sc-note"><AlertCircle size={15}/><span>Only artifacts relevant to {deploymentName} will be shown. For ECS Fargate this means ECS task definitions, IAM roles, ECR, networking, secrets and logging—not Kubernetes manifests.</span></div>}</section>
  </div>;

  return <div className="deployment-module security-center">
    <header className="sc-hero">
      <div className="sc-hero-copy">
        <span className="sc-eyebrow"><ShieldCheck size={13}/> DEPLOYMENT SECURITY CENTER</span>
        <h2>{deploymentName}</h2>
        <p>{deploymentProvider} <i/> {scenarioId.toUpperCase()} workflow <i/> Security visibility for the selected deployment</p>
      </div>
      <div className="sc-hero-state"><span className={"sc-live-dot "+(deploymentTriggered?"active":"")}/><b>{timelineLabel}</b><small>DEPLOYMENT-SPECIFIC SIMULATION</small></div>
    </header>

    <nav className="sc-tabs" aria-label="Deployment security views">
      {tabs.map(item=>{const Icon=item.icon;return <button key={item.id} type="button" className={tab===item.id?"active":""} onClick={()=>setTab(item.id)}><Icon size={14}/>{item.label}{item.id==="files"&&<em>{files.length}</em>}</button>;})}
    </nav>

    {tab==="overview"&&<div className="sc-view">
      <div className="sc-kpis">
        <div><span>SECURITY FILES</span><b>{files.length}</b><small>Mapped to this workflow</small></div>
        <div><span>FLOW STAGES REACHED</span><b>{reachedStages}<i> / {stageNames.length}</i></b><small>Deployment progression only</small></div>
        <div><span>CHECKS WITH EVIDENCE</span><b>0<i> / {checks.length}</i></b><small>No scan integrations connected</small></div>
        <div><span>DEPLOYMENT PROGRESS</span><b>{Math.max(0,Math.min(100,deploymentProgress))}%</b><small>Simulated workflow progress</small></div>
      </div>
      <section className="sc-panel">
        <div className="sc-section-head"><div><span>01 / SECURITY MAP</span><h3>Where security fits in this deployment</h3><p>Follow the actual selected workflow. Select a stage to inspect its related security files and checks.</p></div><span className="sc-legend"><i className="reached"/> Reached <i className="current"/> Current <i/> Upcoming</span></div>
        <div className="sc-map">
          {stageNames.map((name,index)=>{const state=statusForStage(index,deploymentTriggered,deploymentStageIndex,deploymentCompleted);const stageFiles=securityFilesForStage(index);return <button type="button" key={name+"-"+index} className={"sc-map-stage "+state.kind} onClick={()=>{setTab("files");if(stageFiles[0])setSelectedPath(stageFiles[0].path);}}><span className="sc-map-number">{deploymentTriggered&&(deploymentCompleted||index<=deploymentStageIndex)?<CheckCircle2 size={15}/>:index+1}</span><b>{name}</b><small>{stageFiles.length} mapped file{stageFiles.length===1?"":"s"}</small><ChevronRight size={13}/></button>;})}
        </div>
        <div className="sc-map-foot"><span><Workflow size={14}/> Deployment stage progression is simulated</span><span>Security checks require separate execution evidence</span></div>
      </section>
      <div className="sc-two-col">
        <section className="sc-panel"><div className="sc-section-head"><div><span>02 / SECURITY FILES</span><h3>Security artifacts for this deployment</h3><p>Inspect deployment-specific files, their purpose, configuration and verification commands.</p></div><button type="button" className="sc-text-button" onClick={()=>setTab("files")}>Browse all <ChevronRight size={13}/></button></div>
          <div className="sc-mini-files">{files.slice(0,5).map(file=><button key={file.path} onClick={()=>{setSelectedPath(file.path);setTab("files");}}><FileCode2 size={15}/><span><b>{file.path}</b><small>{file.category}</small></span><ChevronRight size={14}/></button>)}</div>
        </section>
        <section className="sc-panel"><div className="sc-section-head"><div><span>03 / EXECUTION VISIBILITY</span><h3>Security checks</h3><p>Stage progression is visible; scan results are not connected yet.</p></div></div>
          <div className="sc-check-summary"><div><b>{checks.length}</b><span>Checks mapped</span></div><div><b>0</b><span>Results received</span></div><div><b>{checks.length}</b><span>Not instrumented</span></div></div>
          <div className="sc-note"><AlertCircle size={15}/><span>No check is marked Passed or Failed without a result from a scanner, workflow job or target-platform verification.</span></div>
          <button type="button" className="sc-outline-button" onClick={()=>setTab("execution")}>View execution timeline <ChevronRight size={13}/></button>
        </section>
      </div>
    </div>}

    {tab==="files"&&<div className="sc-view">
      <div className="sc-page-heading"><div><span>DEPLOYMENT SECURITY FILES</span><h3>Security files explorer</h3><p>Search, filter and inspect every security artifact mapped to {deploymentName}.</p></div><span className="sc-count-pill">{files.length} FILES</span></div>
      <div className="sc-file-tools"><label><Search size={15}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search file path, purpose or control…"/></label><select value={category} onChange={event=>setCategory(event.target.value)}>{categories.map(item=><option key={item}>{item}</option>)}</select></div>
      <div className="sc-file-layout">
        <aside className="sc-file-list">{filteredFiles.map(file=><button type="button" key={file.path} className={(activeFile?.path===file.path)?"active":""} onClick={()=>setSelectedPath(file.path)}><FileCode2 size={15}/><span><b>{file.path}</b><small>{file.category}</small></span><ChevronRight size={14}/></button>)}{filteredFiles.length===0&&<p className="sc-empty">No files match this filter.</p>}</aside>
        <article className="sc-file-preview">{activeFile?<><div className="sc-file-title"><div><span>{activeFile.category}</span><h4>{activeFile.path}</h4><p>{activeFile.title}</p></div><button type="button" className="sc-outline-button" onClick={()=>navigator.clipboard?.writeText(activeFile.content)}><Code2 size={13}/> Copy content</button></div>
          <div className="sc-file-meta"><span><b>Purpose</b>{activeFile.purpose}</span><span><b>File type</b>{activeFile.path.split(".").pop()?.toUpperCase()||"TEXT"}</span><span><b>Mapping</b>{activeFile.status==="pipeline-reference"?"Workflow reference":"Security configuration"}</span></div>
          <div className="sc-stage-meta"><span>RELATED DEPLOYMENT STAGE</span><b>{activeFile.stage===null?"Cross-cutting":stageNames[Math.min(activeFile.stage,stageNames.length-1)]||"Stage "+activeFile.stage}</b><StageState stage={activeFile.stage??0} triggered={deploymentTriggered} current={deploymentStageIndex} completed={deploymentCompleted}/></div>
          <pre className="sc-code"><code>{activeFile.content}</code></pre>
          <div className="sc-verify"><div><ShieldCheck size={15}/><b>How to verify this control</b></div><code>{activeFile.verify}</code><small>Reference verification command. DeployLab models this deployment locally; it does not execute cloud commands.</small></div>
        </>:<p className="sc-empty">Choose a file to inspect.</p>}</article>
      </div>
    </div>}

    {tab==="execution"&&<div className="sc-view">
      <div className="sc-page-heading"><div><span>PIPELINE OBSERVABILITY</span><h3>Security execution timeline</h3><p>See where each security check belongs and whether the corresponding deployment stage has been reached.</p></div><span className="sc-evidence-pill">NO SCAN INTEGRATIONS</span></div>
      <div className="sc-execution-banner"><Activity size={17}/><div><b>{deploymentTriggered?"Deployment flow events are progressing":"Waiting for a deployment to start"}</b><small>Reached stages are not scan results. Each check remains unverified until a real job or API supplies evidence.</small></div></div>
      <div className="sc-check-list">{checks.map(check=>{const reached=deploymentTriggered&&(deploymentCompleted||deploymentStageIndex>=check.stage);const Icon=check.icon;return <article key={check.name} className="sc-check-row"><span className="sc-check-icon"><Icon size={16}/></span><div className="sc-check-main"><div><b>{check.name}</b><small>{check.area}</small></div><p>{check.detail}</p><code>{check.command}</code></div><div className="sc-check-status"><span className="sc-unverified">Not verified</span><small>{reached?"Stage reached · simulated":deploymentTriggered?"Waiting for stage":"Not started"}</small></div></article>;})}</div>
      <div className="sc-note"><AlertCircle size={15}/><span>To show Passed / Failed, connect workflow job conclusions and scanner reports (for example Trivy, ECR scan findings or policy evaluation output). DeployLab currently runs a local simulation only.</span></div>
    </div>}

    {tab==="configurations"&&<div className="sc-view">
      <div className="sc-page-heading"><div><span>RUNTIME AND CLOUD POSTURE</span><h3>Deployed security configurations</h3><p>Understand which controls the reference pack describes and what still needs target-environment verification.</p></div></div>
      <div className="sc-config-grid">{files.filter(file=>file.status==="manual-control").map(file=><article key={file.path}><div><LockKeyhole size={15}/><span>CONFIGURATION REFERENCE</span></div><h4>{file.title}</h4><p>{file.purpose}</p><small>{file.path}</small><StageState stage={file.stage??0} triggered={deploymentTriggered} current={deploymentStageIndex} completed={deploymentCompleted}/><b className="sc-config-unverified">Not confirmed in target environment</b><button type="button" onClick={()=>{setSelectedPath(file.path);setTab("files");}}>Inspect configuration <ChevronRight size={13}/></button></article>)}</div>
      <div className="sc-note"><AlertCircle size={15}/><span>These are example configurations. A file being present in the reference pack does not prove it was applied to EKS, IAM or ECR. Runtime verification needs cluster and cloud API evidence.</span></div>
    </div>}

    {tab==="evidence"&&<div className="sc-view">
      <div className="sc-page-heading"><div><span>ARTIFACTS AND VERIFICATION</span><h3>Security evidence</h3><p>Reports and attestations attached to this deployment should appear here.</p></div><span className="sc-evidence-pill">0 ATTACHED</span></div>
      <div className="sc-evidence-empty"><div><FileSearch size={25}/></div><h4>No security evidence attached</h4><p>This simulation has not generated or imported scanner reports, SBOMs, signatures or policy results.</p><div className="sc-evidence-types"><span>Trivy JSON / SARIF</span><span>SBOM · SPDX / CycloneDX</span><span>Cosign verification</span><span>ECR scan findings</span><span>Kubernetes policy report</span></div></div>
      <div className="sc-panel"><div className="sc-section-head"><div><span>EXPECTED EVIDENCE</span><h3>What a completed integration can attach</h3></div></div><div className="sc-evidence-grid"><div><b>Image scan report</b><small>Findings, severity, package and fixed version</small></div><div><b>SBOM</b><small>Component inventory linked to image digest</small></div><div><b>Image signature</b><small>Signer identity and digest verification result</small></div><div><b>Policy evaluation</b><small>Admission or configuration policy decision</small></div></div></div>
    </div>}

    {tab==="audit"&&<div className="sc-view">
      <div className="sc-page-heading"><div><span>DEPLOYMENT TRACEABILITY</span><h3>Security audit trail</h3><p>Deployment context and stage events currently available in this local simulation.</p></div><span className="sc-evidence-pill">SIMULATED EVENTS</span></div>
      <div className="sc-audit-summary"><div><span>DEPLOYMENT</span><b>{deploymentName}</b></div><div><span>PROVIDER</span><b>{deploymentProvider}</b></div><div><span>SCENARIO</span><b>{scenarioId}</b></div><div><span>FLOW STATE</span><b>{timelineLabel}</b></div></div>
      <div className="sc-audit-list"><div><span className="sc-audit-dot"/><div><b>Security reference pack loaded</b><small>{files.length} reference artifacts mapped to the selected workflow</small></div><em>Context</em></div>{deploymentStages.map((stage,index)=>{const reached=deploymentTriggered&&(deploymentCompleted||index<=deploymentStageIndex);return <div key={stage}><span className={"sc-audit-dot "+(reached?"reached":"")}/><div><b>{reached?"Deployment stage reached":"Deployment stage pending"} · {stage}</b><small>{reached?"Local simulation progression event; not a cloud audit record":"No execution event recorded"}</small></div><em>{reached?"Simulated":"Pending"}</em></div>;})}</div>
      <div className="sc-note"><AlertCircle size={15}/><span>This is not an immutable audit log. For production auditability, ingest GitHub Actions run IDs, commit SHA, image digest, approver identity, timestamps and cloud/Kubernetes audit events.</span></div>
    </div>}
  </div>;
}
