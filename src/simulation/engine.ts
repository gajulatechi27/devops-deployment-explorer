export type RuntimeStatus = "pending" | "running" | "succeeded" | "failed" | "degraded";
export type SimulationEvent = { id:string; title:string; component:string; description:string; command:string; durationMs:number };
export type RuntimeState = { status:RuntimeStatus; currentEvent:number; completed:string[]; failed:string[]; logs:string[]; version:number };
export type Fault = { id:string; title:string; description:string; component:string; symptom:string; diagnosis:string; fix:string; command:string };
export const initialRuntime = ():RuntimeState => ({status:"pending",currentEvent:-1,completed:[],failed:[],logs:[],version:0});
export function advanceRuntime(state:RuntimeState,events:SimulationEvent[]):RuntimeState {
 if(events.length===0 || state.status==="succeeded") return state;
 const next=state.currentEvent+1;
 if(next>=events.length) return {...state,status:"succeeded",version:state.version+1,logs:[...state.logs,"Deployment completed successfully."]};
 const event=events[next];
 return {...state,status:next===events.length-1?"succeeded":"running",currentEvent:next,completed:[...state.completed,event.id],version:state.version+1,logs:[...state.logs,`[SIM] ${event.component}: ${event.title}`,event.description]};
}
export function resetRuntime():RuntimeState{return initialRuntime();}
export function injectFault(state:RuntimeState,fault:Fault):RuntimeState {
 return {...state,status:"failed",failed:[...state.failed,fault.id],version:state.version+1,logs:[...state.logs,`[FAULT] ${fault.title}`,fault.symptom]};
}
export function resolveFault(state:RuntimeState,fault:Fault):RuntimeState {
 return {...state,status:"running",failed:state.failed.filter(id=>id!==fault.id),version:state.version+1,logs:[...state.logs,`[RECOVERY] ${fault.fix}`]};
}
export function progressPercent(state:RuntimeState,total:number):number{return total<=0?0:Math.min(100,Math.round(state.completed.length/total*100));}
