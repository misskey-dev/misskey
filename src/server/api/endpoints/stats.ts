/**
 * Module dependencies
 */
import Note from '../../../models/note';
import User from '../../../models/user';

/**
 * @swagger
 * /stats:
 *   note:
 *     summary: Show the misskey's statistics
 *     responses:
 *       200:
 *         description: Success
 *         schema:
 *           type: object
 *           properties:
 *             notesCount:
 *               description: count of all notes of misskey
 *               type: number
 *             usersCount:
 *               description: count of all users of misskey
 *               type: number
 *
 *       default:
 *         description: Failed
 *         schema:
 *           $ref: "#/definitions/Error"
 */

/**
 * Show the misskey's statistics
 *
 * @param {any} params
 * @return {Promise<any>}
 */
module.exports = params => new Promise(async (res, rej) => {
	const notesCount = await Note
		.count();

	const usersCount = await User
		.count();

	res({
		notesCount: notesCount,
		usersCount: usersCount
	});
});
