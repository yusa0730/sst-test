const idPrefix = "sst-test"
const domainName = "ishizawa-test.xyz";
const hostedZone = await aws.route53.getZone({
  name: `${domainName}.`,
});

export const infraConfigResouces = {
  idPrefix,
  domainName,
  hostedZone
};