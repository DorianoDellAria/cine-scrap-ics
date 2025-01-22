import {
	aws_events,
	aws_events_targets,
	type aws_lambda,
	type aws_s3,
} from "aws-cdk-lib";
import { Construct } from "constructs";

interface ScrapperProps {
	icsBucket: aws_s3.IBucket;
	calendarGeneratorLambda: aws_lambda.Function;
	updateSchedule: aws_events.Schedule;
}

export class Scrapper extends Construct {
	constructor(scope: Construct, id: string, props: ScrapperProps) {
		super(scope, id);

		new aws_events.Rule(this, "Rule", {
			schedule: props.updateSchedule,
			targets: [
				new aws_events_targets.LambdaFunction(props.calendarGeneratorLambda),
			],
		});

		props.calendarGeneratorLambda.addEnvironment(
			"BUCKET_NAME",
			props.icsBucket.bucketName,
		);
		props.icsBucket.grantReadWrite(props.calendarGeneratorLambda);
	}
}
