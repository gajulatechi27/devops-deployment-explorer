/**
 * Transparent baseline estimates for learning scenarios only.
 * These are not live provider prices or billing calculations.
 * Unknown, shared, SaaS and on-premises resources are deliberately excluded.
 */
const cloudProviders = new Set(["AWS CLOUD", "MICROSOFT AZURE", "GOOGLE CLOUD"]);

export function estimateMonthlyResourceCost(resource, provider) {
  if (!cloudProviders.has(provider)) return null;

  const id = String(resource.id || "").toLowerCase();
  const name = String(resource.name || "").toLowerCase();
  const kind = String(resource.kind || "").toLowerCase();
  const label = `${id} ${name}`;

  // Pods run on billed compute; do not double-count them as separate resources.
  if (/\b(pod|replica|worker|node pool)\b/.test(name) || /-pods?$/.test(id)) return null;

  if (/remote state|terraform state/.test(label)) {
    return { monthlyUsd: 1, basis: "small remote state storage allowance" };
  }
  if (/\b(rds|cloud sql|azure sql|sql database|managed postgres|managed database)\b/.test(label)) {
    return { monthlyUsd: 45, basis: "small managed database baseline" };
  }
  if (/\b(eks|aks|gke|kubernetes cluster|managed kubernetes)\b/.test(label) || kind === "cluster") {
    return { monthlyUsd: 72, basis: "small managed cluster baseline; worker compute excluded" };
  }
  if (/\b(fargate|ecs service|ecs tasks|app runner|cloud run|container apps)\b/.test(label)) {
    return { monthlyUsd: 32, basis: "small managed container workload baseline" };
  }
  if (/\b(ec2|compute engine|linux vm|virtual machine|application host)\b/.test(label) || kind === "server") {
    return { monthlyUsd: 36, basis: "single small virtual machine baseline" };
  }
  if (/\b(app service|appservice|azure functions|aws lambda|lambda function|cloud functions)\b/.test(label)) {
    return { monthlyUsd: 18, basis: "low-usage managed application/runtime allowance" };
  }
  if (/\b(load balancer|application gateway|api gateway|cloudfront|cloud cdn|ingress controller)\b/.test(label)) {
    return { monthlyUsd: 18, basis: "single low-traffic routing/CDN allowance" };
  }
  if (/\b(ecr|acr|artifact registry|container registry)\b/.test(label) || (kind === "registry" && /image|registry/.test(name))) {
    return { monthlyUsd: 5, basis: "small container image storage allowance" };
  }
  if (/\b(s3 bucket|amazon s3|cloud storage bucket|blob storage)\b/.test(label)) {
    return { monthlyUsd: 8, basis: "small object-storage allowance" };
  }
  if (/\b(route 53|route53|dns zone)\b/.test(label)) {
    return { monthlyUsd: 2, basis: "one hosted DNS zone allowance" };
  }
  if (/\b(application insights|cloudwatch|cloud monitoring)\b/.test(label)) {
    return { monthlyUsd: 8, basis: "low-volume cloud telemetry allowance" };
  }

  // Generic resources, SaaS products, artifacts, CI tools and unknown hosting
  // intentionally remain unpriced instead of receiving a misleading estimate.
  if (["source", "pipeline"].includes(kind)) return null;
  return null;
}
