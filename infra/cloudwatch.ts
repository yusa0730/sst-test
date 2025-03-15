import { infraConfigResouces } from "./infra-config";

console.log("======cloudwatch.ts start======");

const vpcFlowLog = new aws.cloudwatch.LogGroup(
  `${infraConfigResouces.idPrefix}-flow-log-group-${$app.stage}`,
  {
    name: `/vpc/${infraConfigResouces.idPrefix}-flow-log-group-${$app.stage}`,
    retentionInDays: 30
  }
);

export const cloudwatchResources = {
  vpcFlowLog
};