import { infraConfigResouces } from "./infra-config";

console.log("======waf.ts start=======");

// Wafカスタムルールを作成
const wafCustomRule = new aws.wafv2.RuleGroup(
  `${infraConfigResouces.idPrefix}-waf-custom-rule-${$app.stage}`,
  {
    name: `${infraConfigResouces.idPrefix}-waf-custom-rule-${$app.stage}`,
    description: "Waf custom rule for satto admin marketing cdn",
    capacity: 1,
    scope: "CLOUDFRONT",
    visibilityConfig: {
      cloudwatchMetricsEnabled: true,
      metricName: `${infraConfigResouces.idPrefix}-waf-custom-rule-${$app.stage}`,
      sampledRequestsEnabled: true,
    },
    rules: [
      {
        name: "LimitPayloadTo10MB",
        priority: 0,
        action: {
          block: {}, // 10MBを超える場合はブロック
        },
        statement: {
          sizeConstraintStatement: {
            fieldToMatch: {
              body: {
                oversizeHandling: "CONTINUE",
              },
            },
            comparisonOperator: "GT",
            size: 10485760, // 10MB in bytes
            textTransformations: [
              {
                priority: 0,
                type: "NONE",
              },
            ],
          },
        },
        visibilityConfig: {
          cloudwatchMetricsEnabled: true,
          metricName: "LimitPayloadTo10MB",
          sampledRequestsEnabled: true,
        },
      },
    ],
  },
  {
    provider: infraConfigResouces.awsUsEast1Provider,
  },
);

// Wafを作成
const waf = new aws.wafv2.WebAcl(
  `${infraConfigResouces.idPrefix}-waf-${$app.stage}`,
  {
    name: `${infraConfigResouces.idPrefix}-waf-${$app.stage}`,
    description: "Waf for satto memo desktop lts cdn",
    defaultAction: {
      allow: {},
    },
    scope: "CLOUDFRONT",
    visibilityConfig: {
      cloudwatchMetricsEnabled: true,
      metricName: `${infraConfigResouces.idPrefix}-waf-${$app.stage}`,
      sampledRequestsEnabled: true,
    },
    rules: [
      {
        name: "LimitPayloadSize",
        priority: 10,
        overrideAction: {
          none: {},
        },
        statement: {
          ruleGroupReferenceStatement: {
            arn: wafCustomRule.arn,
          },
        },
        visibilityConfig: {
          cloudwatchMetricsEnabled: true,
          metricName: "LimitPayloadSize",
          sampledRequestsEnabled: true,
        },
      },
      // AWSManagedRulesAmazonIpReputationList
      {
        name: "AWS-AWSManagedRulesAmazonIpReputationList",
        priority: 20,
        statement: {
          managedRuleGroupStatement: {
            vendorName: "AWS",
            name: "AWSManagedRulesAmazonIpReputationList",
          },
        },
        overrideAction: { none: {} },
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudwatchMetricsEnabled: true,
          metricName: "awsIpReputationList",
        },
      },
      // AWSManagedRulesAnonymousIpList
      {
        name: "AWS-AWSManagedRulesAnonymousIpList",
        priority: 30,
        statement: {
          managedRuleGroupStatement: {
            vendorName: "AWS",
            name: "AWSManagedRulesAnonymousIpList",
          },
        },
        overrideAction: { none: {} },
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudwatchMetricsEnabled: true,
          metricName: "awsAnonymousIpList",
        },
      },
    ],
  },
  {
    provider: infraConfigResouces.awsUsEast1Provider,
    dependsOn: [wafCustomRule],
  },
);

export const wafResources = {
  waf
}