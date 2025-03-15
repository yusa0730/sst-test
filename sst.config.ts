/// <reference path="./.sst/platform/config.d.ts" />
import type { DistributionArgs } from "@pulumi/aws/cloudfront";

export default $config({
  app(input) {
    return {
      name: "sst-test",
      home: "aws",
    };
  },
  async run() {
    await import('./infra/infra-config');
    await import('./infra/vpc');
    await import('./infra/ecr');
    await import('./infra/ecs');
    // await import('./infra/remix');
    // await import('./infra/ses');
  }
});
