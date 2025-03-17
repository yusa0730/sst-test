import { infraConfigResouces } from "./infra-config";

console.log("======ecr.ts start======");

const repository = new aws.ecr.Repository(`${infraConfigResouces.idPrefix}-ecr-repository-${$app.stage}`, {
  name: `${infraConfigResouces.idPrefix}-ecr-repository-${$app.stage}`,
  forceDelete: true,
  imageScanningConfiguration: {
    scanOnPush: true
  }
});

new aws.ecr.LifecyclePolicy(
  `${infraConfigResouces.idPrefix}-lifecycle-policy-${$app.stage}`,
  {
    repository: repository.name,
    policy: $jsonStringify({
      rules: [
        {
          rulePriority: 1,
          description: "Keep 14 days",
          selection: {
            tagStatus: "untagged",
            countType: "sinceImagePushed",
            countUnit: "days",
            countNumber: 14,
          },
          action: {
            type: "expire",
          },
        },
      ],
    }),
  }
);

export const ecrResources = {
  repository,
};