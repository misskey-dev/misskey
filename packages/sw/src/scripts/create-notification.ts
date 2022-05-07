/*
 * Notification manager for SW
 */
declare var self: ServiceWorkerGlobalScope;

import { swLang } from '@/scripts/lang';
import { cli } from '@/scripts/operations';
import { pushNotificationDataMap } from '@/types';
import getUserName from '@/scripts/get-user-name';
import { I18n } from '@/scripts/i18n';
import { getAccountFromId } from '@/scripts/get-account-from-id';

export async function createNotification<K extends keyof pushNotificationDataMap>(data: pushNotificationDataMap[K]) {
	const n = await composeNotification(data);

	if (n) {
		return self.registration.showNotification(...n);
	} else {
		console.error('Could not compose notification', data);
		return createEmptyNotification();
	}
}

async function composeNotification<K extends keyof pushNotificationDataMap>(data: pushNotificationDataMap[K]): Promise<[string, NotificationOptions] | null> {
	if (!swLang.i18n) swLang.fetchLocale();
	const i18n = await swLang.i18n as I18n<any>;
	const { t } = i18n;
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
			switch (data.body.type) {
				case 'follow':
					// users/showの型定義をswos.apiへ当てはめるのが困難なのでapiFetch.requestを直接使用
					const account = await getAccountFromId(data.userId);
					if (!account) return null;
					const userDetail = await cli.request('users/show', { userId: data.body.userId }, account.token);
					return [t('_notification.youWereFollowed'), {
						body: getUserName(data.body.user),
						icon: data.body.user.avatarUrl,
						data,
						actions: userDetail.isFollowing ? [] : [
							{
								action: 'follow',
								title: t('_notification._actions.followBack')
							}
						],
					}];

				case 'mention':
					return [t('_notification.youGotMention', { name: getUserName(data.body.user) }), {
						body: data.body.note.text || '',
						icon: data.body.user.avatarUrl,
						data,
						actions: [
							{
								action: 'reply',
								title: t('_notification._actions.reply')
							}
						],
					}];

				case 'reply':
					return [t('_notification.youGotReply', { name: getUserName(data.body.user) }), {
						body: data.body.note.text || '',
						icon: data.body.user.avatarUrl,
						data,
						actions: [
							{
								action: 'reply',
								title: t('_notification._actions.reply')
							}
						],
					}];

				case 'renote':
					return [t('_notification.youRenoted', { name: getUserName(data.body.user) }), {
						body: data.body.note.text || '',
						icon: data.body.user.avatarUrl,
						data,
						actions: [
							{
								action: 'showUser',
								title: getUserName(data.body.user)
							}
						],
					}];

				case 'quote':
					return [t('_notification.youGotQuote', { name: getUserName(data.body.user) }), {
						body: data.body.note.text || '',
						icon: data.body.user.avatarUrl,
						data,
						actions: [
							{
								action: 'reply',
								title: t('_notification._actions.reply')
							},
							...((data.body.note.visibility === 'public' || data.body.note.visibility === 'home') ? [
							{
								action: 'renote',
								title: t('_notification._actions.renote')
							}
							] : [])
						],
					}];

				case 'reaction':
					return [`${data.body.reaction} ${getUserName(data.body.user)}`, {
						body: data.body.note.text || '',
						icon: data.body.user.avatarUrl,
						data,
						actions: [
							{
								action: 'showUser',
								title: getUserName(data.body.user)
							}
						],
					}];

				case 'pollVote':
					return [t('_notification.youGotPoll', { name: getUserName(data.body.user) }), {
						body: data.body.note.text || '',
						icon: data.body.user.avatarUrl,
						data,
					}];

				case 'pollEnded':
					return [t('_notification.pollEnded'), {
						body: data.body.note.text || '',
						data,
					}];

				case 'receiveFollowRequest':
					return [t('_notification.youReceivedFollowRequest'), {
						body: getUserName(data.body.user),
						icon: data.body.user.avatarUrl,
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
						body: getUserName(data.body.user),
						icon: data.body.user.avatarUrl,
						data,
					}];

				case 'groupInvited':
					return [t('_notification.youWereInvitedToGroup', { userName: getUserName(data.body.user) }), {
						body: data.body.invitation.group.name,
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

				case 'app':
						return [data.body.header || data.body.body, {
							body: data.body.header && data.body.body,
							icon: data.body.icon,
							data
						}];

				default:
					return null;
			}
		case 'unreadMessagingMessage':
			if (data.body.groupId === null) {
				return [t('_notification.youGotMessagingMessageFromUser', { name: getUserName(data.body.user) }), {
					icon: data.body.user.avatarUrl,
					tag: `messaging:user:${data.body.userId}`,
					data,
					renotify: true,
				}];
			}
			return [t('_notification.youGotMessagingMessageFromGroup', { name: data.body.group.name }), {
				icon: data.body.user.avatarUrl,
				tag: `messaging:group:${data.body.groupId}`,
				data,
				renotify: true,
			}];
		default:
			return null;
	}
}

export async function createEmptyNotification() {
	return new Promise<void>(async res => {
		if (!swLang.i18n) swLang.fetchLocale();
		const i18n = await swLang.i18n as I18n<any>;
		const { t } = i18n;
	
		await self.registration.showNotification(
			t('_notification.emptyPushNotificationMessage'),
			{
				silent: true,
				tag: 'read_notification',
			}
		);

		res();

		setTimeout(async () => {
			for (const n of
				[
					...(await self.registration.getNotifications({ tag: 'user_visible_auto_notification' })),
					...(await self.registration.getNotifications({ tag: 'read_notification' }))
				]
			) {
				n.close();
			}
		}, 1000);
	});
}
