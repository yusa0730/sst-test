console.log("======infra-config.ts start======");

const idPrefix = "sst-test"
const mainRegion = "ap-northeast-1" 
const domainName = "ishizawa-test.xyz";
const hostedZone = await aws.route53.getZone({
  name: `${domainName}.`,
});

// 北部バージニアプロバイダ
const awsUsEast1Provider = new aws.Provider(
  `${idPrefix}-aws-provider-${$app.stage}`,
  {
    region: "us-east-1",
  },
);

const awsAccountId = await aws.ssm.getParameter({
    name: "ACCOUNT_ID", // 取得したいパラメータ名
    withDecryption: true, // 暗号化されている場合は復号化
}).then(param => param.value);

console.log("====awsAccountId====", awsAccountId);

const kms = new aws.kms.Key(
  `${idPrefix}-kms-key-${$app.stage}`,
  {
    description: `${idPrefix} kms key for ${$app.stage}`,
    policy: $jsonStringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: ["kms:*"],
          Resource: ["*"],
          Principal: {
            AWS: `arn:aws:iam::${awsAccountId}:root`
          },
        },
      ],
    }),
  },
);

const kmsAlias = new aws.kms.Alias(
  `${idPrefix}-kms-key-alias-${$app.stage}`,
  {
    name: `alias/${idPrefix}-kms-key-${$app.stage}`,
    targetKeyId: kms.id,
  }
);

export const infraConfigResouces = {
  idPrefix,
  mainRegion,
  domainName,
  hostedZone,
  awsUsEast1Provider,
  awsAccountId,
  kms,
  kmsAlias
};