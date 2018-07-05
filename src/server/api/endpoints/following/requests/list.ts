//import $ from 'cafy'; import ID from '../../../../../cafy-id';
import FollowRequest, { pack } from '../../../../../models/follow-request';
import { ILocalUser } from '../../../../../models/user';

/**
 * Get all pending received follow requests
 */
export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const reqs = await FollowRequest.find({
		followeeId: user._id
	});

	// Send response
	res(await Promise.all(reqs.map(req => pack(req))));
});
