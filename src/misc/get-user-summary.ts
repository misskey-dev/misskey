import { IUser, isLocalUser } from '../models/user';
import getAcct from './acct/render';
import getUserName from './get-user-name';

/**
 * ユーザーを表す文字列を取得します。
 * @param user ユーザー
 */
export default function(user: IUser): string {
	return `${getUserName(user)} (@${getAcct(user)})
${user.notesCount}投稿、${user.followingCount}フォロー、${user.followersCount}フォロワー
${isLocalUser(user) ? `場所: ${user.profile.location}、誕生日: ${user.profile.birthday}
` : ''}「${user.description}」`;
}
