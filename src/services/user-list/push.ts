import { pack as packUser, IUser, isRemoteUser, fetchProxyAccount } from '../../models/user';
import UserList, { IUserList } from '../../models/user-list';
import { renderActivity } from '../../remote/activitypub/renderer';
import { deliver } from '../../queue';
import renderFollow from '../../remote/activitypub/renderer/follow';
import { publishUserListStream } from '../stream';

export async function pushUserToUserList(target: IUser, list: IUserList) {
	await UserList.update({ _id: list._id }, {
		$push: {
			userIds: target._id
		}
	});

	publishUserListStream(list._id, 'userAdded', await packUser(target));

	// このインスタンス内にこのリモートユーザーをフォローしているユーザーがいなくても投稿を受け取るためにダミーのユーザーがフォローしたということにする
	if (isRemoteUser(target)) {
		const proxy = await fetchProxyAccount();
		const content = renderActivity(renderFollow(proxy, target));
		deliver(proxy, content, target.inbox);
	}
}
