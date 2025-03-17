import { infraConfigResouces } from "./infra-config";

console.log("======cloudwatch.ts start======");

const vpcFlowLog = new aws.cloudwatch.LogGroup(
  `${infraConfigResouces.idPrefix}-flow-log-group-${$app.stage}`,
  {
    name: `/vpc/${infraConfigResouces.idPrefix}-flow-log-group-${$app.stage}`,
    retentionInDays: 30
  },
  {
    retainOnDelete: false,
  }
);

// Fargate用ロググループ
const ecsLog = new aws.cloudwatch.LogGroup(
  `${infraConfigResouces.idPrefix}-ecs-log-group-${$app.stage}`,
  {
    name: `/aws/ecs/service/${infraConfigResouces.idPrefix}-${$app.stage}`,
    retentionInDays: 30,
  },
  {
    retainOnDelete: false,     // Pulumiのスタック削除時にリソースも削除
  }
);

export const cloudwatchResources = {
  vpcFlowLog,
  ecsLog
};