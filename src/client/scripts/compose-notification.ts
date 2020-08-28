import getNoteSummary from '../../misc/get-note-summary';
import getUserName from '../../misc/get-user-name';
import { clientDb, get, bulkGet } from '../db';

const getTranslation = (text: string): Promise<string> => get(text, clientDb.i18n);

export default async function(type, data): Promise<[string, NotificationOptions]> {
	const contexts = ['deletedNote', 'invisibleNote', 'withNFiles', 'poll'];
	const locale = Object.fromEntries(await bulkGet(contexts, clientDb.i18n) as [string, string][]);

	switch (type) {
		case 'driveFileCreated': // TODO (Server Side)
			return [await getTranslation('_notification.fileUploaded'), {
				body: data.name,
				icon: data.url,
				data: {
					type: 'driveFileCreated',
					data
				}
			}];
		case 'notification':
			switch (data.type) {
				case 'mention':
					return [(await getTranslation('_notification.youGotMention')).replace('{name}', getUserName(data.user)), {
						body: getNoteSummary(data.note, locale),
						icon: data.user.avatarUrl,
						data: {
							type: 'mention',
							data,
							isNotification: true,
						}
					}];

				case 'reply':
					return [(await getTranslation('_notification.youGotReply')).replace('{name}', getUserName(data.user)), {
						body: getNoteSummary(data.note, locale),
						icon: data.user.avatarUrl,
						data: {
							type: 'reply',
							data,
							isNotification: true,
						}
					}];

				case 'renote':
					return [(await getTranslation('_notification.youRenoted')).replace('{name}', getUserName(data.user)), {
						body: getNoteSummary(data.note, locale),
						icon: data.user.avatarUrl,
						data: {
							type: 'renote',
							data,
							isNotification: true,
						}
					}];

				case 'quote':
					return [(await getTranslation('_notification.youGotQuote')).replace('{name}', getUserName(data.user)), {
						body: getNoteSummary(data.note, locale),
						icon: data.user.avatarUrl,
						data: {
							type: 'quote',
							data,
							isNotification: true,
						}
					}];

				case 'reaction':
					return [`${data.reaction} ${getUserName(data.user)}`, {
						body: getNoteSummary(data.note, locale),
						icon: data.user.avatarUrl,
						data: {
							type: 'reaction',
							data,
							isNotification: true,
						},
						actions: [
							{
								action: 'showUser',
								title: 'showUser'
							}
						]
					}];

				case 'pollVote':
					return [(await getTranslation('_notification.youGotPoll')).replace('{name}', getUserName(data.user)), {
						body: getNoteSummary(data.note, locale),
						icon: data.user.avatarUrl,
						data: {
							type: 'pollVote',
							data,
							isNotification: true,
						}
					}];

				case 'follow':
					return [await getTranslation('_notification.youWereFollowed'), {
						body: getUserName(data.user),
						icon: data.user.avatarUrl,
						data: {
							type: 'follow',
							data,
							isNotification: true,
						}
					}];

				case 'receiveFollowRequest':
					return [await getTranslation('_notification.youReceivedFollowRequest'), {
						body: getUserName(data.user),
						icon: data.user.avatarUrl,
						data: {
							type: 'receiveFollowRequest',
							data,
							isNotification: true,
						}
					}];

				case 'followRequestAccepted':
					return [await getTranslation('_notification.yourFollowRequestAccepted'), {
						body: getUserName(data.user),
						icon: data.user.avatarUrl,
						data: {
							type: 'followRequestAccepted',
							data,
							isNotification: true,
						}
					}];

				case 'groupInvited':
					return [await getTranslation('_notification.youWereInvitedToGroup'), {
						body: data.group.name,
						data: {
							type: 'groupInvited',
							data,
							isNotification: true,
						}
					}];

				default:
					return null;
			}
		case 'unreadMessagingMessage':
			if (data.groupId === null) {
				return [(await getTranslation('_notification.youGotMessagingMessageFromUser')).replace('{name}', getUserName(data.user)), {
					icon: data.user.avatarUrl,
					tag: `messaging:user:${data.user.id}`,
					data: {
						type: 'unreadMessagingMessage',
						data
					}
				}];
			}
			return [(await getTranslation('_notification.youGotMessagingMessageFromGroup')).replace('{name}', data.group.name), {
				icon: data.user.avatarUrl,
				tag: `messaging:group:${data.group.id}`,
				data: {
					type: 'unreadMessagingMessage',
					data
				}
			}];
		default:
			return null;
	}
}
