/*
 * Notification manager for SW
 */
declare var self: ServiceWorkerGlobalScope;

import { getNoteSummary } from '../../misc/get-note-summary';
import getUserName from '../../misc/get-user-name';
import { swLang } from '@/sw/lang';
import { I18n } from '@/scripts/i18n';
import { pushNotificationData } from '../../types';

export async function createNotification(data: pushNotificationData) {
	const n = await composeNotification(data);
	if (n) return self.registration.showNotification(...n);
}

async function composeNotification(data: pushNotificationData): Promise<[string, NotificationOptions] | null | undefined> {
	if (!swLang.i18n) swLang.fetchLocale();
	const i18n = await swLang.i18n as I18n<any>;
	const { t } = i18n;

	switch (data.type) {
		/*
		case 'driveFileCreated': // TODO (Server Side)
			return [t('_notification.fileUploaded'), {
				body: data.body.name,
				icon: data.body.url,
				data
			}];
		*/
		case 'notification':
			switch (data.body.type) {
				case 'mention':
					return [t('_notification.youGotMention', { name: getUserName(data.body.user) }), {
						body: getNoteSummary(data.body.note, i18n.locale),
						icon: data.body.user.avatarUrl,
						data,
						actions: [
							{
								action: 'showUser',
								title: 'showUser'
							}
						]
					}];

				case 'reply':
					return [t('_notification.youGotReply', { name: getUserName(data.body.user) }), {
						body: getNoteSummary(data.body.note, i18n.locale),
						icon: data.body.user.avatarUrl,
						data,
					}];

				case 'renote':
					return [t('_notification.youRenoted', { name: getUserName(data.body.user) }), {
						body: getNoteSummary(data.body.note, i18n.locale),
						icon: data.body.user.avatarUrl,
						data,
					}];

				case 'quote':
					return [t('_notification.youGotQuote', { name: getUserName(data.body.user) }), {
						body: getNoteSummary(data.body.note, i18n.locale),
						icon: data.body.user.avatarUrl,
						data,
					}];

				case 'reaction':
					return [`${data.body.reaction} ${getUserName(data.body.user)}`, {
						body: getNoteSummary(data.body.note, i18n.locale),
						icon: data.body.user.avatarUrl,
						data,
					}];

				case 'pollVote':
					return [t('_notification.youGotPoll', { name: getUserName(data.body.user) }), {
						body: getNoteSummary(data.body.note, i18n.locale),
						icon: data.body.user.avatarUrl,
						data,
					}];

				case 'follow':
					return [t('_notification.youWereFollowed'), {
						body: getUserName(data.body.user),
						icon: data.body.user.avatarUrl,
						data,
					}];

				case 'receiveFollowRequest':
					return [t('_notification.youReceivedFollowRequest'), {
						body: getUserName(data.body.user),
						icon: data.body.user.avatarUrl,
						data,
					}];

				case 'followRequestAccepted':
					return [t('_notification.yourFollowRequestAccepted'), {
						body: getUserName(data.body.user),
						icon: data.body.user.avatarUrl,
						data,
					}];

				case 'groupInvited':
					return [t('_notification.youWereInvitedToGroup'), {
						body: data.body.group.name,
						data,
					}];

				default:
					return null;
			}
		case 'unreadMessagingMessage':
			if (data.body.groupId === null) {
				return [t('_notification.youGotMessagingMessageFromUser', { name: getUserName(data.body.user) }), {
					icon: data.body.user.avatarUrl,
					tag: `messaging:user:${data.body.user.id}`,
					data,
				}];
			}
			return [t('_notification.youGotMessagingMessageFromGroup', { name: data.body.group.name }), {
				icon: data.body.user.avatarUrl,
				tag: `messaging:group:${data.body.group.id}`,
				data,
			}];
		default:
			return null;
	}
}
