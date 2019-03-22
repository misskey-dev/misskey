import { pack as packUser, User, isRemoteUser, fetchProxyAccount } from '../../models/user';
import UserList, { UserList } from '../../models/user-list';
import { renderActivity } from '../../remote/activitypub/renderer';
import { deliver } from '../../queue';
import renderFollow from '../../remote/activitypub/renderer/follow';
import { publishUserListStream } from '../stream';

export async function pushUserToUserList(target: User, list: UserList) {
	await UserList.update({ _id: list.id }, {
		$push: {
			userIds: target.id
		}
	});

	publishUserListStream(list.id, 'userAdded', await packUser(target));

	// このインスタンス内にこのリモートユーザーをフォローしているユーザーがいなくても投稿を受け取るためにダミーのユーザーがフォローしたということにする
	if (isRemoteUser(target)) {
		const proxy = await fetchProxyAccount();
		const content = renderActivity(renderFollow(proxy, target));
		deliver(proxy, content, target.inbox);
	}
}
