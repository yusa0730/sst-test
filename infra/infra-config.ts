console.log("======infra-config.ts start======");

const idPrefix = "sst-test"
const mainRegion = "ap-northeast-1" 
const domainName = "ishizawa-test.xyz";
const hostedZone = await aws.route53.getZone({
  name: `${domainName}.`,
});

export const infraConfigResouces = {
  idPrefix,
  mainRegion,
  domainName,
  hostedZone
};