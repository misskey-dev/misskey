import { publishUserListStream } from '../stream';
import { User } from '../../models/entities/user';
import { UserList } from '../../models/entities/user-list';
import { UserListJoinings, Users } from '../../models';
import { UserListJoining } from '../../models/entities/user-list-joining';
import { genId } from '../../misc/gen-id';
import { fetchProxyAccount } from '../../misc/fetch-proxy-account';
import createFollowing from '../following/create';

export async function pushUserToUserList(target: User, list: UserList) {
	await UserListJoinings.insert({
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
			createFollowing(proxy, target);
		}
	}
}
