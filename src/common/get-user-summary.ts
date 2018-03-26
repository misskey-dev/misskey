import { IUser } from '../api/models/user';

/**
 * ユーザーを表す文字列を取得します。
 * @param user ユーザー
 */
export default function(user: IUser): string {
	return `${user.name} (@${user.username})\n` +
		`${user.posts_count}投稿、${user.following_count}フォロー、${user.followers_count}フォロワー\n` +
		`場所: ${user.account.profile.location}、誕生日: ${user.account.profile.birthday}\n` +
		`「${user.description}」`;
}
