import { createIcsFromEvents } from "./ical";
import { getImagixEvents } from "./imagix";

export const handler = async () => {
	const movies = await getImagixEvents();
	await createIcsFromEvents(movies);
};
