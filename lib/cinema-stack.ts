import path from "node:path";
import { GoFunction } from "@aws-cdk/aws-lambda-go-alpha";
import {
	Duration,
	Stack,
	type StackProps,
	aws_cloudfront,
	aws_cloudfront_origins,
	aws_events,
	aws_events_targets,
	aws_lambda,
	aws_s3,
} from "aws-cdk-lib";
import type { Construct } from "constructs";

export class CinemaStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);

		const icsBucket = new aws_s3.Bucket(this, "IcsBucket", {});

		const distribution = new aws_cloudfront.Distribution(this, "Distribution", {
			defaultBehavior: {
				origin:
					aws_cloudfront_origins.S3BucketOrigin.withOriginAccessControl(
						icsBucket,
					),
			},
		});

		const lambda = new GoFunction(this, "CalendarGenerator", {
			entry: path.join(__dirname, "..", "src", "lambda", "calendar-generator"),
			timeout: Duration.minutes(1),
			environment: {
				BUCKET_NAME: icsBucket.bucketName,
			},
		});

		const rule = new aws_events.Rule(this, "Rule", {
			schedule: aws_events.Schedule.cron({
				hour: "6",
				minute: "0",
			}),
			targets: [new aws_events_targets.LambdaFunction(lambda)],
		});

		icsBucket.grantReadWrite(lambda);
	}
}
