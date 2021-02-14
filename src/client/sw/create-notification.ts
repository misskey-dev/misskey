/*
 * Notification manager for SW
 */
declare var self: ServiceWorkerGlobalScope;

import { getNoteSummary } from '../../misc/get-note-summary';
import getUserName from '../../misc/get-user-name';
import { swLang } from '@/sw/lang';
import { I18n } from '../../misc/i18n';
import { pushNotificationData } from '../../types';

export async function createNotification(data: pushNotificationData) {
	const n = await composeNotification(data);
	if (n) return self.registration.showNotification(...n);
}

async function composeNotification(data: pushNotificationData): Promise<[string, NotificationOptions] | null | undefined> {
	if (!swLang.i18n) swLang.fetchLocale();
	const i18n = await swLang.i18n as I18n<any>;
	const { t } = i18n;
	const { body } = data;

	switch (data.type) {
		/*
		case 'driveFileCreated': // TODO (Server Side)
			return [t('_notification.fileUploaded'), {
				body: body.name,
				icon: body.url,
				data
			}];
		*/
		case 'notification':
			switch (body.type) {
				case 'follow':
					return [t('_notification.youWereFollowed'), {
						body: getUserName(body.user),
						icon: body.user.avatarUrl,
						data,
						actions: [
							{
								action: 'follow',
								title: t('_notification._actions.followBack')
							}
						],
					}];

				case 'mention':
					return [t('_notification.youGotMention', { name: getUserName(body.user) }), {
						body: getNoteSummary(body.note, i18n.locale),
						icon: body.user.avatarUrl,
						data,
						actions: [
							{
								action: 'reply',
								title: t('_notification._actions.reply')
							}
						],
					}];

				case 'reply':
					return [t('_notification.youGotReply', { name: getUserName(body.user) }), {
						body: getNoteSummary(body.note, i18n.locale),
						icon: body.user.avatarUrl,
						data,
						actions: [
							{
								action: 'reply',
								title: t('_notification._actions.reply')
							}
						],
					}];

				case 'renote':
					return [t('_notification.youRenoted', { name: getUserName(body.user) }), {
						body: getNoteSummary(body.note.renote, i18n.locale),
						icon: body.user.avatarUrl,
						data,
						actions: [
							{
								action: 'showUser',
								title: getUserName(body.user)
							}
						],
					}];

				case 'quote':
					return [t('_notification.youGotQuote', { name: getUserName(body.user) }), {
						body: getNoteSummary(body.note, i18n.locale),
						icon: body.user.avatarUrl,
						data,
						actions: [
							{
								action: 'reply',
								title: t('_notification._actions.reply')
							},
							{
								action: 'renote',
								title: t('_notification._actions.renote')
							}
						],
					}];

				case 'reaction':
					return [`${body.reaction} ${getUserName(body.user)}`, {
						body: getNoteSummary(body.note, i18n.locale),
						icon: body.user.avatarUrl,
						data,
						actions: [
							{
								action: 'showUser',
								title: getUserName(body.user)
							}
						],
					}];

				case 'pollVote':
					return [t('_notification.youGotPoll', { name: getUserName(body.user) }), {
						body: getNoteSummary(body.note, i18n.locale),
						icon: body.user.avatarUrl,
						data,
					}];

				case 'receiveFollowRequest':
					return [t('_notification.youReceivedFollowRequest'), {
						body: getUserName(body.user),
						icon: body.user.avatarUrl,
						data,
						actions: [
							{
								action: 'accept',
								title: t('accept')
							},
							{
								action: 'reject',
								title: t('reject')
							}
						],
					}];

				case 'followRequestAccepted':
					return [t('_notification.yourFollowRequestAccepted'), {
						body: getUserName(body.user),
						icon: body.user.avatarUrl,
						data,
					}];

				case 'groupInvited':
					return [t('_notification.youWereInvitedToGroup', { userName: getUserName(body.user) }), {
						body: body.invitation.group.name,
						data,
						actions: [
							{
								action: 'accept',
								title: t('accept')
							},
							{
								action: 'reject',
								title: t('reject')
							}
						],
					}];

				default:
					return null;
			}
		case 'unreadMessagingMessage':
			if (body.groupId === null) {
				return [t('_notification.youGotMessagingMessageFromUser', { name: getUserName(body.user) }), {
					icon: body.user.avatarUrl,
					tag: `messaging:user:${body.userId}`,
					data,
				}];
			}
			return [t('_notification.youGotMessagingMessageFromGroup', { name: body.group.name }), {
				icon: body.user.avatarUrl,
				tag: `messaging:group:${body.groupId}`,
				data,
			}];
		default:
			return null;
	}
}
