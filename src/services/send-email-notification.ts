import { UserProfiles } from '../models';
import { User } from '../models/entities/user';
import { sendEmail } from './send-email';
import * as locales from '../../locales/';
import { I18n } from '../misc/i18n';

// TODO: locale ファイルをクライアント用とサーバー用で分けたい

async function follow(userId: User['id'], args: {}) {
	const userProfile = await UserProfiles.findOneOrFail({ userId: userId });
	if (!userProfile.email || !userProfile.emailNotificationTypes.includes('follow')) return;
	const locale = locales[userProfile.lang || 'ja-JP'];
	const i18n = new I18n(locale);
	sendEmail(userProfile.email, i18n.t('_email._follow.title'), 'test', 'test');
}

async function receiveFollowRequest(userId: User['id'], args: {}) {
	const userProfile = await UserProfiles.findOneOrFail({ userId: userId });
	if (!userProfile.email || !userProfile.emailNotificationTypes.includes('receiveFollowRequest')) return;
	const locale = locales[userProfile.lang || 'ja-JP'];
	const i18n = new I18n(locale);
	sendEmail(userProfile.email, i18n.t('_email._receiveFollowRequest.title'), 'test', 'test');
}

export const sendEmailNotification = {
	follow,
	receiveFollowRequest,
};
