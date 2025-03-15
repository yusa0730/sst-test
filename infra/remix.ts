/// <reference path="./.sst/platform/config.d.ts" />

import { DistributionArgs } from "@pulumi/aws/cloudfront";
import { infraConfigResouces } from "./infra-config";

const bucket = new sst.aws.Bucket("TestBucketAfterMove4", {
  access: "public"
});

console.log("=======hostedZone=======", infraConfigResouces.hostedZone.zoneId);

const useast1 = new aws.Provider("Useast1TestAfterMove4", {
  region: "us-east-1",
});

// 移行元のCloudFrontで設定しているACMを取得する
const acm = await aws.acm.getCertificate(
  {
    domain: infraConfigResouces.domainName,
    statuses: ["ISSUED"],
  },
  { provider: useast1 },
);

console.log("====acm====", acm.arn)

const remix = new sst.aws.Remix(`${infraConfigResouces.idPrefix}-remix-${$app.stage}`, {
  link: [bucket],
  // domain: "ishizawa-test.xyz"
  transform: {
    cdn: (
      args: sst.aws.CdnArgs,
      opts: $util.CustomResourceOptions,
      name: string
    ) => {
      console.log("====acm====", acm.arn)
      args.transform = {
        distribution: (
          args: DistributionArgs,
          opts: $util.CustomResourceOptions,
          name: string
        ) => {
          args.viewerCertificate = {
            acmCertificateArn: acm.arn,
            minimumProtocolVersion: "TLSv1.2_2021",
            sslSupportMethod: "sni-only",
          };

          args.aliases = [infraConfigResouces.domainName]
        },
      };
    }
  }
});

remix.nodes.cdn?.apply((cdn) => {
  console.log(cdn);
  cdn.url.apply((url) => {
    console.log("====url===", url);

    // `https://` を削除した新しい変数
    const cleanUrl = url.replace(/^https?:\/\//, "");
    console.log("====cleanUrl===", cleanUrl);

    // Route 53 TXT record transfer domain
    new aws.route53.Record("transfer-txt-record", {
      zoneId: infraConfigResouces.hostedZone.zoneId,
      name: `_.${infraConfigResouces.domainName}`,
      type: aws.route53.RecordType.TXT,
      ttl: 1800,
      records: [$interpolate`${cleanUrl}`],
    });
  });
});