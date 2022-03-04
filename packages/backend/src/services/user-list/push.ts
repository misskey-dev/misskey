import { publishUserListStream } from '@/services/stream.js';
import { User } from '@/models/entities/user.js';
import { UserList } from '@/models/entities/user-list.js';
import { UserListJoinings, Users } from '@/models/index.js';
import { UserListJoining } from '@/models/entities/user-list-joining.js';
import { genId } from '@/misc/gen-id.js';
import { fetchProxyAccount } from '@/misc/fetch-proxy-account.js';
import createFollowing from '../following/create.js';

export async function pushUserToUserList(target: User, list: UserList) {
	await UserListJoinings.insert({
		id: genId(),
		createdAt: new Date(),
		userId: target.id,
		userListId: list.id,
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
