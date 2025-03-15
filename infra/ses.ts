import { infraConfigResouces } from "./infra-config";

const getDomainIdentity = await aws.ses
    .getDomainIdentity({
      domain: `${infraConfigResouces.domainName}`,
    })
    .catch((error) => {
      console.log(error);
      console.log("======catchの中======");
      console.log(infraConfigResouces.domainName)
      console.log(infraConfigResouces.hostedZone.zoneId)
      console.log("======catchの中======");

      const domainIdentity = new aws.ses.DomainIdentity(
        `${infraConfigResouces.idPrefix}-domain-identity-${$app.stage}`,
        {
          domain: infraConfigResouces.domainName,
        },
      );

      console.log("====domainIdentity====", domainIdentity.domain.apply((domain) => {
        return domain;
      }))

      // Route 53 MX record
      new aws.route53.Record(`${infraConfigResouces.idPrefix}-mx-record-${$app.stage}`, {
        zoneId: infraConfigResouces.hostedZone.zoneId,
        name: `bounce.${infraConfigResouces.domainName}`,
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
      new aws.route53.Record(`${infraConfigResouces.idPrefix}-bounce-txt-record-${$app.stage}`, {
        zoneId: infraConfigResouces.hostedZone.zoneId,
        name: `bounce.${infraConfigResouces.domainName}`,
        type: aws.route53.RecordType.TXT,
        ttl: 1800,
        records: ["v=spf1 include:amazonses.com ~all"],
      });

      // Route 53 TXT record DMARC
      new aws.route53.Record(`${infraConfigResouces.idPrefix}-dmarc-txt-record-${$app.stage}`, {
        zoneId: infraConfigResouces.hostedZone.zoneId,
        name: `_dmarc.${infraConfigResouces.domainName}`,
        type: aws.route53.RecordType.TXT,
        ttl: 3600,
        records: [`v=DMARC1; p=none; rua=mailto:dmarcreports@${infraConfigResouces.domainName}`], // コンソールと内容が違う
      });

      // Route 53 CNAME record
      // https://www.pulumi.com/registry/packages/aws/api-docs/ses/domaindkim/
      const domainDkim = new aws.ses.DomainDkim(
        `${infraConfigResouces.idPrefix}-domain-dkim-${$app.stage}`,
        {
          domain: infraConfigResouces.domainName,
        },
      );

      const dkimRecord: aws.route53.Record[] = [];
      domainDkim.dkimTokens.apply((dkimTokens) => {
        console.log("=======dkimTokens========", dkimTokens);

        // dkimTokens の各値を処理
        dkimTokens.forEach((dkimToken, index) => {
          console.log("=======dkimToken========", dkimToken);

          dkimRecord.push(new aws.route53.Record(`${infraConfigResouces.idPrefix}-dkim-record-${index}-${$app.stage}`, {
            zoneId: infraConfigResouces.hostedZone.zoneId,
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
              new aws.ses.MailFrom(`${infraConfigResouces.idPrefix}-mail-from-${$app.stage}`, {
                domain: infraConfigResouces.domainName,
                mailFromDomain: `bounce.${infraConfigResouces.domainName}`,
              })
            );
          });
        });
    });

    if (getDomainIdentity) {
      new aws.ses.DomainIdentity(
        `${infraConfigResouces.idPrefix}-domain-identity-${$app.stage}`,
        {
          domain: infraConfigResouces.domainName,
        },
        {
          import: infraConfigResouces.domainName,
        },
      );

      // Route 53 MX record
      new aws.route53.Record(
        `${infraConfigResouces.idPrefix}-mx-record-${$app.stage}`,
        {
          zoneId: infraConfigResouces.hostedZone.zoneId,
          name: `bounce.${infraConfigResouces.domainName}`,
          type: aws.route53.RecordType.MX,
          ttl: 1800,
          records: ["10 feedback-smtp.ap-northeast-1.amazonses.com"],
        },
        {
          import: `${infraConfigResouces.hostedZone.zoneId}_bounce.${infraConfigResouces.domainName}_MX`,
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
        `${infraConfigResouces.idPrefix}-bounce-txt-record-${$app.stage}`,
        {
          zoneId: infraConfigResouces.hostedZone.zoneId,
          name: `bounce.${infraConfigResouces.domainName}`,
          type: aws.route53.RecordType.TXT,
          ttl: 1800,
          records: ["v=spf1 include:amazonses.com ~all"],
        },
        {
          import: `${infraConfigResouces.hostedZone.zoneId}_bounce.${infraConfigResouces.domainName}_TXT`,
        },
      );

      // Route 53 TXT record DMARC
      new aws.route53.Record(
        `${infraConfigResouces.idPrefix}-dmarc-txt-record-${$app.stage}`,
        {
          zoneId: infraConfigResouces.hostedZone.zoneId,
          name: `_dmarc.${infraConfigResouces.domainName}`,
          type: aws.route53.RecordType.TXT,
          ttl: 3600,
          records: [`v=DMARC1; p=none; rua=mailto:dmarcreports@${infraConfigResouces.domainName}`], // コンソールと内容が違う
        },
        {
          import: `${infraConfigResouces.hostedZone.zoneId}__dmarc.${infraConfigResouces.domainName}_TXT`,
        },
      );

      // Route 53 CNAME record
      // https://www.pulumi.com/registry/packages/aws/api-docs/ses/domaindkim/
      const domainDkim = new aws.ses.DomainDkim(
        `${infraConfigResouces.idPrefix}-domain-dkim-${$app.stage}`,
        {
          domain: infraConfigResouces.domainName,
        },
        {
          import: infraConfigResouces.domainName,
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
              `${infraConfigResouces.idPrefix}-dkim-record-${index}-${$app.stage}`,
              {
                zoneId: infraConfigResouces.hostedZone.zoneId,
                name: `${dkimToken}._domainkey`,
                type: aws.route53.RecordType.CNAME,
                ttl: 1800,
                records: [`${dkimToken}.dkim.amazonses.com`],
              },
              {
                import: `${infraConfigResouces.hostedZone.zoneId}_${dkimToken}._domainkey_CNAME`,
              },
          ));
        });
      });

      new aws.ses.MailFrom(
        `${infraConfigResouces.idPrefix}-mail-from-${$app.stage}`,
        {
          domain: infraConfigResouces.domainName,
          mailFromDomain: `bounce.${infraConfigResouces.domainName}`,
        },
        {
          import: infraConfigResouces.domainName,
        },
      );
    }