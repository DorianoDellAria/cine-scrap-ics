import axios from "axios";

interface PerformanceData {
	id: number;
	title: string;
	compeso_id: string;
	/** The day when the movie is shown in 'yyyy-mm-dd' format. */
	date: string;
	/** The time when the movie is shown in 'hh:mm' format and in Belgium timezone. */
	time: string;
	auditorium: string;
	nominated_seats: boolean;
	film_edi: string;
	/** Id of the movie.
	 * /!\ Is not the same as the id of a MovieData /!\
	 */
	film_id: string;
	week: number;
	center_id: number;
	release_name: string;
	film_rating: string;
	language: string;
	/** Id of the program (Epic movies, concerts,etc.). */
	special_program: string;
	rentrak_media: string;
	subtitle_language: string;
	auditorium_id: string;
	is_new: boolean;
	free_seats: number;
	total_seats: number;
	sold_seats: number;
	this_week: boolean;
	force_soldout: boolean;
	occupied_seats: number;
	reserved_seats: number;
	add_to_cart_enabled: boolean;
	center: {
		id: number;
		title: string;
	};
	timestamp: number;
	auditorium_info: {
		auditorium_id: string;
		title: string;
		disabled_friendly: boolean;
	};
	ramdam_is_available: boolean;
	ramdam_in_cart: boolean;
	seat_status: string;
}

interface MovieData {
	/** key format : {maccsbox_id}-{special_program}-{VF/VO}. */
	[key: string]: {
		id: number;
		title: string;
		ticket_title: string;
		year_of_production: number;
		director: string;
		distributor: number;
		/** The duration of the movie in minutes. */
		duration: number;
		language: number;
		maccsbox_id: string;
		release_date: string;
		youtube: string;
		rating: number;
		releases: string[];
		/** Key: type of the show (2D ATMOS, etc.).
		 * Value: id of the language. */
		subtitles: { [key: string]: string };
		created_at: string;
		updated_at: string;
		highlight: boolean;
		spotify_album_id: string;
		title_fr: string;
		title_nl: string;
		synopsis: string;
		synopsis_fr: string;
		synopsis_nl: string;
		original_title: string;
		youtube_fr: string;
		youtube_nl: string;
		has_meta: boolean;
		new_until: null;
		stream_provider_url: string;
		disable_candyshop: boolean;
		points_value: number;
		promo: boolean;
		source: string;
	};
}

interface ImagixEventsResponse {
	/** The days of the week in 'yyyy-mm-dd' format. */
	week: string[];
	/** The data about the movies showed this week. */
	performances: PerformanceData[];
	movies: MovieData;
}
export interface ImagixPerformance {
	id: number;
	ticket_url: string;
	title: string;
	synopsis: string;
	date: Date;
	duration: number;
	location: string;
	version: string;
}

enum CENTERS {
	Mons = "Imagix Mons, Bd André Delvaux 1, 7000 Mons, Belgique",
}

export async function getImagixEvents(): Promise<ImagixPerformance[]> {
	const hostname = "tickets.imagix.be";
	const eventsPath = "/api/movie/this_week";

	const response = await axios.get<ImagixEventsResponse>(
		`https://${hostname}${eventsPath}`,
	);
	const movies = response.data.movies;
	const performances = response.data.performances;

	const centerKey = "Mons";

	return performances
		.filter((performance) => performance.center.title === centerKey)
		.map((performance) => {
			const movieKey = Object.keys(movies).find((key) => {
				return movies[key].maccsbox_id === performance.film_edi;
			}) as keyof MovieData;
			const movie = movies[movieKey];

			return {
				id: performance.id,
				ticket_url: `https://${hostname}/movie/${movie.id}/title`,
				title: performance.title,
				synopsis: movie.synopsis_fr,
				date: new Date(`${performance.date}T${performance.time}:00`),
				duration: movie.duration + 30,
				location: CENTERS[centerKey],
				version: performance.language,
			};
		});
}
