export type KubernetesManifest = { name:string; kind:string; description:string; content:string };

type Resource = { id:string; name:string; sub?:string; kind:string; description?:string; tech?:string[] };

export function buildKubernetesManifests(
  scenarioId:string,
  deploymentName:string,
  resources:Resource[],
  replicas:number=3
): KubernetesManifest[] {
  const workload=resources.find(resource=>resource.kind==="workload");
  if(!resources.some(resource=>resource.kind==="cluster")||!workload) return [];
  const slug=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0, 40);
  const app=slug(workload.name)||"application";
  const namespace=slug(scenarioId)||"deployment";
  const label=app;
  const network=resources.find(resource=>resource.kind==="network");
  const port=8080;
  const manifests:KubernetesManifest[]=[
    {name:"namespace.yaml",kind:"Namespace",description:"Isolates resources for this deployment.",content:`apiVersion: v1
kind: Namespace
metadata:
  name: ${namespace}
  labels:
    app.kubernetes.io/part-of: ${namespace}
`},
    {name:"deployment.yaml",kind:"Deployment",description:"Declares the application Pods, image placeholder, probes and replica count.",content:`apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${app}
  namespace: ${namespace}
  labels:
    app.kubernetes.io/name: ${label}
spec:
  replicas: ${replicas}
  selector:
    matchLabels:
      app.kubernetes.io/name: ${label}
  template:
    metadata:
      labels:
        app.kubernetes.io/name: ${label}
    spec:
      containers:
        - name: ${app}
          image: <REGISTRY>/<IMAGE>:<TAG>
          ports:
            - name: http
              containerPort: ${port}
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
          readinessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 15
            periodSeconds: 20
`},
    {name:"service.yaml",kind:"Service",description:"Routes traffic to ready Pods selected by the Deployment labels.",content:`apiVersion: v1
kind: Service
metadata:
  name: ${app}
  namespace: ${namespace}
spec:
  type: ClusterIP
  selector:
    app.kubernetes.io/name: ${label}
  ports:
    - name: http
      port: 80
      targetPort: http
      protocol: TCP
`}
  ];
  if((workload.tech||[]).some(item=>/hpa|autoscal/i.test(item))){
    manifests.push({name:"hpa.yaml",kind:"HorizontalPodAutoscaler",description:"Scales the Deployment using resource metrics; verify metrics-server and target sizing.",content:`apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${app}
  namespace: ${namespace}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${app}
  minReplicas: 2
  maxReplicas: 8
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
`});
  }
  if(network){
    manifests.push({name:"ingress.yaml",kind:"Ingress",description:"Illustrative HTTP routing for the network entry in this architecture. Review controller-specific annotations before use.",content:`apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${app}
  namespace: ${namespace}
spec:
  ingressClassName: <INGRESS_CLASS>
  rules:
    - host: <APPLICATION_HOSTNAME>
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: ${app}
                port:
                  number: 80
`});
  }
  return manifests.map(manifest=>({...manifest,description:manifest.description.replace("this deployment",deploymentName)}));
}
