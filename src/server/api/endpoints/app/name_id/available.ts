/**
 * Module dependencies
 */
import $ from 'cafy';
import App from '../../../../../models/app';
import { isValidNameId } from '../../../../../models/app';

/**
 * Check available nameId of app
 *
 * @param {any} params
 * @return {Promise<any>}
 */
export default async (params: any) => new Promise(async (res, rej) => {
	// Get 'nameId' parameter
	const [nameId, nameIdErr] = $.str.pipe(isValidNameId).get(params.nameId);
	if (nameIdErr) return rej('invalid nameId param');

	// Get exist
	const exist = await App
		.count({
			nameIdLower: nameId.toLowerCase()
		}, {
			limit: 1
		});

	// Reply
	res({
		available: exist === 0
	});
});
