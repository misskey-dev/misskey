/*
 * Notification manager for SW
 */
declare var self: ServiceWorkerGlobalScope;

import { getNoteSummary } from '../../misc/get-note-summary';
import getUserName from '../../misc/get-user-name';
import { swLang } from '@/sw/lang';

class SwNotification {
	private queue: any[] = [];

	private fetching = false;

	public async append(data) {
		if (swLang.i18n) {
			const n = await this.composeNotification(data);
			if (n) return self.registration.showNotification(...n);
		} else {
			this.queue.push(data);
			if (this.fetching == false) {
				this.fetching = true;
				await swLang.fetchLocale();
				const promises = this.queue.map(this.composeNotification).map(n => {
					if (!n) return;
					return self.registration.showNotification(...n);
				});
				this.fetching = false;
				this.queue = [];
				return Promise.all(promises);
			}
		}
	}

	private composeNotification(data): [string, NotificationOptions] | null | undefined {
		const { i18n } = swLang;
		if (!i18n) return;
		const { t } = i18n;

		switch (data.type) {
			case 'driveFileCreated': // TODO (Server Side)
				return [t('_notification.fileUploaded'), {
					body: data.body.name,
					icon: data.body.url,
					data
				}];
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
							icon: data.body.user.avatarUrl
						}];
	
					case 'renote':
						return [t('_notification.youRenoted', { name: getUserName(data.body.user) }), {
							body: getNoteSummary(data.body.note, i18n.locale),
							icon: data.body.user.avatarUrl
						}];
	
					case 'quote':
						return [t('_notification.youGotQuote', { name: getUserName(data.body.user) }), {
							body: getNoteSummary(data.body.note, i18n.locale),
							icon: data.body.user.avatarUrl
						}];
	
					case 'reaction':
						return [`${data.body.reaction} ${getUserName(data.body.user)}`, {
							body: getNoteSummary(data.body.note, i18n.locale),
							icon: data.body.user.avatarUrl
						}];
	
					case 'pollVote':
						return [t('_notification.youGotPoll', { name: getUserName(data.body.user) }), {
							body: getNoteSummary(data.body.note, i18n.locale),
							icon: data.body.user.avatarUrl
						}];
	
					case 'follow':
						return [t('_notification.youWereFollowed'), {
							body: getUserName(data.body.user),
							icon: data.body.user.avatarUrl
						}];
	
					case 'receiveFollowRequest':
						return [t('_notification.youReceivedFollowRequest'), {
							body: getUserName(data.body.user),
							icon: data.body.user.avatarUrl
						}];
	
					case 'followRequestAccepted':
						return [t('_notification.yourFollowRequestAccepted'), {
							body: getUserName(data.body.user),
							icon: data.body.user.avatarUrl
						}];
	
					case 'groupInvited':
						return [t('_notification.youWereInvitedToGroup'), {
							body: data.body.group.name
						}];
	
					default:
						return null;
				}
			case 'unreadMessagingMessage':
				if (data.body.groupId === null) {
					return [t('_notification.youGotMessagingMessageFromUser', { name: getUserName(data.body.user) }), {
						icon: data.body.user.avatarUrl,
						tag: `messaging:user:${data.body.user.id}`
					}];
				}
				return [t('_notification.youGotMessagingMessageFromGroup', { name: data.body.group.name }), {
					icon: data.body.user.avatarUrl,
					tag: `messaging:group:${data.body.group.id}`
				}];
			default:
				return null;
		}
	}
	
}

export const swNotification = new SwNotification();
