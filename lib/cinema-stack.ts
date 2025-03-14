import path from "node:path";
import { GoFunction } from "@aws-cdk/aws-lambda-go-alpha";
import {
	Duration,
	Stack,
	type StackProps,
	aws_cloudfront,
	aws_cloudfront_origins,
	aws_events,
	aws_s3,
} from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import type { Construct } from "constructs";
import { Scrapper } from "./scrapper-construct";

export class CinemaStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);

		const icsBucket = new aws_s3.Bucket(this, "IcsBucket", {});

		new aws_cloudfront.Distribution(this, "Distribution", {
			defaultBehavior: {
				origin:
					aws_cloudfront_origins.S3BucketOrigin.withOriginAccessControl(
						icsBucket,
					),
			},
		});

		new Scrapper(this, "Plaza", {
			icsBucket,
			calendarGeneratorLambda: new GoFunction(this, "PlazaFunction", {
				entry: path.join(__dirname, "..", "src", "lambda", "plaza"),
				timeout: Duration.minutes(1),
			}),
			updateSchedule: aws_events.Schedule.cron({
				hour: "6",
				minute: "0",
			}),
		});

		new Scrapper(this, "ImagixMons", {
			icsBucket,
			calendarGeneratorLambda: new NodejsFunction(this, "ImagixMonsFunction", {
				entry: path.join(
					__dirname,
					"..",
					"src",
					"lambda",
					"imagix",
					"index.ts",
				),
				environment: { TZ: "Europe/Brussels" },
				timeout: Duration.minutes(1),
			}),
			updateSchedule: aws_events.Schedule.cron({
				hour: "22",
				minute: "0",
				weekDay: "3",
			}),
		});
	}
}
