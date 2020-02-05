import { renderActivity } from '../../remote/activitypub/renderer';
import { deliver } from '../../queue';
import renderFollow from '../../remote/activitypub/renderer/follow';
import { publishUserListStream } from '../stream';
import { User } from '../../models/entities/user';
import { UserList } from '../../models/entities/user-list';
import { UserListJoinings, Users } from '../../models';
import { UserListJoining } from '../../models/entities/user-list-joining';
import { genId } from '../../misc/gen-id';
import { fetchProxyAccount } from '../../misc/fetch-proxy-account';

export async function pushUserToUserList(target: User, list: UserList) {
	await UserListJoinings.save({
		id: genId(),
		createdAt: new Date(),
		userId: target.id,
		userListId: list.id
	} as UserListJoining);

	publishUserListStream(list.id, 'userAdded', await Users.pack(target));

	// このインスタンス内にこのリモートユーザーをフォローしているユーザーがいなくても投稿を受け取るためにダミーのユーザーがフォローしたということにする
	if (Users.isRemoteUser(target)) {
		const proxy = await fetchProxyAccount();
		if (proxy) {
			const content = renderActivity(renderFollow(proxy, target));
			deliver(proxy, content, target.inbox);
		}
	}
}
