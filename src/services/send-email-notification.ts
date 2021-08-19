import { UserProfiles } from '@/models/index.js';
import { User } from '@/models/entities/user.js';
import { sendEmail } from './send-email.js';
import * as locales from '../../locales/index.js';
import { I18n } from '@/misc/i18n.js';
import { getAcct } from '@/misc/acct.js';

// TODO: locale ファイルをクライアント用とサーバー用で分けたい

async function follow(userId: User['id'], follower: User) {
	const userProfile = await UserProfiles.findOneOrFail({ userId: userId });
	if (!userProfile.email || !userProfile.emailNotificationTypes.includes('follow')) return;
	const locale = locales[userProfile.lang || 'ja-JP'];
	const i18n = new I18n(locale);
	// TODO: render user information html
	sendEmail(userProfile.email, i18n.t('_email._follow.title'), `${follower.name} (@${getAcct(follower)})`, `${follower.name} (@${getAcct(follower)})`);
}

async function receiveFollowRequest(userId: User['id'], follower: User) {
	const userProfile = await UserProfiles.findOneOrFail({ userId: userId });
	if (!userProfile.email || !userProfile.emailNotificationTypes.includes('receiveFollowRequest')) return;
	const locale = locales[userProfile.lang || 'ja-JP'];
	const i18n = new I18n(locale);
	// TODO: render user information html
	sendEmail(userProfile.email, i18n.t('_email._receiveFollowRequest.title'), `${follower.name} (@${getAcct(follower)})`, `${follower.name} (@${getAcct(follower)})`);
}

export const sendEmailNotification = {
	follow,
	receiveFollowRequest,
};
