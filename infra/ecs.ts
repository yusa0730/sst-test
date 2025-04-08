import { infraConfigResouces } from "./infra-config";
import { vpcResources } from "./vpc";
import { cloudwatchResources } from "./cloudwatch";
import { iamResouces } from "./iam";
import { securityGroupResources } from "./security-group";
import { albResources } from "./alb";

console.log("======ecs.ts start======");

const cluster = new aws.ecs.Cluster(
	`${infraConfigResouces.idPrefix}-ecs-cluster-${$app.stage}`,
	{
		name: `${infraConfigResouces.idPrefix}-ecs-cluster-${$app.stage}`,
		settings: [{
			name: "containerInsights",
			value: "enabled"
		}],
	}
);

const taskDefinition = new aws.ecs.TaskDefinition(
	`${infraConfigResouces.idPrefix}-service-${$app.stage}`,
	{
		family: `${infraConfigResouces.idPrefix}-service-${$app.stage}`,
		executionRoleArn: iamResouces.taskExecutionRole.arn,
		taskRoleArn: iamResouces.taskExecutionRole.arn,
		cpu: "0.25 vCPU",
		memory: "0.5 GB",
		requiresCompatibilities: ["FARGATE"],
		networkMode: "awsvpc",
		runtimePlatform: {
			operatingSystemFamily: "LINUX",
			cpuArchitecture: "X86_64"
		},
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
						"awslogs-group": cloudwatchResources.ecsLog.id,
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
)

const service = new aws.ecs.Service(
	`${infraConfigResouces.idPrefix}-ecs-service-${$app.stage}`,
	{
		name: `${infraConfigResouces.idPrefix}-ecs-service-${$app.stage}`,
		cluster: cluster.id,
		taskDefinition: taskDefinition.arn,
		healthCheckGracePeriodSeconds: 180,
		desiredCount: 1,
		launchType: "FARGATE",
		enableExecuteCommand: true,
		networkConfiguration: {
			subnets: vpcResources.privateSubnets.map((subnet) => subnet.id),
			assignPublicIp: false,
			securityGroups: [securityGroupResources.ecsSecurityGroup.id],
		},
		loadBalancers: [
			{
				containerName: `${infraConfigResouces.idPrefix}-service-${$app.stage}`,
				containerPort: 3000,
				targetGroupArn: albResources.targetGroup.arn,
			},
		],
	}
);

export const fargateResources = {
  cluster,
	service
};

// ============以下はSSTで成功したコード============
// const rds = sst.aws.Postgres.v1.get(
//   `${idPrefix}-rds-${$app.stage}`,
//   rdsClusterId.value,
// );
// const rdsCluster = aws.rds.getCluster({
//   clusterIdentifier: rdsClusterId.value,
// });
// const writerEndPoint = rdsCluster.then((cluster) => cluster.endpoint);
// const readerEndPoint = rdsCluster.then((cluster) => cluster.readerEndpoint);

// // ECS Cluster
// const cluster = new sst.aws.Cluster.v1(
// 	`${infraConfigResouces.idPrefix}-cluster-${$app.stage}`,
// 	{
// 		vpc: {
// 			id: vpcResources.vpc.id,
// 			publicSubnets: vpcResources.publicSubnets.map((subnet) => subnet.id),
// 			privateSubnets: vpcResources.privateSubnets.map((subnet) => subnet.id),
// 			securityGroups: [securityGroupResources.ecsSecurityGroup.id],
// 		},
// 		transform: {
// 			cluster: {
// 				name: `${infraConfigResouces.idPrefix}-cluster-${$app.stage}`,
// 				settings: [
// 					{
// 							name: "containerInsights",
// 							value: "enhanced",
// 					},
// 				],
// 			},
// 		},
// 	}
// );

// // ECS Service
// cluster.addService(`${infraConfigResouces.idPrefix}-service-${$app.stage}`, {
//   cpu: "0.25 vCPU",
//   memory: "0.5 GB",
//   storage: "21 GB",
//   // architecture: "amd64",
// 	architecture: "x86_64",
// 	// image: {
// 	// 	context: "./hono-app",
// 	// 	dockerfile: "./hono-app/Dockerfile",
// 	// },
// 	// image: {},
//   scaling: {
//     min: 1,
//     max: 1,
//     cpuUtilization: 70,
//     memoryUtilization: 70,
//   },
//   transform: {
// 		image: {
// 			push: false,
// 			buildOnPreview: false
// 		},
//     service: {
//       name: `${infraConfigResouces.idPrefix}-service-${$app.stage}`,
//       enableExecuteCommand: true,
//       healthCheckGracePeriodSeconds: 180,
//       // availabilityZoneRebalancing: "ENABLED",
//       loadBalancers: [
//         {
//           containerName: `${infraConfigResouces.idPrefix}-service-${$app.stage}`,
//           containerPort: 3000,
//           targetGroupArn: albResources.targetGroup.arn,
//         },
//       ],
//     },
//     taskDefinition: {
//       executionRoleArn: iamResouces.taskExecutionRole.arn,
// 			containerDefinitions: $jsonStringify([
// 						{
// 							name: `${infraConfigResouces.idPrefix}-service-${$app.stage}`,
// 							image: `${infraConfigResouces.awsAccountId}.dkr.ecr.${infraConfigResouces.mainRegion}.amazonaws.com/${infraConfigResouces.idPrefix}-ecr-repository-${$app.stage}:latest`,
// 							portMappings: [
// 								{
// 									containerPort: 3000,
// 									protocol: "tcp",
// 								},
// 							],
// 							logConfiguration: {
// 								logDriver: "awslogs",
// 								options: {
// 									"awslogs-region": infraConfigResouces.mainRegion,
// 									"awslogs-group": `/aws/ecs/service/${infraConfigResouces.idPrefix}-${$app.stage}`,
// 									"awslogs-stream-prefix": "/aws/ecs/service",
// 								},
// 							},
// 							environment: [
// 								{
// 									name: "MODE",
// 									value: $app.stage,
// 								},
// 							],
// 						},
// 					]),
// 				}
// 	}
// });