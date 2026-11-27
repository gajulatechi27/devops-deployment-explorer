export type TerraformFile = { name: string; purpose: string; content: string };
export type TerraformPack = { providerLabel: string; target: string; note: string; files: TerraformFile[]; commands: { command: string; purpose: string }[] };

const commands = [
  { command: "terraform fmt -recursive", purpose: "Format Terraform files before review." },
  { command: "terraform init", purpose: "Download the selected provider and module dependencies." },
  { command: "terraform validate", purpose: "Check configuration syntax and internal consistency." },
  { command: "terraform plan -out=tfplan", purpose: "Preview infrastructure changes without applying them." },
  { command: "terraform show tfplan", purpose: "Inspect the saved execution plan." },
  { command: "terraform apply tfplan", purpose: "Apply the reviewed plan. This is a real-world command; not executed by DeployLab." },
  { command: "terraform output", purpose: "Read exported infrastructure outputs." },
  { command: "terraform plan -refresh-only", purpose: "Check for drift between configuration, state and remote infrastructure." }
];

function filesFor(provider: string, scenarioId: string, deploymentName: string): TerraformFile[] {
  const slug = scenarioId.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const safeName = deploymentName.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  if (provider === "AWS CLOUD") return [
    { name: "versions.tf", purpose: "Pin Terraform and AWS provider versions.", content: 'terraform {\n  required_version = ">= 1.6.0"\n  required_providers {\n    aws = {\n      source  = "hashicorp/aws"\n      version = "~> 5.0"\n    }\n  }\n}' },
    { name: "providers.tf", purpose: "Configure the AWS provider and region.", content: 'provider "aws" {\n  region = var.aws_region\n  default_tags {\n    tags = {\n      ManagedBy = "Terraform"\n      Project   = var.project_name\n    }\n  }\n}' },
    { name: "variables.tf", purpose: "Declare environment-specific inputs.", content: 'variable "aws_region" {\n  type        = string\n  description = "AWS region for this deployment"\n}\n\nvariable "project_name" {\n  type    = string\n  default = "'+slug+'"\n}\n\nvariable "private_subnet_ids" {\n  type        = list(string)\n  description = "Existing private subnets for the cluster"\n}' },
    { name: "main.tf", purpose: "Reference the infrastructure for this deployment.", content: scenarioId === "ec2" ? 'resource "aws_instance" "app" {\n  ami                    = var.ami_id\n  instance_type          = var.instance_type\n  subnet_id              = var.subnet_id\n  vpc_security_group_ids = var.security_group_ids\n\n  tags = { Name = "'+safeName+'" }\n}' : 'module "eks" {\n  source  = "terraform-aws-modules/eks/aws"\n  version = "~> 20.0"\n\n  cluster_name    = var.project_name\n  cluster_version = "1.30"\n  subnet_ids      = var.private_subnet_ids\n\n  # Supply an existing VPC/subnet design and reviewed IAM access.\n  enable_cluster_creator_admin_permissions = true\n}' },
    { name: "outputs.tf", purpose: "Expose deployment outputs for downstream stages.", content: 'output "deployment_name" {\n  value       = var.project_name\n  description = "Terraform-managed deployment identifier"\n}' },
    { name: "terraform.tfvars.example", purpose: "Example values; copy and review per environment.", content: 'aws_region        = "ap-south-1"\nproject_name       = "'+slug+'"\nprivate_subnet_ids = ["subnet-REPLACE_ME", "subnet-REPLACE_ME"]' }
  ];
  if (provider === "MICROSOFT AZURE") return [
    { name: "versions.tf", purpose: "Pin Terraform and AzureRM provider versions.", content: 'terraform {\n  required_version = ">= 1.6.0"\n  required_providers {\n    azurerm = {\n      source  = "hashicorp/azurerm"\n      version = "~> 3.100"\n    }\n  }\n}' },
    { name: "providers.tf", purpose: "Configure Azure Resource Manager.", content: 'provider "azurerm" {\n  features {}\n  # Authenticate with Azure CLI or workload identity.\n}' },
    { name: "variables.tf", purpose: "Declare resource group and region inputs.", content: 'variable "location" {\n  type    = string\n  default = "Central India"\n}\nvariable "resource_group_name" {\n  type    = string\n  default = "'+slug+'-rg"\n}\nvariable "cluster_name" {\n  type    = string\n  default = "'+slug+'"\n}' },
    { name: "main.tf", purpose: "Define the Azure Kubernetes infrastructure.", content: 'resource "azurerm_resource_group" "deployment" {\n  name     = var.resource_group_name\n  location = var.location\n}\n\nresource "azurerm_kubernetes_cluster" "deployment" {\n  name                = var.cluster_name\n  location            = azurerm_resource_group.deployment.location\n  resource_group_name = azurerm_resource_group.deployment.name\n  dns_prefix          = var.cluster_name\n\n  default_node_pool {\n    name       = "system"\n    node_count = 2\n    vm_size    = "Standard_D2s_v3"\n  }\n  identity { type = "SystemAssigned" }\n}' },
    { name: "outputs.tf", purpose: "Expose cluster and resource group identifiers.", content: 'output "cluster_name" { value = azurerm_kubernetes_cluster.deployment.name }\noutput "resource_group" { value = azurerm_resource_group.deployment.name }' },
    { name: "terraform.tfvars.example", purpose: "Example values for a non-production environment.", content: 'location            = "Central India"\nresource_group_name = "'+slug+'-rg"\ncluster_name        = "'+slug+'"' }
  ];
  if (provider === "GOOGLE CLOUD") return [
    { name: "versions.tf", purpose: "Pin Terraform and Google provider versions.", content: 'terraform {\n  required_version = ">= 1.6.0"\n  required_providers {\n    google = {\n      source  = "hashicorp/google"\n      version = "~> 5.0"\n    }\n  }\n}' },
    { name: "providers.tf", purpose: "Configure the Google Cloud project and region.", content: 'provider "google" {\n  project = var.project_id\n  region  = var.region\n}' },
    { name: "variables.tf", purpose: "Declare project, region and network inputs.", content: 'variable "project_id" { type = string }\nvariable "region" {\n  type    = string\n  default = "asia-south1"\n}\nvariable "cluster_name" {\n  type    = string\n  default = "'+slug+'"\n}\nvariable "network" { type = string }\nvariable "subnetwork" { type = string }' },
    { name: "main.tf", purpose: "Define the Google Kubernetes Engine cluster.", content: 'resource "google_container_cluster" "deployment" {\n  name     = var.cluster_name\n  location = var.region\n  network  = var.network\n  subnetwork = var.subnetwork\n  deletion_protection = true\n\n  initial_node_count = 1\n  node_config {\n    machine_type = "e2-standard-2"\n    oauth_scopes = ["https://www.googleapis.com/auth/cloud-platform"]\n  }\n}' },
    { name: "outputs.tf", purpose: "Expose cluster name and location.", content: 'output "cluster_name" { value = google_container_cluster.deployment.name }\noutput "cluster_location" { value = google_container_cluster.deployment.location }' },
    { name: "terraform.tfvars.example", purpose: "Example values; supply an existing project and network.", content: 'project_id = "REPLACE_WITH_PROJECT_ID"\nregion = "asia-south1"\ncluster_name = "'+slug+'"\nnetwork = "REPLACE_WITH_VPC"\nsubnetwork = "REPLACE_WITH_SUBNET"' }
  ];
  return [
    { name: "README-TERRAFORM.md", purpose: "Explain why a provider must be selected before provisioning.", content: '# Terraform for '+deploymentName+'\n\nThis architecture is not tied to a supported public-cloud provider in this simulator. Select the actual hosting platform (for example VMware vSphere, AWS, Azure or Google Cloud) before authoring provider-specific Terraform resources.\n\nDo not assume Terraform is required for every application deployment. It is only needed when this team owns infrastructure provisioning or configuration.' },
    { name: "versions.tf", purpose: "Start a provider-specific Terraform root module.", content: 'terraform {\n  required_version = ">= 1.6.0"\n  # Add required_providers after the hosting platform is confirmed.\n}' }
  ];
}

export function buildTerraformPack(provider: string, scenarioId: string, deploymentName: string): TerraformPack {
  const supported = ["AWS CLOUD", "MICROSOFT AZURE", "GOOGLE CLOUD"].includes(provider);
  return {
    providerLabel: provider,
    target: deploymentName,
    note: supported
      ? "Illustrative provider-specific starter files for this deployment flow. Review networking, IAM, state backend, versions and cost before using them. DeployLab never runs these commands."
      : "Terraform is not automatically required for this deployment. Confirm who owns the infrastructure and which provider/platform is used before creating Terraform resources.",
    files: filesFor(provider, scenarioId, deploymentName),
    commands
  };
}
