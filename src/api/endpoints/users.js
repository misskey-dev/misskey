'use strict';

/**
 * Module dependencies
 */
import User from '../models/user';
import serialize from '../serializers/user';

/**
 * @swagger
 * definitions:
 *   User:
 *     type: object
 *     required:
 *       - created_at
 *       - followers_count
 *       - following_count
 *       - id
 *       - liked_count
 *       - likes_count
 *       - name
 *       - posts_count
 *       - username
 *     properties:
 *       avatar_id:
 *         type: string
 *         description: アバターに設定しているドライブのファイルのID
 *       avatar_url:
 *         type: string
 *         description: アバターURL
 *       banner_id:
 *         type: string
 *         description: バナーに設定しているドライブのファイルのID
 *       banner_url:
 *         type: string
 *         description: バナーURL
 *       bio:
 *         type: string
 *         description: プロフィール
 *       birthday:
 *         type: string
 *         description: 誕生日
 *       created_at:
 *         type: string
 *         format: date
 *         description: アカウント作成日時
 *       drive_capacity:
 *         type: integer
 *         description: ドライブの最大容量
 *       followers_count:
 *         type: integer
 *         description: フォロワー数
 *       following_count:
 *         type: integer
 *         description: フォロー数
 *       id:
 *         type: string
 *         description: ユーザーID
 *       is_followed:
 *         type: boolean
 *         description: フォローされているか
 *       is_following:
 *         type: boolean
 *         description: フォローしているか
 *       liked_count:
 *         type: integer
 *         description: 投稿にいいねされた数 
 *       likes_count:
 *         type: integer
 *         description: 投稿にいいねした数
 *       location:
 *         type: string
 *         description: 場所
 *       name:
 *         type: string
 *         description: ニックネーム
 *       posts_count:
 *         type: integer
 *         description: 投稿数
 *       username:
 *         type: string
 *         description: ユーザー名
 */  

/**
 * Lists all users
 *
 * @param {Object} params
 * @param {Object} me
 * @return {Promise<object>}
 */
module.exports = (params, me) =>
	new Promise(async (res, rej) =>
{
	// Get 'limit' parameter
	let limit = params.limit;
	if (limit !== undefined && limit !== null) {
		limit = parseInt(limit, 10);

		// From 1 to 100
		if (!(1 <= limit && limit <= 100)) {
			return rej('invalid limit range');
		}
	} else {
		limit = 10;
	}

	const since = params.since_id || null;
	const max = params.max_id || null;

	// Check if both of since_id and max_id is specified
	if (since !== null && max !== null) {
		return rej('cannot set since_id and max_id');
	}

	// Construct query
	const sort = {
		created_at: -1
	};
	const query = {};
	if (since !== null) {
		sort.created_at = 1;
		query._id = {
			$gt: new mongo.ObjectID(since)
		};
	} else if (max !== null) {
		query._id = {
			$lt: new mongo.ObjectID(max)
		};
	}

	// Issue query
	const users = await User
		.find(query, {}, {
			limit: limit,
			sort: sort
		})
		.toArray();

	// Serialize
	res(await Promise.all(users.map(async user =>
		await serialize(user, me))));
});
