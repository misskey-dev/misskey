/**
 * Module dependencies
 */
import Post from '../models/post';
import User from '../models/user';

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
 *             posts_count:
 *               description: count of all posts of misskey
 *               type: number
 *             users_count:
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
		posts_count: postsCount,
		users_count: usersCount
	});
});
