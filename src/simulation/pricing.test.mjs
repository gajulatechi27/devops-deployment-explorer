import test from "node:test";
import assert from "node:assert/strict";
import { estimateMonthlyResourceCost } from "./pricing.js";

test("estimates known managed cloud resources with an explicit basis", () => {
  const result = estimateMonthlyResourceCost({ id: "rds", name: "Amazon RDS", kind: "database" }, "AWS CLOUD");
  assert.equal(result.monthlyUsd, 45);
  assert.match(result.basis, /managed database/);
});

test("does not assign cloud prices to on-premises or unknown resources", () => {
  assert.equal(estimateMonthlyResourceCost({ id: "vm", name: "Linux database VM", kind: "server" }, "ON-PREMISES / AWS"), null);
  assert.equal(estimateMonthlyResourceCost({ id: "mystery", name: "Generic platform resource", kind: "workload" }, "AWS CLOUD"), null);
});

test("does not double count Kubernetes Pods or charge CI tools", () => {
  assert.equal(estimateMonthlyResourceCost({ id: "pods", name: "Application Pods", kind: "workload" }, "AWS CLOUD"), null);
  assert.equal(estimateMonthlyResourceCost({ id: "ci", name: "CI Pipeline", kind: "pipeline" }, "AWS CLOUD"), null);
});

test("prices storage and routing by explicit service identity", () => {
  assert.equal(estimateMonthlyResourceCost({ id: "s3", name: "Amazon S3", kind: "database" }, "AWS CLOUD").monthlyUsd, 8);
  assert.equal(estimateMonthlyResourceCost({ id: "alb", name: "Application Load Balancer", kind: "network" }, "AWS CLOUD").monthlyUsd, 18);
});
