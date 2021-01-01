import { getNoteSummary } from '../../misc/get-note-summary';
import getUserName from '../../misc/get-user-name';
import { i18n } from '@/sw/i18n';

export default async function(type, data): Promise<[string, NotificationOptions]> {
	switch (type) {
		case 'driveFileCreated': // TODO (Server Side)
			return [i18n.t('_notification.fileUploaded'), {
				body: data.name,
				icon: data.url
			}];
		case 'notification':
			switch (data.type) {
				case 'mention':
					return [i18n.t('_notification.youGotMention', { name: getUserName(data.user) }), {
						body: getNoteSummary(data.note, i18n.locale),
						icon: data.user.avatarUrl
					}];

				case 'reply':
					return [i18n.t('_notification.youGotReply', { name: getUserName(data.user) }), {
						body: getNoteSummary(data.note, i18n.locale),
						icon: data.user.avatarUrl
					}];

				case 'renote':
					return [i18n.t('_notification.youRenoted', { name: getUserName(data.user) }), {
						body: getNoteSummary(data.note, i18n.locale),
						icon: data.user.avatarUrl
					}];

				case 'quote':
					return [i18n.t('_notification.youGotQuote', { name: getUserName(data.user) }), {
						body: getNoteSummary(data.note, i18n.locale),
						icon: data.user.avatarUrl
					}];

				case 'reaction':
					return [`${data.reaction} ${getUserName(data.user)}`, {
						body: getNoteSummary(data.note, i18n.locale),
						icon: data.user.avatarUrl
					}];

				case 'pollVote':
					return [i18n.t('_notification.youGotPoll', { name: getUserName(data.user) }), {
						body: getNoteSummary(data.note, i18n.locale),
						icon: data.user.avatarUrl
					}];

				case 'follow':
					return [i18n.t('_notification.youWereFollowed'), {
						body: getUserName(data.user),
						icon: data.user.avatarUrl
					}];

				case 'receiveFollowRequest':
					return [i18n.t('_notification.youReceivedFollowRequest'), {
						body: getUserName(data.user),
						icon: data.user.avatarUrl
					}];

				case 'followRequestAccepted':
					return [i18n.t('_notification.yourFollowRequestAccepted'), {
						body: getUserName(data.user),
						icon: data.user.avatarUrl
					}];

				case 'groupInvited':
					return [i18n.t('_notification.youWereInvitedToGroup'), {
						body: data.group.name
					}];

				default:
					return null;
			}
		case 'unreadMessagingMessage':
			if (data.groupId === null) {
				return [i18n.t('_notification.youGotMessagingMessageFromUser', { name: getUserName(data.user) }), {
					icon: data.user.avatarUrl,
					tag: `messaging:user:${data.user.id}`
				}];
			}
			return [i18n.t('_notification.youGotMessagingMessageFromGroup', { name: data.group.name }), {
				icon: data.user.avatarUrl,
				tag: `messaging:group:${data.group.id}`
			}];
		default:
			return null;
	}
}
