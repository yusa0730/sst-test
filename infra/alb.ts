import { infraConfigResouces } from "./infra-config";
import { vpcResources } from "./vpc";
import { securityGroupResources } from "./security-group";
import { s3Resouces } from "./s3";
import { acmResouces } from "./acm";

console.log("======alb.ts start======");

const alb = new aws.lb.LoadBalancer(
  `${infraConfigResouces.idPrefix}-alb-${$app.stage}`,
  {
    name: `${infraConfigResouces.idPrefix}-alb-${$app.stage}`,
    loadBalancerType: "application",
    internal: true,
    subnets: vpcResources.privateSubnets.map((subnet) => subnet.id),
    securityGroups: [securityGroupResources.albSecurityGroup.id],
    accessLogs: {
      bucket: s3Resouces.albAccessLogBucket.id,
      enabled: true,
    },
    connectionLogs: {
      bucket: s3Resouces.albConnectionLogBucket.id,
      enabled: true,
    },
    tags: {
      Name: `${infraConfigResouces.idPrefix}-alb-${$app.stage}`,
    },
  },
);


const targetGroup = new aws.lb.TargetGroup(
  `${infraConfigResouces.idPrefix}-tg-${$app.stage}`,
  {
    name: `${infraConfigResouces.idPrefix}-tg-${$app.stage}`,
    targetType: "ip",
    port: 3000,
    protocol: "HTTP",
    vpcId: vpcResources.vpc.id,
    healthCheck: {
      enabled: true,
      path: "/",
      port: "traffic-port",
      protocol: "HTTP",
      healthyThreshold: 5,
      unhealthyThreshold: 2,
      interval: 30,
      timeout: 5,
      matcher: "200",
    },
    tags: {
      Name: `${infraConfigResouces.idPrefix}-tg-${$app.stage}`,
    }
  }
);

const httpsListener = new aws.lb.Listener(
  `${infraConfigResouces.idPrefix}-https-listener-${$app.stage}`,
  {
    loadBalancerArn: alb.arn,
    port: 443,
    protocol: "HTTPS",
    certificateArn: acmResouces.albCertificate.arn,
    sslPolicy: "ELBSecurityPolicy-TLS13-1-2-2021-06",
    defaultActions: [
      {
        type: "fixed-response",
        fixedResponse: {
          contentType: "text/plain",
          statusCode: "404",
          messageBody: "404 Not Found",
        },
      },
    ],
    tags: {
      Name: `${infraConfigResouces.idPrefix}-https-listener-${$app.stage}`,
    },
  },
);

new aws.lb.ListenerRule(
  `${infraConfigResouces.idPrefix}-https-listener-rule-${$app.stage}`,
  {
    listenerArn: httpsListener.arn,
    priority: 1,
    conditions: [
      {
        httpHeader: {
          httpHeaderName: "X-Custom-Header",
          values: [`${infraConfigResouces.idPrefix}-cloudfront`],
        },
      },
    ],
    actions: [
      {
        type: "forward",
        targetGroupArn: targetGroup.arn
      },
    ],
  }
);

//// =========CloudFrontを利用しない場合コメントアウト外す============
// const httpListener = new aws.lb.Listener(
//   `${infraConfigResouces.idPrefix}-http-listener-${$app.stage}`,
//   {
//     loadBalancerArn: alb.arn,
//     port: 80,
//     protocol: "HTTP",
//     defaultActions: [
//       {
//         type: "redirect",
//         redirect: {
//           port: "443",
//           protocol: "HTTPS",
//           statusCode: "HTTP_301"
//         },
//       },
//     ],
//     tags: {
//       Name: `${infraConfigResouces.idPrefix}-http-listener-${$app.stage}`,
//     },
//   },
// );

// new aws.lb.ListenerRule(
//   `${infraConfigResouces.idPrefix}-http-listener-rule-${$app.stage}`,
//   {
//     listenerArn: httpListener.arn,
//     priority: 1,
//     conditions: [
//       {
//         httpHeader: {
//           httpHeaderName: "X-Custom-Header",
//           values: [`${infraConfigResouces.idPrefix}-cloudfront`],
//         },
//       },
//     ],
//     actions: [
//       {
//         type: "forward",
//         targetGroupArn: targetGroup.arn
//       },
//     ],
//   }
// );

//// cloudfrontを利用しない場合は以下のコメントアウトを外す
// new aws.route53.Record(
//   `${infraConfigResouces.idPrefix}-alb-a-record-${$app.stage}`,
//   {
//     zoneId: infraConfigResouces.hostedZone.zoneId,
//     name: infraConfigResouces.domainName,
//     type: aws.route53.RecordType.A,
//     aliases: [
//       {
//         name: alb.dnsName,
//         zoneId: alb.zoneId,
//         evaluateTargetHealth: true
//       },
//     ],
//   }
// );
//// =========CloudFrontを利用しない場合はコメントアウト外す============

export const albResources = {
  alb,
  // httpListener,
  httpsListener,
  targetGroup
};