import { infraConfigResouces } from "./infra-config";
import { iamResouces } from "./iam";
import { cloudwatchResources } from "./cloudwatch";

console.log("======vpc.ts start======");

const vpc = new aws.ec2.Vpc(
  `${infraConfigResouces.idPrefix}-vpc-${$app.stage}`,
  {
    cidrBlock: "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
      Name: `${infraConfigResouces.idPrefix}-vpc-${$app.stage}`
    }
  }
);

new aws.ec2.FlowLog(
  `${infraConfigResouces.idPrefix}-vpc-flow-log-${$app.stage}`,
  {
    iamRoleArn: iamResouces.vpcFlowLogRole.arn,
    logDestination: cloudwatchResources.vpcFlowLog.arn,
    trafficType: "ALL",
    vpcId: vpc.id
  }
);

const internetGateway = new aws.ec2.InternetGateway(
  `${infraConfigResouces.idPrefix}-igw-${$app.stage}`,
  {
    vpcId: vpc.id,
    tags: {
      Name: `${infraConfigResouces.idPrefix}-igw-${$app.stage}`
    }
  }
);

const publicRouteTable = new aws.ec2.RouteTable(
  `${infraConfigResouces.idPrefix}-public-rtb-${$app.stage}`,
  {
    vpcId: vpc.id,
    tags: {
      Name: `${infraConfigResouces.idPrefix}-public-rtb-${$app.stage}`
    }
  }
);

new aws.ec2.Route(
  `${infraConfigResouces.idPrefix}-public-default-route-${$app.stage}`,
  {
    routeTableId: publicRouteTable.id,
    gatewayId: internetGateway.id,
    destinationCidrBlock: "0.0.0.0/0"
  }
)

const availabilityZones = [
  `${infraConfigResouces.mainRegion}a`,
  `${infraConfigResouces.mainRegion}c`
];

const azs = [
  "a",
  "c"
]

const publicSubnets = [];
for (let i = 0; i < 2; i++) {
  const publicSubnet = new aws.ec2.Subnet(
    `${infraConfigResouces.idPrefix}-public-subnet-1${azs[i]}-${$app.stage}`,
    {
      vpcId: vpc.id,
      cidrBlock: `10.0.${i * 10}.0/24`,
      availabilityZone: availabilityZones[i],
      tags: {
        Name: `${infraConfigResouces.idPrefix}-public-subnet-1${azs[i]}-${$app.stage}`
      }
    }
  );

  new aws.ec2.RouteTableAssociation(
    `${infraConfigResouces.idPrefix}-public-route-table-association-1${azs[i]}-${$app.stage}`,
    {
      routeTableId: publicRouteTable.id,
      subnetId: publicSubnet.id
    }
  );

  publicSubnets.push(publicSubnet);
};

export const vpcResources = {
  vpc,
  publicSubnets
};