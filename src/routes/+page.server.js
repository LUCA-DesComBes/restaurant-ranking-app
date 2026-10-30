import { getAll, getPhotosList, getRestaurantList, getTags } from '#lib/server/database.js';

/** @typedef {{ lat: number, lon: number, name: string }} GeographicCenter */
/** @typedef {{ latitude?: number | string | null, longitude?: number | string | null }} RestaurantLocation */

function distanceKm(lat1 = 0, lon1 = 0, lat2 = 0, lon2 = 0) {
	const toRad = (degrees = 0) => (degrees * Math.PI) / 180;

	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);

	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

	return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
export async function load({ url, fetch }) {
	const city = url.searchParams.get('ville')?.trim() ?? '';
	const tags = getTags();
	const photosList = getPhotosList();

	/** @type {GeographicCenter | null} */
	let center = null;
	let searchError = null;
	let datas = getAll();
	let restaurantList = getRestaurantList();

	if (city) {
		try {
			const params = new URLSearchParams({
				q: city,
				format: 'jsonv2',
				limit: '1'
			});
			const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
				headers: {
					'User-Agent': 'restaurant-ranking-app/0.0.1'
				}
			});

			if (!response.ok) {
				const details = await response.text();
				throw new Error(
					`Nominatim returned HTTP ${response.status} ${response.statusText}: ${details}`
				);
			}

			const result = await response.json();

			if (!Array.isArray(result)) {
				throw new Error('Location search returned an invalid response.');
			}

			if (result.length === 0) {
				searchError = `no results for ${city}`;
				datas = [];
				restaurantList = [];
			} else {
				const lat = Number(result[0].lat);
				const lon = Number(result[0].lon);
				if (
					!Number.isFinite(lat) ||
					lat < -90 ||
					lat > 90 ||
					!Number.isFinite(lon) ||
					lon < -180 ||
					lon > 180
				) {
					throw new Error('Location search returned invalid coordinates.');
				}

				const resolvedCenter = {
					lat,
					lon,
					name: typeof result[0].display_name === 'string' ? result[0].display_name : city
				};
				center = resolvedCenter;

				/** @param {RestaurantLocation} restaurant */
				const nearby = (restaurant) => {
					if (restaurant.latitude == null || restaurant.longitude == null) {
						return false;
					}
					const lat = Number(restaurant.latitude);
					const lon = Number(restaurant.longitude);
					if (
						!Number.isFinite(lat) ||
						lat < -90 ||
						lat > 90 ||
						!Number.isFinite(lon) ||
						lon < -180 ||
						lon > 180
					) {
						return false;
					}

					return distanceKm(resolvedCenter.lat, resolvedCenter.lon, lat, lon) <= 1;
				};

				datas = /** @type {RestaurantLocation[]} */ (datas).filter(nearby);
				restaurantList = /** @type {RestaurantLocation[]} */ (restaurantList).filter(nearby);
			}
		} catch (error) {
			console.error(error);
			searchError = 'Unable to search this location. Please try again.';
			restaurantList = [];
		}
	}

	return {
		datas,
		tags,
		photosList,
		restaurantList,
		center,
		searchCity: city,
		searchError
	};
}
