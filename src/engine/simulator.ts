import type { DeploymentStep } from "../types";
export interface LogEntry { id:number; time:string; level:"info"|"success"|"error"; message:string; command?:string }
export function createLog(level:LogEntry["level"],message:string,command?:string):LogEntry {
 return {id:Date.now()+Math.random(),time:new Date().toLocaleTimeString(),level,message,command};
}
export function getStepOutput(step:DeploymentStep):string[] {
 return [`$ ${step.command}`,`[simulator] ${step.detail}`,"[simulator] Process completed successfully."];
}