import { IUser, isLocalUser } from '../models/user';
import getAcct from '../user/get-acct';

/**
 * ユーザーを表す文字列を取得します。
 * @param user ユーザー
 */
export default function(user: IUser): string {
	let string = `${user.name} (@${getAcct(user)})\n` +
		`${user.postsCount}投稿、${user.followingCount}フォロー、${user.followersCount}フォロワー\n`;

	if (isLocalUser(user)) {
		const account = user.account;
		string += `場所: ${account.profile.location}、誕生日: ${account.profile.birthday}\n`;
	}

	return string + `「${user.description}」`;
}
