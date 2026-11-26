import test from "node:test";
import assert from "node:assert/strict";
import {advanceRuntime,initialRuntime,injectFault,resolveFault,progressPercent,resetRuntime} from "./engine.js";
const events=[{id:"checkout",title:"Checkout",component:"CI",description:"Source checked out",command:"git checkout main",durationMs:100},{id:"build",title:"Build",component:"Runner",description:"Image built",command:"docker build .",durationMs:100}];
const fault={id:"image-pull",title:"ImagePullBackOff",description:"Bad image reference",component:"Pod",symptom:"manifest unknown",diagnosis:"The image tag does not exist in the registry",fix:"Update image tag to v1.2.0",command:"kubectl set image deploy/web web=web:v1.2.0"};
test("runtime advances events in order",()=>{let s=initialRuntime();s=advanceRuntime(s,events);assert.equal(s.currentEvent,0);s=advanceRuntime(s,events);assert.equal(s.currentEvent,1);assert.equal(s.status,"succeeded");assert.equal(progressPercent(s,2),100);});
test("runtime can inject and resolve a fault",()=>{let s=injectFault(initialRuntime(),fault);assert.equal(s.status,"failed");assert.deepEqual(s.failed,["image-pull"]);s=resolveFault(s,fault);assert.equal(s.status,"running");assert.deepEqual(s.failed,[]);});
test("reset clears runtime state",()=>{assert.deepEqual(resetRuntime(),initialRuntime());});
test("empty event list is safe",()=>{assert.deepEqual(advanceRuntime(initialRuntime(),[]),initialRuntime());});
