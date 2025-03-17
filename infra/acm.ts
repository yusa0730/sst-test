import { infraConfigResouces } from "./infra-config";

console.log("======acm.ts start======");

const albCertificate = new aws.acm.Certificate(
  `${infraConfigResouces.idPrefix}-alb-acm-${$app.stage}`,
  {
    domainName: infraConfigResouces.domainName,
    subjectAlternativeNames: [`*.${infraConfigResouces.domainName}`],
    validationMethod: "DNS",
    tags: {
      Name: `${infraConfigResouces.idPrefix}-alb-acm-${$app.stage}`,
    }
  }
)

const records: aws.route53.Record[] = [];
albCertificate.domainValidationOptions.apply((domainValidationOptions) => {
  for (const dvo of domainValidationOptions) {
    console.log("=====dvo======", dvo);
    records.push(
      new aws.route53.Record(
        `${infraConfigResouces.idPrefix}-cname-record-${dvo.domainName}-${$app.stage}`,
        {
          allowOverwrite: true,
          name: dvo.resourceRecordName,
          records: [dvo.resourceRecordValue],
          ttl: 60,
          type: dvo.resourceRecordType,
          zoneId: infraConfigResouces.hostedZone.zoneId
        },
      ),
    );
  }
});

new aws.acm.CertificateValidation(
  `${infraConfigResouces.idPrefix}-alb-certificate-validation-${$app.stage}`,
  {
    certificateArn: albCertificate.arn,
    validationRecordFqdns: records.map((record) => record.fqdn)
  }
);

export const acmResouces = {
  albCertificate,
  records
};