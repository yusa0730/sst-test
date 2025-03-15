import { infraConfigResouces } from "./infra-config";

console.log("vpc.ts start");

const vpc = new sst.aws.Vpc(`${infraConfigResouces.idPrefix}-vpc-${$app.stage}`);

export const vpcResources = {
  vpc
};