/// <reference path="./.sst/platform/config.d.ts" />
import type { DistributionArgs } from "@pulumi/aws/cloudfront";

export default $config({
  app(input) {
    return {
      name: "aws-remix-after-move4",
      home: "aws",
    };
  },
  async run() {
    // await import('./infra/remix.ts');
    await import('./infra/ses');
  }
});
