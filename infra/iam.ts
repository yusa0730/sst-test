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

// タスク実行ロール
const taskExecutionRole = new aws.iam.Role(
  `${infraConfigResouces.idPrefix}-task-execution-role-${$app.stage}`,
  {
    name: `${infraConfigResouces.idPrefix}-task-execution-role-${$app.stage}`,
    assumeRolePolicy: $jsonStringify({
      Version: "2012-10-17",
      Statement: [
        {
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "ecs-tasks.amazonaws.com",
          },
        },
      ],
    }),
    managedPolicyArns: [
      "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
    ],
    // inlinePolicies: [
    //   {
    //     name: `${infraConfigResouces.idPrefix}-build-service-role-policy-${$app.stage}`,
    //     policy: $jsonStringify({
    //       Version: "2012-10-17",
    //       Statement: [
    //         {
    //           Effect: "Allow",
    //           Action: [
    //             "secretsmanager:GetSecretValue",
    //             "secretsmanager:PutResourcePolicy",
    //             "secretsmanager:PutSecretValue",
    //             "secretsmanager:DeleteSecret",
    //             "secretsmanager:DescribeSecret",
    //             "secretsmanager:TagResource",
    //           ],
    //           Resource: `arn:aws:secretsmanager:${infraConfigResouces.mainRegion}:${env.awsAccount}:secret:rds!cluster*`,
    //         },
    //       ],
    //     }),
    //   },
    // ],
    tags: {
      Name: `${infraConfigResouces.idPrefix}-task-execution-role-${$app.stage}`,
    },
  },
);

export const iamResouces = {
  vpcFlowLogRole,
  taskExecutionRole
};