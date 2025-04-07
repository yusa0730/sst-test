import { infraConfigResouces } from "./infra-config";

console.log("======s3.ts start======");

const albAccessLogBucket = new aws.s3.BucketV2(
  `${infraConfigResouces.idPrefix}-alb-access-log-bucket-${$app.stage}`,
  {
    bucket: `${infraConfigResouces.idPrefix}-alb-access-log-bucket-${$app.stage}`,
    forceDestroy: true,
    policy: $jsonStringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: {
            AWS: "arn:aws:iam::582318560864:root",
          },
          Action: "s3:PutObject",
          Resource: [
            `arn:aws:s3:::${infraConfigResouces.idPrefix}-alb-access-log-bucket-${$app.stage}/*`
          ],
        }
      ],
    }),
  },
);

const albConnectionLogBucket = new aws.s3.BucketV2(
  `${infraConfigResouces.idPrefix}-alb-connection-log-bucket-${$app.stage}`,
  {
    bucket: `${infraConfigResouces.idPrefix}-alb-connection-log-bucket-${$app.stage}`,
    forceDestroy: true,
    policy: $jsonStringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: {
            AWS: "arn:aws:iam::582318560864:root",
          },
          Action: "s3:PutObject",
          Resource: [
            `arn:aws:s3:::${infraConfigResouces.idPrefix}-alb-connection-log-bucket-${$app.stage}/*`
          ],
        }
      ],
    }),
  },
);

// const uploadCdnBucket = new sst.aws.Bucket(
//   `${infraConfigResouces.idPrefix}-upload-cdn-bucket-${$app.stage}`,
//   {
//     transform: {
//       bucket: {
//         bucket: `${infraConfigResouces.idPrefix}-upload-cdn-bucket-${$app.stage}`,
//         serverSideEncryptionConfigurations: [
//           {
//             rules: [
//               {
//                 applyServerSideEncryptionByDefaults: [
//                   {
//                     sseAlgorithm: "aws:kms",
//                     kmsMasterKeyId: infraConfigResouces.kms.arn,
//                   }
//                 ]
//               },
//             ],
//           },
//         ]
//       },
//       // cors: {
//       //   bucket: `${infraConfigResouces.idPrefix}-upload-cdn-bucket-${$app.stage}`,
//       //   corsRules: [
//       //     {
//       //       allowedOrigins: ["*"],
//       //       allowedMethods: ["GET", "PUT", "POST", "HEAD"],
//       //       allowedHeaders: ["*"],
//       //       exposeHeaders: [],
//       //       maxAgeSeconds: 0,
//       //     },
//       //   ],
//       // },
//     }
//   }
// );

const uploadCdnBucket = new aws.s3.BucketV2(
  `${infraConfigResouces.idPrefix}-upload-cdn-bucket-${$app.stage}`,
  {
    bucket: `${infraConfigResouces.idPrefix}-upload-cdn-bucket-${$app.stage}`,
    forceDestroy: true,
  },
);

const cloudfrontLogBucket = new aws.s3.BucketV2(
  `${infraConfigResouces.idPrefix}-cloudfront-log-bucket-${$app.stage}`,
  {
    bucket: `${infraConfigResouces.idPrefix}-cloudfront-log-bucket-${$app.stage}`,
    forceDestroy: true,
  },
);

// オブジェクトの所有権の設定
new aws.s3.BucketOwnershipControls(
  `${infraConfigResouces.idPrefix}-log-bucket-ownership-controls-${$app.stage}`,
  {
    bucket: cloudfrontLogBucket.id,
    rule: {
      objectOwnership: "BucketOwnerPreferred",
    },
  },
);

export const s3Resouces = {
  albAccessLogBucket,
  albConnectionLogBucket,
  uploadCdnBucket,
  cloudfrontLogBucket
};