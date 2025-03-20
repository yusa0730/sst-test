import { infraConfigResouces } from "./infra-config";
import { vpcResources } from "./vpc";
import { cloudwatchResources } from "./cloudwatch";
import { iamResouces } from "./iam";
import { securityGroupResources } from "./security-group";
import { albResources } from "./alb";
import { ecrResources } from "./ecr";

console.log("======ecs.ts start======");

// ECS Cluster
const cluster = new sst.aws.Cluster.v1(
	`${infraConfigResouces.idPrefix}-cluster-${$app.stage}`,
	{
		vpc: {
			id: vpcResources.vpc.id,
			publicSubnets: vpcResources.publicSubnets.map((subnet) => subnet.id),
			privateSubnets: vpcResources.privateSubnets.map((subnet) => subnet.id),
			securityGroups: [securityGroupResources.ecsSecurityGroup.id],
		},
		transform: {
			cluster: {
				name: `${infraConfigResouces.idPrefix}-cluster-${$app.stage}`,
				settings: [
					{
							name: "containerInsights",
							value: "enhanced",
					},
				],
			},
		},
	}
);

ecrResources.repository.repositoryUrl.apply((url) => {
  // ECS Service
  cluster.addService(`${infraConfigResouces.idPrefix}-service-${$app.stage}`, {
      cpu: "0.25 vCPU",
      memory: "0.5 GB",
      storage: "21 GB",
      architecture: "x86_64",
      scaling: {
        min: 2,
        max: 2,
        cpuUtilization: 70,
        memoryUtilization: 70,
      },
      transform: {
        image: {
          push: true,
          tags: [`${url}:latest`],
          // registries: [registryInfo],
          dockerfile: {
              location: "../../hono-app/Dockerfile", // Path to Dockerfile
          },
          context: {
              location: "../../hono-app", // Path to application source code
          },
        },
        service: {
          name: `${infraConfigResouces.idPrefix}-service-${$app.stage}`,
          enableExecuteCommand: true,
          healthCheckGracePeriodSeconds: 180,
          forceNewDeployment: true,
          loadBalancers: [
            {
              containerName: `${infraConfigResouces.idPrefix}-service-${$app.stage}`,
              containerPort: 3000,
              targetGroupArn: albResources.targetGroup.arn,
            },
          ],
        },
        taskDefinition: {
          executionRoleArn: iamResouces.taskExecutionRole.arn,
          containerDefinitions: $jsonStringify([
            {
              name: `${infraConfigResouces.idPrefix}-service-${$app.stage}`,
              image: `${infraConfigResouces.awsAccountId}.dkr.ecr.${infraConfigResouces.mainRegion}.amazonaws.com/${infraConfigResouces.idPrefix}-ecr-repository-${$app.stage}:latest`,
              portMappings: [
                {
                  containerPort: 3000,
                  protocol: "tcp",
                },
              ],
              logConfiguration: {
                logDriver: "awslogs",
                options: {
                  "awslogs-region": infraConfigResouces.mainRegion,
                  "awslogs-group": `${cloudwatchResources.ecsLog.name}`,
                  "awslogs-stream-prefix": "backend",
                },
              },
              environment: [
                {
                  name: "MODE",
                  value: $app.stage,
                },
              ],
            },
          ]),
        }
      }
    });
  });


// 2. Retrieve the ECR authentication token
// const authToken = aws.ecr.getAuthorizationToken({});
// const registryInfo = {
//     address: ecrResources.repository.repositoryUrl,
//     username: authToken.then(token => "AWS"),
//     password: authToken.then(token => token.password),
// };

// ecrResources.repository.name.apply(async (name) => {
//   // 取得した最新のバージョンを適用
//   const recentImage = await aws.ecr.getImage({
//       repositoryName: name,
//       mostRecent: true
//   }).catch((e) => {
//     console.error(e);

//     return "v1"
//   });

//   const newTag = getLatestTag(recentImage);

//   console.log("=====newTag======", newTag);
//   ecrResources.repository.repositoryUrl.apply((url) => {
//   // ECS Service
//   cluster.addService(`${infraConfigResouces.idPrefix}-service-${$app.stage}`, {
//       cpu: "0.25 vCPU",
//       memory: "0.5 GB",
//       storage: "21 GB",
//       architecture: "x86_64",
//       scaling: {
//         min: 2,
//         max: 2,
//         cpuUtilization: 70,
//         memoryUtilization: 70,
//       },
//       transform: {
//         image: {
//           push: true,
//           tags: [
//             `${url}:${newTag}`,
//           ],
//           // registries: [registryInfo],
//           dockerfile: {
//               location: "../../hono-app/Dockerfile", // Path to Dockerfile
//           },
//           context: {
//               location: "../../hono-app", // Path to application source code
//           },
//         },
//         service: {
//           name: `${infraConfigResouces.idPrefix}-service-${$app.stage}`,
//           enableExecuteCommand: true,
//           healthCheckGracePeriodSeconds: 180,
//           forceNewDeployment: true,
//           loadBalancers: [
//             {
//               containerName: `${infraConfigResouces.idPrefix}-service-${$app.stage}`,
//               containerPort: 3000,
//               targetGroupArn: albResources.targetGroup.arn,
//             },
//           ],
//         },
//         taskDefinition: {
//           executionRoleArn: iamResouces.taskExecutionRole.arn,
//           containerDefinitions: $jsonStringify([
//             {
//               name: `${infraConfigResouces.idPrefix}-service-${$app.stage}`,
//               image: `${infraConfigResouces.awsAccountId}.dkr.ecr.${infraConfigResouces.mainRegion}.amazonaws.com/${infraConfigResouces.idPrefix}-ecr-repository-${$app.stage}:${newTag}`,
//               portMappings: [
//                 {
//                   containerPort: 3000,
//                   protocol: "tcp",
//                 },
//               ],
//               logConfiguration: {
//                 logDriver: "awslogs",
//                 options: {
//                   "awslogs-region": infraConfigResouces.mainRegion,
//                   "awslogs-group": `/aws/ecs/service/${infraConfigResouces.idPrefix}-${$app.stage}`,
//                   "awslogs-stream-prefix": "/aws/ecs/service",
//                 },
//               },
//               environment: [
//                 {
//                   name: "MODE",
//                   value: $app.stage,
//                 },
//               ],
//             },
//           ]),
//         }
//       }
//     });
//   });
// });

export const fargateResources = {
  cluster
};

function getLatestTag(recentImage): string {
    try {
        // 最新のイメージ情報を取得
        console.log("====recentImage===", recentImage);

        // 取得したイメージにタグがあるか確認
        const tags = recentImage.imageTags.flatMap(tag => tag || []) || [];

        // タグが数値のみならバージョンアップ、それ以外なら v1
        const versionNumbers = tags
            .map(tag => parseInt(tag.replace("v", ""), 10)) // "v1" → 1 に変換
            .filter(n => !isNaN(n)); // NaN（数字以外）を除外

        console.log(versionNumbers);

        // 最新のバージョン番号を取得して +1
        const nextVersion = versionNumbers.length ? Math.max(...versionNumbers) + 1 : 1;
        return `v${nextVersion}`;
    } catch (error) {
        console.error("Failed to get latest ECR image tag:", error);
        return "v1"; // デフォルトのバージョン
    }
};