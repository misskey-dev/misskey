/**
 * Notification composer of Service Worker
 */
declare var self: ServiceWorkerGlobalScope;

import { getNoteSummary } from '../../misc/get-note-summary';
import getUserName from '../../misc/get-user-name';

export default async function(data, i18n): Promise<[string, NotificationOptions] | null | undefined> {
	if (!i18n) {
		console.log('no i18n');
		return;
	}

	switch (data.type) {
		case 'driveFileCreated': // TODO (Server Side)
			return [i18n.t('_notification.fileUploaded'), {
				body: data.body.name,
				icon: data.body.url,
				data
			}];
		case 'notification':
			switch (data.body.type) {
				case 'mention':
					return [i18n.t('_notification.youGotMention', { name: getUserName(data.body.user) }), {
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
					return [i18n.t('_notification.youGotReply', { name: getUserName(data.body.user) }), {
						body: getNoteSummary(data.body.note, i18n.locale),
						icon: data.body.user.avatarUrl
					}];

				case 'renote':
					return [i18n.t('_notification.youRenoted', { name: getUserName(data.body.user) }), {
						body: getNoteSummary(data.body.note, i18n.locale),
						icon: data.body.user.avatarUrl
					}];

				case 'quote':
					return [i18n.t('_notification.youGotQuote', { name: getUserName(data.body.user) }), {
						body: getNoteSummary(data.body.note, i18n.locale),
						icon: data.body.user.avatarUrl
					}];

				case 'reaction':
					return [`${data.body.reaction} ${getUserName(data.body.user)}`, {
						body: getNoteSummary(data.body.note, i18n.locale),
						icon: data.body.user.avatarUrl
					}];

				case 'pollVote':
					return [i18n.t('_notification.youGotPoll', { name: getUserName(data.body.user) }), {
						body: getNoteSummary(data.body.note, i18n.locale),
						icon: data.body.user.avatarUrl
					}];

				case 'follow':
					return [i18n.t('_notification.youWereFollowed'), {
						body: getUserName(data.body.user),
						icon: data.body.user.avatarUrl
					}];

				case 'receiveFollowRequest':
					return [i18n.t('_notification.youReceivedFollowRequest'), {
						body: getUserName(data.body.user),
						icon: data.body.user.avatarUrl
					}];

				case 'followRequestAccepted':
					return [i18n.t('_notification.yourFollowRequestAccepted'), {
						body: getUserName(data.body.user),
						icon: data.body.user.avatarUrl
					}];

				case 'groupInvited':
					return [i18n.t('_notification.youWereInvitedToGroup'), {
						body: data.body.group.name
					}];

				default:
					return null;
			}
		case 'unreadMessagingMessage':
			if (data.body.groupId === null) {
				return [i18n.t('_notification.youGotMessagingMessageFromUser', { name: getUserName(data.body.user) }), {
					icon: data.body.user.avatarUrl,
					tag: `messaging:user:${data.body.user.id}`
				}];
			}
			return [i18n.t('_notification.youGotMessagingMessageFromGroup', { name: data.body.group.name }), {
				icon: data.body.user.avatarUrl,
				tag: `messaging:group:${data.body.group.id}`
			}];
		default:
			return null;
	}
}
