/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "sst-test",
      home: "aws",
    };
  },
  async run() {
    await import('./infra/infra-config');
    // await import('./infra/iam');
    // await import('./infra/cloudwatch');
    // await import('./infra/vpc');
    // await import('./infra/security-group');
    // await import('./infra/acm');
    // await import('./infra/s3');
    // await import('./infra/alb');
    // await import('./infra/ecr');
    // await import('./infra/ecs');
    // await import('./infra/ecs-sst');
    // await import('./infra/remix');
    // await import('./infra/ses');

    // =======署名付きURLのテスト======
    await import('./infra/s3');
    await import('./infra/cloudfront');
  }
});
