/// <reference path="./.sst/platform/config.d.ts" />
import type { DistributionArgs } from "@pulumi/aws/cloudfront";
import * as pulumi from "@pulumi/pulumi";

export default $config({
  app(input) {
    return {
      name: "aws-remix-after-move4",
      home: "aws",
    };
  },
  async run() {
    const idPrefix = "ishizawa-test4"
    const domainName = "ishizawa-test.xyz";
    const hostedZone = await aws.route53.getZone({
      name: `${domainName}.`,
    });

    // const bucket = new sst.aws.Bucket("TestBucketAfterMove4", {
    //   access: "public"
    // });

    // console.log("=======hostedZone=======", hostedZone.zoneId);

    // const useast1 = new aws.Provider("Useast1TestAfterMove4", {
    //   region: "us-east-1",
    // });

    // // 移行元のCloudFrontで設定しているACMを取得する
    // const acm = await aws.acm.getCertificate(
    //   {
    //     domain: domainName,
    //     statuses: ["ISSUED"],
    //   },
    //   { provider: useast1 },
    // );

    // console.log("====acm====", acm.arn)

    // const remix = new sst.aws.Remix("RemixTestAfterMove3", {
    //   link: [bucket],
    //   // domain: "ishizawa-test.xyz"
    //   transform: {
    //     cdn: (
    //       args: sst.aws.CdnArgs,
    //       opts: $util.CustomResourceOptions,
    //       name: string
    //     ) => {
    //       console.log("====acm====", acm.arn)
    //       args.transform = {
    //         distribution: (
    //           args: DistributionArgs,
    //           opts: $util.CustomResourceOptions,
    //           name: string
    //         ) => {
    //           args.viewerCertificate = {
    //             acmCertificateArn: acm.arn,
    //             minimumProtocolVersion: "TLSv1.2_2021",
    //             sslSupportMethod: "sni-only",
    //           };

    //           args.aliases = [domainName]
    //         },
    //       };
    //     }
    //   }
    // });

    // remix.nodes.cdn?.apply((cdn) => {
    //   console.log(cdn);
    //   cdn.url.apply((url) => {
    //     console.log("====url===", url);

    //     // `https://` を削除した新しい変数
    //     const cleanUrl = url.replace(/^https?:\/\//, "");
    //     console.log("====cleanUrl===", cleanUrl);

    //     // Route 53 TXT record transfer domain
    //     new aws.route53.Record("transfer-txt-record", {
    //       zoneId: hostedZone.zoneId,
    //       name: `_.${domainName}`,
    //       type: aws.route53.RecordType.TXT,
    //       ttl: 1800,
    //       records: [$interpolate`${cleanUrl}`],
    //     });
    //   });
    // });


    // if (!domainName) {
    //   throw new Error(`Invalid domainName: ${domainName}`);
    // }

  const getDomainIdentity = await aws.ses
    .getDomainIdentity({
      domain: `${domainName}`,
    })
    .catch((error) => {
      console.log(error);
      console.log("======catchの中======");
      console.log(domainName)
      console.log(hostedZone.zoneId)
      console.log("======catchの中======");

      const domainIdentity = new aws.ses.DomainIdentity(
        `${idPrefix}-domain-identity-${$app.stage}`,
        {
          domain: domainName,
        },
      );

      console.log("====domainIdentity====", domainIdentity.domain.apply((domain) => {
        return domain;
      }))

      // Route 53 MX record
      new aws.route53.Record(`${idPrefix}-mx-record-${$app.stage}`, {
        zoneId: hostedZone.zoneId,
        name: `bounce.${domainName}`,
        type: aws.route53.RecordType.MX,
        ttl: 1800,
        records: ["10 feedback-smtp.ap-northeast-1.amazonses.com"],
      });

      // new aws.route53.Record(`${idPrefix}-verify-txt-record-${$app.stage}`, {
      //   zoneId: hostedZone.zoneId,
      //   name: `_amazonses.${domainName}`,
      //   type: aws.route53.RecordType.TXT,
      //   ttl: 1800,
      //   records: [domainIdentity.verificationToken],
      // });

      // Route 53 TXT record SPF
      new aws.route53.Record(`${idPrefix}-bounce-txt-record-${$app.stage}`, {
        zoneId: hostedZone.zoneId,
        name: `bounce.${domainName}`,
        type: aws.route53.RecordType.TXT,
        ttl: 1800,
        records: ["v=spf1 include:amazonses.com ~all"],
      });

      // Route 53 TXT record DMARC
      new aws.route53.Record(`${idPrefix}-dmarc-txt-record-${$app.stage}`, {
        zoneId: hostedZone.zoneId,
        name: `_dmarc.${domainName}`,
        type: aws.route53.RecordType.TXT,
        ttl: 3600,
        records: [`v=DMARC1; p=none; rua=mailto:dmarcreports@${domainName}`], // コンソールと内容が違う
      });

      // Route 53 CNAME record
      // https://www.pulumi.com/registry/packages/aws/api-docs/ses/domaindkim/
      const domainDkim = new aws.ses.DomainDkim(
        `${idPrefix}-domain-dkim-${$app.stage}`,
        {
          domain: domainName,
        },
      );

      const dkimRecord: aws.route53.Record[] = [];
      domainDkim.dkimTokens.apply((dkimTokens) => {
        console.log("=======dkimTokens========", dkimTokens);

        // dkimTokens の各値を処理
        dkimTokens.forEach((dkimToken, index) => {
          console.log("=======dkimToken========", dkimToken);

          dkimRecord.push(new aws.route53.Record(`${idPrefix}-dkim-record-${index}-${$app.stage}`, {
            zoneId: hostedZone.zoneId,
            name: `${dkimToken}._domainkey`,
            type: aws.route53.RecordType.CNAME,
            ttl: 1800,
            records: [`${dkimToken}.dkim.amazonses.com`],
          }));
        });
      });


      $util
        .all([domainIdentity.verificationToken])
        .apply(([verificationToken]) => {
          console.log(`Verification Token: ${verificationToken}`);
          
          return new Promise((resolve) => {
            resolve(
              new aws.ses.MailFrom(`${idPrefix}-mail-from-${$app.stage}`, {
                domain: domainName,
                mailFromDomain: `bounce.${domainName}`,
              })
            );
          });
        });
    });

    if (getDomainIdentity) {
      new aws.ses.DomainIdentity(
        `${idPrefix}-domain-identity-${$app.stage}`,
        {
          domain: domainName,
        },
        {
          import: domainName,
        },
      );

      // Route 53 MX record
      new aws.route53.Record(
        `${idPrefix}-mx-record-${$app.stage}`,
        {
          zoneId: hostedZone.zoneId,
          name: `bounce.${domainName}`,
          type: aws.route53.RecordType.MX,
          ttl: 1800,
          records: ["10 feedback-smtp.ap-northeast-1.amazonses.com"],
        },
        {
          import: `${hostedZone.zoneId}_bounce.${domainName}_MX`,
        },
      );

      // new aws.route53.Record(`${idPrefix}-verify-txt-record-${$app.stage}`, {
      //   zoneId: hostedZone.zoneId,
      //   name: `_amazonses.${domainName}`,
      //   type: aws.route53.RecordType.TXT,
      //   ttl: 1800,
      //   records: [domainIdentity.verificationToken],
      // });

      // Route 53 TXT record SPF
      new aws.route53.Record(
        `${idPrefix}-bounce-txt-record-${$app.stage}`,
        {
          zoneId: hostedZone.zoneId,
          name: `bounce.${domainName}`,
          type: aws.route53.RecordType.TXT,
          ttl: 1800,
          records: ["v=spf1 include:amazonses.com ~all"],
        },
        {
          import: `${hostedZone.zoneId}_bounce.${domainName}_TXT`,
        },
      );

      // Route 53 TXT record DMARC
      new aws.route53.Record(
        `${idPrefix}-dmarc-txt-record-${$app.stage}`,
        {
          zoneId: hostedZone.zoneId,
          name: `_dmarc.${domainName}`,
          type: aws.route53.RecordType.TXT,
          ttl: 3600,
          records: [`v=DMARC1; p=none; rua=mailto:dmarcreports@${domainName}`], // コンソールと内容が違う
        },
        {
          import: `${hostedZone.zoneId}__dmarc.${domainName}_TXT`,
        },
      );

      // Route 53 CNAME record
      // https://www.pulumi.com/registry/packages/aws/api-docs/ses/domaindkim/
      const domainDkim = new aws.ses.DomainDkim(
        `${idPrefix}-domain-dkim-${$app.stage}`,
        {
          domain: domainName,
        },
        {
          import: domainName,
        },
      );

      const dkimRecord: aws.route53.Record[] = [];
      domainDkim.dkimTokens.apply((dkimTokens) => {
        console.log("=======dkimTokens========", dkimTokens);

        // dkimTokens の各値を処理
        dkimTokens.forEach((dkimToken, index) => {
          console.log("=======dkimToken========", dkimToken);

          dkimRecord.push(
            new aws.route53.Record(
              `${idPrefix}-dkim-record-${index}-${$app.stage}`,
              {
                zoneId: hostedZone.zoneId,
                name: `${dkimToken}._domainkey`,
                type: aws.route53.RecordType.CNAME,
                ttl: 1800,
                records: [`${dkimToken}.dkim.amazonses.com`],
              },
              {
                import: `${hostedZone.zoneId}_${dkimToken}._domainkey_CNAME`,
              },
          ));
        });
      });

      new aws.ses.MailFrom(
        `${idPrefix}-mail-from-${$app.stage}`,
        {
          domain: domainName,
          mailFromDomain: `bounce.${domainName}`,
        },
        {
          import: domainName,
        },
      );
    }
  }
});
