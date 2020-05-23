import getNoteSummary from '../../misc/get-note-summary';
import getUserName from '../../misc/get-user-name';
import { clientDb, get, bulkGet } from '../db';

const getTranslation = (text: string): Promise<string> => get(text, clientDb.i18n);

export default async function(type, data): Promise<[string, NotificationOptions]> {
	const contexts = ['deletedNote', 'invisibleNote', 'withNFiles', '_cw.poll'];
	const locale = Object.fromEntries(await bulkGet(contexts, clientDb.i18n) as [string, string][]);

	switch (type) {
		case 'driveFileCreated': // TODO (Server Side)
			return [await getTranslation('_notification.fileUploaded'), {
				body: data.name,
				icon: data.url
			}];
		case 'notification':
			switch (data.type) {
				case 'mention':
					return [(await getTranslation('_notification.youGotMention')).replace('{name}', getUserName(data.user)), {
						body: getNoteSummary(data.note, locale),
						icon: data.user.avatarUrl
					}];

				case 'reply':
					return [(await getTranslation('_notification.youGotReply')).replace('{name}', getUserName(data.user)), {
						body: getNoteSummary(data.note, locale),
						icon: data.user.avatarUrl
					}];

				case 'renote':
					return [(await getTranslation('_notification.youRenoted')).replace('{name}', getUserName(data.user)), {
						body: getNoteSummary(data.note, locale),
						icon: data.user.avatarUrl
					}];

				case 'quote':
					return [(await getTranslation('_notification.youGotQuote')).replace('{name}', getUserName(data.user)), {
						body: getNoteSummary(data.note, locale),
						icon: data.user.avatarUrl
					}];

				case 'reaction':
					return [`${data.reaction} ${getUserName(data.user)}`, {
						body: getNoteSummary(data.note, locale),
						icon: data.user.avatarUrl
					}];

				case 'pollVote':
					return [(await getTranslation('_notification.youGotPoll')).replace('{name}', getUserName(data.user)), {
						body: getNoteSummary(data.note, locale),
						icon: data.user.avatarUrl
					}];

				case 'follow':
					return [await getTranslation('_notification.youWereFollowed'), {
						body: getUserName(data.user),
						icon: data.user.avatarUrl
					}];

				case 'receiveFollowRequest':
					return [await getTranslation('_notification.youReceivedFollowRequest'), {
						body: getUserName(data.user),
						icon: data.user.avatarUrl
					}];

				case 'followRequestAccepted':
					return [await getTranslation('_notification.yourFollowRequestAccepted'), {
						body: getUserName(data.user),
						icon: data.user.avatarUrl
					}];

				case 'groupInvited':
					return [await getTranslation('_notification.youWereInvitedToGroup'), {
						body: data.group.name
					}];

				default:
					return null;
			}
		case 'unreadMessagingMessage':
			if (data.groupId === null) {
				return [(await getTranslation('_notification.youGotMessagingMessageFromUser')).replace('{name}', getUserName(data.user)), {
					icon: data.user.avatarUrl,
					tag: `messaging:user:${data.user.id}`
				}];
			}
			return [(await getTranslation('_notification.youGotMessagingMessageFromGroup')).replace('{name}', data.group.name), {
				icon: data.user.avatarUrl,
				tag: `messaging:group:${data.group.id}`
			}];
		default:
			return null;
	}
}
