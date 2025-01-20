import { App } from "aws-cdk-lib";
import { CinemaStack } from "../lib/cinema-stack";

const app = new App();
new CinemaStack(app, "CinemaStack", {
	env: {
		region: process.env.AWS_REGION,
		account: process.env.AWS_ACCOUNT,
	},
});
