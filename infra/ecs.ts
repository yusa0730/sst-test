// import { local } from "@pulumi/command";
// import { ecrResources } from "./ecr";

// const dockerBuild = new local.Command("build-image", {
//     create: "docker build -t hono-app ./sst-test/hono-app",
// });

// const dockerTag = new local.Command("tag-image", {
//     create: $interpolate`docker tag hono-app ${ecrResources.repository.repositoryUrl}:latest`,
//     // dependsOn: [dockerBuild],
// });

// const dockerPush = new local.Command("push-image", {
//     create: $interpolate`docker push ${ecrResources.repository.repositoryUrl}:latest`,
//     // dependsOn: [dockerTag],
// });
