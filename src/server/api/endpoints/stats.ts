/**
 * Module dependencies
 */
import Post from '../../../models/post';
import User from '../../../models/user';

/**
 * @swagger
 * /stats:
 *   post:
 *     summary: Show the misskey's statistics
 *     responses:
 *       200:
 *         description: Success
 *         schema:
 *           type: object
 *           properties:
 *             postsCount:
 *               description: count of all posts of misskey
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
	const postsCount = await Post
		.count();

	const usersCount = await User
		.count();

	res({
		postsCount: postsCount,
		usersCount: usersCount
	});
});
