import { albResources } from "./alb";
import { infraConfigResouces } from "./infra-config";
import { s3Resouces } from "./s3";
import { acmResouces } from "./acm";
import { wafResources } from "./waf";

console.log("======cloudfront.ts start=======");

const vpcOriginForAlb = new aws.cloudfront.VpcOrigin(
  `${infraConfigResouces.idPrefix}-vpc-origin-${$app.stage}`,
  {
    vpcOriginEndpointConfig: {
        arn: albResources.alb.arn,
        httpPort: 80,
        httpsPort: 443,
        name: `${infraConfigResouces.idPrefix}-vpc-origin-${$app.stage}`,
        originProtocolPolicy: "https-only",
        originSslProtocols: {
            items: ["TLSv1.2"],
            quantity: 1,
        },
    },
    timeouts: {
      create: "300s",
      delete: "300s",
      update: "300s",
    },
    tags: {
        Name: `${infraConfigResouces.idPrefix}-vpc-origin-${$app.stage}`,
    },
  }
);

const originAccessControlS3 = new aws.cloudfront.OriginAccessControl(
  `${infraConfigResouces.idPrefix}-origin-access-control-s3-${$app.stage}`,
  {
    name: `${infraConfigResouces.idPrefix}-origin-access-control-s3-${$app.stage}`,
    description: `${infraConfigResouces.idPrefix} origin access control for ${$app.stage}`,
    originAccessControlOriginType: "s3",
    signingBehavior: "always",
    signingProtocol: "sigv4",
  }
);

const responseHeadersPolicy = new aws.cloudfront.ResponseHeadersPolicy(
  `${infraConfigResouces.idPrefix}-response-headers-policy-${$app.stage}`,
  {
    name: `${infraConfigResouces.idPrefix}-response-headers-policy-${$app.stage}`,
    securityHeadersConfig: {
      strictTransportSecurity: {
        override: true,
        accessControlMaxAgeSec: 31536000,
        includeSubdomains: true,
      },
      frameOptions: {
        override: true,
        frameOption: "DENY",
      },
      xssProtection: {
        override: true,
        modeBlock: true,
        protection: true,
      },
      contentTypeOptions: {
        override: true,
      },
      referrerPolicy: {
        override: true,
        referrerPolicy: "strict-origin-when-cross-origin",
      },
    },
  },
);

// const uploadBucket = await aws.s3.getBucket({
//   bucket: `${infraConfigResouces.idPrefix}-upload-cdn-bucket-${$app.stage}`
// });

// const encodedPublicKey = new sst.Secret("ENCODED_PUBLIC_KEY");

// const encodedPublicKey = await aws.ssm.getParameter({
//   name: `/${infraConfigResouces.idPrefix}/encodedPublicKey`,
//   withDecryption: true, // 暗号化されている場合は復号化
// }).then(param => param.value);

// const keyGroupId = await aws.ssm.getParameter({
//   name: `/${infraConfigResouces.idPrefix}/cloudfront/${$app.stage}/keyGroup/id`,
//   withDecryption: true,
// }).then(param => param.value);

// vpc origin用
const cdn = new sst.aws.Cdn(
  `${infraConfigResouces.idPrefix}-${$app.stage}`,
  {
    // domain: infraConfigResouces.domainName,
    domain: {
      name: infraConfigResouces.domainName,
      dns: sst.aws.dns({
        zone: infraConfigResouces.hostedZone.zoneId
      }),
      cert: acmResouces.cloudfrontCertificate.arn
    },
    comment: `${infraConfigResouces.idPrefix}-cloudfront-${$app.stage}`,
    origins: [
      {
        originId: `${infraConfigResouces.idPrefix}-upload-s3-${$app.stage}`,
        originAccessControlId: originAccessControlS3.id,
        domainName: s3Resouces.uploadCdnBucket.bucketDomainName,
      },
      {
        originId: albResources.alb.id,
        domainName: albResources.alb.dnsName,
        vpcOriginConfig: {
          vpcOriginId: vpcOriginForAlb.id,
          originKeepaliveTimeout: 10,
          originReadTimeout: 10,
        },
        customHeaders: [{
            name: "X-Custom-Header",
            value: `${infraConfigResouces.idPrefix}-cloudfront`,
        }],
      }
    ],
    defaultCacheBehavior: {
      allowedMethods: [
          "DELETE",
          "GET",
          "HEAD",
          "OPTIONS",
          "PATCH",
          "POST",
          "PUT",
      ],
      cachedMethods: [
          "GET",
          "HEAD",
      ],
      targetOriginId: albResources.alb.id,
      // AllViewerExceptHostHeader
      originRequestPolicyId: "b689b0a8-53d0-40ab-baf2-68738e2966ac",
      // UseOriginCacheControlHeaders
      cachePolicyId: "83da9c7e-98b4-4e11-a168-04f0df8e2c65",
      viewerProtocolPolicy: "https-only",
      minTtl: 0,
      defaultTtl: 3600,
      maxTtl: 86400,
      responseHeadersPolicyId: responseHeadersPolicy.id,
      compress: true,
    },
    orderedCacheBehaviors: [
      {
        allowedMethods: ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
        cachedMethods: ["GET", "HEAD"],
        defaultTtl: 0,
        maxTtl: 0,
        minTtl: 0,
        forwardedValues: {
          cookies: {
            forward: "none",
          },
          headers: ["X-Authorization"],
          queryString: true,
        },
        responseHeadersPolicyId: responseHeadersPolicy.id,
        pathPattern: "/upload/*",
        targetOriginId: `${infraConfigResouces.idPrefix}-upload-s3-${$app.stage}`,
        viewerProtocolPolicy: "redirect-to-https",
        compress: true,
        // trustedKeyGroups: [keyGroupId],
      },
    ],
    transform: {
      distribution: {
        webAclId: wafResources.waf.arn,
        loggingConfig: {
          bucket: s3Resouces.cloudfrontLogBucket.bucketDomainName,
          prefix: `${infraConfigResouces.idPrefix}-${$app.stage}`,
        },
        enabled: true,
        restrictions: {
          geoRestriction: {
            restrictionType: "none",
          },
        },
      },
    }
  }
);

// 画像アップロードバケット用のバケットポリシー。cloudfront経由でのみGet、Putができるようにする
new aws.s3.BucketPolicy(
  `${infraConfigResouces.idPrefix}-store-bucket-policy-${$app.stage}`,
  {
    bucket: s3Resouces.uploadCdnBucket.bucket,
    policy: $jsonStringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Deny",
          Principal: "*",
          Action: "s3:*",
          Resource: [
            $interpolate`${s3Resouces.uploadCdnBucket.arn}`,
            $interpolate`${s3Resouces.uploadCdnBucket.arn}/*`,
          ],
          Condition: {
            Bool: {
              "aws:SecureTransport": "false",
            },
          },
        },
        {
          Effect: "Allow",
          Action: "s3:GetObject",
          Resource: $interpolate`${s3Resouces.uploadCdnBucket.arn}/*`,
          Principal: {
            Service: "cloudfront.amazonaws.com",
          },
          Condition: {
            StringEquals: {
              "AWS:SourceArn": cdn.nodes.distribution.arn,
            },
          },
        },
        {
          Effect: "Allow",
          Action: "s3:PutObject",
          Resource: $interpolate`${s3Resouces.uploadCdnBucket.arn}/*`,
          Principal: {
            Service: "cloudfront.amazonaws.com",
          },
          Condition: {
            StringEquals: {
              "AWS:SourceArn": cdn.nodes.distribution.arn,
            },
          },
        },
      ],
    }),
  },
  {
    dependsOn: [cdn],
  },
);
