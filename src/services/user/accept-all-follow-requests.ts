import User, { IUser } from "../../models/user";
import FollowRequest from "../../models/follow-request";
import accept from './accept-follow-request';

/**
 * 指定したユーザー宛てのフォローリクエストをすべて承認
 * @param user ユーザー
 */
export default async function(user: IUser) {
	const requests = await FollowRequest.find({
		followeeId: user._id
	});

	requests.forEach(async request => {
		const follower = await User.findOne({ _id: request.followerId });
		accept(user, follower);
	});
}
