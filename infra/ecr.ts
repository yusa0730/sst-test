import { infraConfigResouces } from "./infra-config";

console.log("======ecr.ts start======");

const repository = new aws.ecr.Repository(`${infraConfigResouces.idPrefix}-ecr-repository-${$app.stage}`, {
  name: `${infraConfigResouces.idPrefix}-ecr-repository-${$app.stage}`,
  forceDelete: true,
  imageScanningConfiguration: {
    scanOnPush: true
  }
});

export const ecrResources = {
  repository,
};