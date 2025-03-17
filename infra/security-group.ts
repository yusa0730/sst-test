import { infraConfigResouces } from "./infra-config";
import { vpcResources } from "./vpc";

console.log("======security-gourp.ts start======");

const albSecurityGroup = new aws.ec2.SecurityGroup(
  `${infraConfigResouces.idPrefix}-alb-sg-${$app.stage}`,
  {
    name: `${infraConfigResouces.idPrefix}-alb-sg-${$app.stage}`,
    vpcId: vpcResources.vpc.id,
    description: "alb security group",
    ingress: [
      {
        fromPort: 443,
        toPort: 443,
        protocol: aws.ec2.ProtocolType.TCP,
        cidrBlocks: ["0.0.0.0/0"],
        description: "From Internet to ALB",
      },
    ],
    tags: {
      Name: `${infraConfigResouces.idPrefix}-alb-sg-${$app.stage}`,
    }
  },
)

// Fargate用セキュリティグループ
const ecsSecurityGroup = new aws.ec2.SecurityGroup(
  `${infraConfigResouces.idPrefix}-ecs-sg-${$app.stage}`,
  {
    name: `${infraConfigResouces.idPrefix}-ecs-sg-${$app.stage}`,
    vpcId: vpcResources.vpc.id,
    description: "bff fargate security group",
    ingress: [
      {
        fromPort: 3000,
        toPort: 3000,
        protocol: aws.ec2.ProtocolType.TCP,
        securityGroups: [albSecurityGroup.id],
        description: "From ALB to Fargate",
      },
    ],
    tags: {
      Name: `${infraConfigResouces.idPrefix}-ecs-sg-${$app.stage}`,
    }
  },
);

export const securityGroupResources = {
  albSecurityGroup,
  ecsSecurityGroup,
}