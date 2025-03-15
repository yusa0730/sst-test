import { infraConfigResouces } from "./infra-config";

console.log("======iam.ts start======");

const vpcFlowLogRole = new aws.iam.Role(
  `${infraConfigResouces.idPrefix}-flow-log-role-${$app.stage}`,
  {
    name: `${infraConfigResouces.idPrefix}-flow-log-iar-${$app.stage}`,
    assumeRolePolicy: $jsonStringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: "sts:AssumeRole",
          Principal: {
            Service: "vpc-flow-logs.amazonaws.com",
          },
        },
      ],
    }),
    inlinePolicies: [
      {
        name: `${infraConfigResouces.idPrefix}-flow-log-iap-${$app.stage}`,
        policy: $jsonStringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams",
              ],
              Resource: ["*"],
            }
          ],
        }),
      },
    ],
  },
);

export const iamResouces = {
  vpcFlowLogRole
};