import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import * as ics from "ics";
import type { ImagixPerformance } from "./imagix";

export async function createIcsFromEvents(movies: ImagixPerformance[]) {
	const { value: events } = ics.createEvents(
		movies.map((performance) => {
			return {
				title: `${performance.title} - ${performance.version}`,
				startInputType: "local",
				start: [
					performance.date.getFullYear(),
					performance.date.getMonth() + 1,
					performance.date.getDate(),
					performance.date.getHours(),
					performance.date.getMinutes(),
				],
				duration: { minutes: performance.duration },
				description: `${performance.ticket_url}\n${performance.synopsis}`,
				location: performance.location,
			};
		}),
	);

	const s3Client = new S3Client({});
	await s3Client.send(
		new PutObjectCommand({
			Bucket: process.env.BUCKET_NAME,
			Key: "imagix-mons.ics",
			Body: events,
		}),
	);
}
