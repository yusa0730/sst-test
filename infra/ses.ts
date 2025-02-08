const idPrefix = "ishizawa-test4";
const domainName = "ishizawa-test.xyz";

const hostedZone = await aws.route53.getZone({
  name: `${domainName}.`,
});

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