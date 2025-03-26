import { infraConfigResouces } from "./infra-config";
import { s3Resouces } from "./s3";

console.log("======cloudfront.ts start=======");

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

const encodedPublicKey = await aws.ssm.getParameter({
    name: "/sst-test/encodedPublicKey",
    withDecryption: true, // 暗号化されている場合は復号化
}).then(param => param.value);

// const publicKey = new aws.cloudfront.PublicKey(
//   `${infraConfigResouces.idPrefix}-public-key-${$app.stage}`,
//   {
//     name: `${infraConfigResouces.idPrefix}-public-key-${$app.stage}`,
//     comment: `${infraConfigResouces.idPrefix} public key for ${$app.stage}`,
//     encodedKey: encodedPublicKey,
//   }
// );

// const keyGroup = new aws.cloudfront.KeyGroup(
//   `${infraConfigResouces.idPrefix}-key-group-${$app.stage}`,
//   {
//     name: `${infraConfigResouces.idPrefix}-key-group-${$app.stage}`,
//     comment: `${infraConfigResouces.idPrefix} key group for ${$app.stage}`,
//     items: [publicKey.id],
//   }
// );

const cdn = new sst.aws.StaticSite(
  `${infraConfigResouces.idPrefix}-${$app.stage}`,
  {
    domain: infraConfigResouces.domainName,
    invalidation: {
      paths: "all",
      wait: true,
    },
    transform: {
      cdn(args, opts, name) {
        args.origins = [
          ...((args.origins as aws.types.input.cloudfront.DistributionOrigin[]) ?? []),
          {
            originId: `${infraConfigResouces.idPrefix}-s3-${$app.stage}`,
            originAccessControlId: originAccessControlS3.id,
            domainName: s3Resouces.uploadCdnBucket.bucketDomainName,
          },
        ];
        args.defaultCacheBehavior = {
          ...(args.defaultCacheBehavior as aws.types.input.cloudfront.DistributionDefaultCacheBehavior),
        };
        // args.orderedCacheBehaviors = [
        //   ...((args.orderedCacheBehaviors as aws.types.input.cloudfront.DistributionOrderedCacheBehavior[]) ?? []),
        //   {
        //     allowedMethods: ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
        //     cachedMethods: ["GET", "HEAD"],
        //     defaultTtl: 0,
        //     maxTtl: 0,
        //     minTtl: 0,
        //     forwardedValues: {
        //       cookies: {
        //         forward: "none",
        //       },
        //       headers: ["X-Authorization"],
        //       queryString: true,
        //     },
        //     responseHeadersPolicyId: responseHeadersPolicy.id,
        //     pathPattern: "/upload/*",
        //     targetOriginId: `${infraConfigResouces.idPrefix}-s3-${$app.stage}`,
        //     viewerProtocolPolicy: "redirect-to-https",
        //     trustedKeyGroups: [keyGroup.id],
        //   },
        // ];
      },
    }
  },
);

// upload bucketにオリジンアクセスの許可をする
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
              "AWS:SourceArn": cdn.nodes.cdn?.nodes.distribution.arn,
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

// ssm登録
// new aws.ssm.Parameter(
//   `${infraConfigResouces.idPrefix}-publicKey-${$app.stage}`,
//   {
//     name: `/${infraConfigResouces.idPrefix}/publicKey/${$app.stage}`,
//     type: "String",
//     value: publicKey.id,
//   }
// );



