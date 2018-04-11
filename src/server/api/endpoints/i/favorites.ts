/**
 * Module dependencies
 */
import $ from 'cafy';
import Favorite from '../../../../models/favorite';
import { pack } from '../../../../models/note';

/**
 * Get followers of a user
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).$;
	if (limitErr) return rej('invalid limit param');

	// Get 'offset' parameter
	const [offset = 0, offsetErr] = $(params.offset).optional.number().min(0).$;
	if (offsetErr) return rej('invalid offset param');

	// Get 'sort' parameter
	const [sort = 'desc', sortError] = $(params.sort).optional.string().or('desc asc').$;
	if (sortError) return rej('invalid sort param');

	// Get favorites
	const favorites = await Favorite
		.find({
			userId: user._id
		}, {
			limit: limit,
			skip: offset,
			sort: {
				_id: sort == 'asc' ? 1 : -1
			}
		});

	// Serialize
	res(await Promise.all(favorites.map(async favorite =>
		await pack(favorite.noteId)
	)));
});
