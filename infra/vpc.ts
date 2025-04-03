import { infraConfigResouces } from "./infra-config";
import { iamResouces } from "./iam";
import { cloudwatchResources } from "./cloudwatch";

console.log("======vpc.ts start======");
const publicSubnets = [];
const privateSubnets = [];
const protectedSubnets = [];

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

// public
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

const publicSubnet1a = new aws.ec2.Subnet(
  `${infraConfigResouces.idPrefix}-public-subnet-1a-${$app.stage}`,
  {
    vpcId: vpc.id,
    cidrBlock: `10.0.0.0/24`,
    availabilityZone: "ap-northeast-1a",
    tags: {
      Name: `${infraConfigResouces.idPrefix}-public-subnet-1a-${$app.stage}`
    }
  }
);
publicSubnets.push(publicSubnet1a);

new aws.ec2.RouteTableAssociation(
  `${infraConfigResouces.idPrefix}-public-route-table-association-1a-${$app.stage}`,
  {
    routeTableId: publicRouteTable.id,
    subnetId: publicSubnet1a.id
  }
);

const publicSubnet1c = new aws.ec2.Subnet(
  `${infraConfigResouces.idPrefix}-public-subnet-1c-${$app.stage}`,
  {
    vpcId: vpc.id,
    cidrBlock: `10.0.1.0/24`,
    availabilityZone: "ap-northeast-1c",
    tags: {
      Name: `${infraConfigResouces.idPrefix}-public-subnet-1c-${$app.stage}`
    }
  }
);
publicSubnets.push(publicSubnet1c);

new aws.ec2.RouteTableAssociation(
  `${infraConfigResouces.idPrefix}-public-route-table-association-1c-${$app.stage}`,
  {
    routeTableId: publicRouteTable.id,
    subnetId: publicSubnet1c.id
  }
);

// eip&Nat Gateway
const eip1a = new aws.ec2.Eip(
  `${infraConfigResouces.idPrefix}-eip-1a-${$app.stage}`,
  {
    domain: "vpc",
    tags: {
      Name: `${infraConfigResouces.idPrefix}-eip-1a-${$app.stage}`,
    }
  }
);

const natGateway1a = new aws.ec2.NatGateway(
  `${infraConfigResouces.idPrefix}-ngw-1a-${$app.stage}`,
  {
    allocationId: eip1a.id,
    subnetId: publicSubnet1a.id,
    tags: {
      Name: `${infraConfigResouces.idPrefix}-ngw-1a-${$app.stage}`,
    },
  },
);

// const eip1c = new aws.ec2.Eip(
//   `${infraConfigResouces.idPrefix}-eip-1c-${$app.stage}`,
//   {
//     domain: "vpc",
//     tags: {
//       Name: `${infraConfigResouces.idPrefix}-eip-1c-${$app.stage}`,
//     }
//   }
// );

// const natGateway1c = new aws.ec2.NatGateway(
//   `${infraConfigResouces.idPrefix}-ngw-1c-${$app.stage}`,
//   {
//     allocationId: eip1c.id,
//     subnetId: publicSubnet1a.id,
//     tags: {
//       Name: `${infraConfigResouces.idPrefix}-ngw-1c-${$app.stage}`,
//     },
//   },
// );

// private
const privateRouteTable1a = new aws.ec2.RouteTable(
  `${infraConfigResouces.idPrefix}-private-rtb-1a-${$app.stage}`,
  {
    vpcId: vpc.id,
    tags: {
      Name: `${infraConfigResouces.idPrefix}-private-rtb-1a-${$app.stage}`
    }
  }
);

const privateRouteTable1c = new aws.ec2.RouteTable(
  `${infraConfigResouces.idPrefix}-private-rtb-1c-${$app.stage}`,
  {
    vpcId: vpc.id,
    tags: {
      Name: `${infraConfigResouces.idPrefix}-private-rtb-1c-${$app.stage}`
    }
  }
);

const privateSubnet1a = new aws.ec2.Subnet(
  `${infraConfigResouces.idPrefix}-private-subnet-1a-${$app.stage}`,
  {
    vpcId: vpc.id,
    cidrBlock: `10.0.10.0/24`,
    availabilityZone: "ap-northeast-1a",
    tags: {
      Name: `${infraConfigResouces.idPrefix}-private-subnet-1a-${$app.stage}`
    }
  }
);
privateSubnets.push(privateSubnet1a);

new aws.ec2.RouteTableAssociation(
  `${infraConfigResouces.idPrefix}-private-route-table-association-1a-${$app.stage}`,
  {
    routeTableId: privateRouteTable1a.id,
    subnetId: privateSubnet1a.id
  }
);

const privateSubnet1c = new aws.ec2.Subnet(
  `${infraConfigResouces.idPrefix}-private-subnet-1c-${$app.stage}`,
  {
    vpcId: vpc.id,
    cidrBlock: `10.0.11.0/24`,
    availabilityZone: "ap-northeast-1c",
    tags: {
      Name: `${infraConfigResouces.idPrefix}-private-subnet-1c-${$app.stage}`
    }
  }
);
privateSubnets.push(privateSubnet1c);

new aws.ec2.RouteTableAssociation(
  `${infraConfigResouces.idPrefix}-private-route-table-association-1c-${$app.stage}`,
  {
    routeTableId: privateRouteTable1c.id,
    subnetId: privateSubnet1c.id
  }
);

// new aws.ec2.Route(
//   `${infraConfigResouces.idPrefix}-private-default-route-1a-${$app.stage}`,
//   {
//     routeTableId: privateRouteTable1a.id,
//     natGatewayId: natGateway1a.id,
//     destinationCidrBlock: "0.0.0.0/0"
//   }
// )

// new aws.ec2.Route(
//   `${infraConfigResouces.idPrefix}-private-default-route-1c-${$app.stage}`,
//   {
//     routeTableId: privateRouteTable1c.id,
//     natGatewayId: natGateway1a.id,
//     destinationCidrBlock: "0.0.0.0/0"
//   }
// )

const protectedRouteTable1a = new aws.ec2.RouteTable(
  `${infraConfigResouces.idPrefix}-protected-rtb-1a-${$app.stage}`,
  {
    vpcId: vpc.id,
    tags: {
      Name: `${infraConfigResouces.idPrefix}-protected-rtb-1a-${$app.stage}`
    }
  }
);

new aws.ec2.Route(
  `${infraConfigResouces.idPrefix}-protected-default-route-1a-${$app.stage}`,
  {
    routeTableId: protectedRouteTable1a.id,
    gatewayId: natGateway1a.id,
    destinationCidrBlock: "0.0.0.0/0"
  }
)

const protectedRouteTable1c = new aws.ec2.RouteTable(
  `${infraConfigResouces.idPrefix}-protected-rtb-1c-${$app.stage}`,
  {
    vpcId: vpc.id,
    tags: {
      Name: `${infraConfigResouces.idPrefix}-protected-rtb-1c-${$app.stage}`
    }
  }
);

new aws.ec2.Route(
  `${infraConfigResouces.idPrefix}-protected-default-route-1c-${$app.stage}`,
  {
    routeTableId: protectedRouteTable1c.id,
    gatewayId: natGateway1a.id,
    destinationCidrBlock: "0.0.0.0/0"
  }
)

const protectedSubnet1a = new aws.ec2.Subnet(
  `${infraConfigResouces.idPrefix}-protected-subnet-1a-${$app.stage}`,
  {
    vpcId: vpc.id,
    cidrBlock: `10.0.20.0/24`,
    availabilityZone: "ap-northeast-1a",
    tags: {
      Name: `${infraConfigResouces.idPrefix}-protected-subnet-1a-${$app.stage}`
    }
  }
);
protectedSubnets.push(protectedSubnet1a);

new aws.ec2.RouteTableAssociation(
  `${infraConfigResouces.idPrefix}-protected-route-table-association-1a-${$app.stage}`,
  {
    routeTableId: protectedRouteTable1a.id,
    subnetId: protectedSubnet1a.id
  }
);

const protectedSubnet1c = new aws.ec2.Subnet(
  `${infraConfigResouces.idPrefix}-protected-subnet-1c-${$app.stage}`,
  {
    vpcId: vpc.id,
    cidrBlock: `10.0.21.0/24`,
    availabilityZone: "ap-northeast-1c",
    tags: {
      Name: `${infraConfigResouces.idPrefix}-protected-subnet-1c-${$app.stage}`
    }
  }
);
protectedSubnets.push(protectedSubnet1c);

new aws.ec2.RouteTableAssociation(
  `${infraConfigResouces.idPrefix}-protected-route-table-association-1c-${$app.stage}`,
  {
    routeTableId: protectedRouteTable1c.id,
    subnetId: protectedSubnet1c.id
  }
);

export const vpcResources = {
  vpc,
  publicSubnets,
  privateSubnets,
  protectedSubnets
};