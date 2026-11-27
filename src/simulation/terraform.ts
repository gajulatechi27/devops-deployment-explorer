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
    { name: "variables.tf", purpose: "Declare environment-specific inputs.", content: 'variable "aws_region" {\n  type        = string\n  description = "AWS region for this deployment"\n}\n\nvariable "project_name" {\n  type    = string\n  default = "'+slug+'"\n}\n\nvariable "private_subnet_ids" {\n  type        = list(string)\n  description = "Existing private subnets for the cluster"\n}\n\nvariable "vpc_id" { type = string }\nvariable "ami_id" {\n  type    = string\n  default = null\n}\nvariable "instance_type" {\n  type    = string\n  default = "t3.small"\n}\nvariable "subnet_id" {\n  type    = string\n  default = null\n}\nvariable "security_group_ids" {\n  type    = list(string)\n  default = []\n}' },
    { name: "main.tf", purpose: "Reference the infrastructure for this deployment.", content: scenarioId === "ec2" ? 'resource "aws_instance" "app" {\n  ami                    = var.ami_id\n  instance_type          = var.instance_type\n  subnet_id              = var.subnet_id\n  vpc_security_group_ids = var.security_group_ids\n\n  tags = { Name = "'+safeName+'" }\n}' : 'module "eks" {\n  source  = "terraform-aws-modules/eks/aws"\n  version = "~> 20.0"\n\n  cluster_name    = var.project_name\n  cluster_version = "1.30"\n  vpc_id          = var.vpc_id\n  subnet_ids      = var.private_subnet_ids\n\n  # Supply an existing VPC/subnet design and reviewed IAM access.\n  enable_cluster_creator_admin_permissions = true\n}' },
    { name: "outputs.tf", purpose: "Expose deployment outputs for downstream stages.", content: 'output "deployment_name" {\n  value       = var.project_name\n  description = "Terraform-managed deployment identifier"\n}' },
    { name: "terraform.tfvars.example", purpose: "Example values; copy and review per environment.", content: 'aws_region        = "ap-south-1"\nproject_name       = "'+slug+'"\nprivate_subnet_ids = ["subnet-REPLACE_ME", "subnet-REPLACE_ME"]' }
  ];
  if (provider === "MICROSOFT AZURE") return [
    { name: "versions.tf", purpose: "Pin Terraform and AzureRM provider versions.", content: 'terraform {\n  required_version = ">= 1.6.0"\n  required_providers {\n    azurerm = {\n      source  = "hashicorp/azurerm"\n      version = "~> 3.100"\n    }\n  }\n}' },
    { name: "providers.tf", purpose: "Configure Azure Resource Manager.", content: 'provider "azurerm" {\n  features {}\n  # Authenticate with Azure CLI or workload identity.\n}' },
    { name: "variables.tf", purpose: "Declare resource group and region inputs.", content: 'variable "location" {\n  type    = string\n  default = "Central India"\n}\nvariable "resource_group_name" {\n  type    = string\n  default = "'+slug+'-rg"\n}\nvariable "cluster_name" {\n  type    = string\n  default = "'+slug+'"\n}\nvariable "app_name" { type = string, default = "'+slug+'-app" }\nvariable "container_app_environment_id" { type = string, default = null }\nvariable "container_image" { type = string, default = "example.azurecr.io/app:replace-me" }\nvariable "service_plan_id" { type = string, default = null }\nvariable "storage_account_name" { type = string, default = null }\nvariable "storage_account_access_key" { type = string, default = null }' },
    { name: "main.tf", purpose: "Define the Azure target resource for this deployment.", content: deploymentName.toLowerCase().includes("container apps") || scenarioId.includes("container-app") ? 'resource "azurerm_container_app" "deployment" {\\n  name                         = var.app_name\\n  container_app_environment_id = var.container_app_environment_id\\n  resource_group_name          = var.resource_group_name\\n  revision_mode                = "Single"\\n\\n  template {\\n    container {\\n      name   = "app"\\n      image  = var.container_image\\n      cpu    = 0.5\\n      memory = "1Gi"\\n    }\\n  }\\n}' : deploymentName.toLowerCase().includes("function") || scenarioId.includes("function") ? 'resource "azurerm_linux_function_app" "deployment" {\\n  name                = var.app_name\\n  resource_group_name = var.resource_group_name\\n  location            = var.location\\n  service_plan_id     = var.service_plan_id\\n  storage_account_name       = var.storage_account_name\\n  storage_account_access_key = var.storage_account_access_key\\n  site_config {}\\n}' : 'resource "azurerm_kubernetes_cluster" "deployment" {\\n  name                = var.cluster_name\\n  location            = azurerm_resource_group.deployment.location\\n  resource_group_name = azurerm_resource_group.deployment.name\\n  dns_prefix          = var.cluster_name\\n\\n  default_node_pool {\n    name       = "system"\n    node_count = 2\n    vm_size    = "Standard_D2s_v3"\n  }\\n  identity { type = "SystemAssigned" }\\n}' }, if (provider === "GOOGLE CLOUD") return [
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
