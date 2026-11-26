export type ScenarioId = "eks" | "ec2" | "docker-vm";
export type StepStatus = "pending" | "running" | "success" | "failed";
export type NodeKind = "source" | "pipeline" | "registry" | "cluster" | "workload" | "network" | "server";
export interface DeploymentStep { id:string; title:string; detail:string; command:string; duration:number; nodeIds:string[] }
export interface Scenario {
 id:ScenarioId; name:string; provider:string; category:string; description:string; durationLabel:string;
 architecture:{id:string;label:string;sublabel:string;kind:NodeKind;x:number;y:number;description:string;tech:string[]}[];
 connections:{source:string;target:string;label?:string}[];
 steps:DeploymentStep[];
}