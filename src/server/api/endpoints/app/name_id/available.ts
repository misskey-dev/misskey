/**
 * Module dependencies
 */
import $ from 'cafy';
import App from '../../../../../models/app';
import { isValidNameId } from '../../../../../models/app';

/**
 * @swagger
 * /app/nameId/available:
 *   note:
 *     summary: Check available nameId on creation an application
 *     parameters:
 *       -
 *         name: nameId
 *         description: Application unique name
 *         in: formData
 *         required: true
 *         type: string
 *
 *     responses:
 *       200:
 *         description: Success
 *         schema:
 *           type: object
 *           properties:
 *             available:
 *               description: Whether nameId is available
 *               type: boolean
 *
 *       default:
 *         description: Failed
 *         schema:
 *           $ref: "#/definitions/Error"
 */

/**
 * Check available nameId of app
 *
 * @param {any} params
 * @return {Promise<any>}
 */
module.exports = async (params) => new Promise(async (res, rej) => {
	// Get 'nameId' parameter
	const [nameId, nameIdErr] = $(params.nameId).string().pipe(isValidNameId).$;
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
