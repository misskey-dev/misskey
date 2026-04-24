/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toUnicode } from 'punycode.js';
import { defineAsyncComponent, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import { host, url } from '@@/js/config.js';
import type { Router } from '@/router.js';
import type { MenuItem } from '@/types/menu.js';
import { i18n } from '@/i18n.js';
import { copyToClipboard } from '@/utility/copy-to-clipboard.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { $i, iAmModerator } from '@/i.js';
import { notesSearchAvailable, canSearchNonLocalNotes } from '@/utility/check-permissions.js';
import { antennasCache, rolesCache, userListsCache } from '@/cache.js';
import { mainRouter } from '@/router.js';
import { genEmbedCode } from '@/utility/get-embed-code.js';
import { prefer } from '@/preferences.js';
import { getPluginHandlers } from '@/plugin.js';

export function getUserMenu(user: Misskey.entities.UserDetailed, router: Router = mainRouter) {
	const meId = $i ? $i.id : null;

	const cleanups = [] as (() => void)[];

	async function toggleMute() {
		if (user.isMuted) {
			os.apiWithDialog('mute/delete', {
				userId: user.id,
			}).then(() => {
				user.isMuted = false;
			});
		} else {
			const { canceled, result: period } = await os.select({
				title: i18n.ts.mutePeriod,
				items: [{
					value: 'indefinitely', label: i18n.ts.indefinitely,
				}, {
					value: 'tenMinutes', label: i18n.ts.tenMinutes,
				}, {
					value: 'oneHour', label: i18n.ts.oneHour,
				}, {
					value: 'oneDay', label: i18n.ts.oneDay,
				}, {
					value: 'oneWeek', label: i18n.ts.oneWeek,
				}],
				default: 'indefinitely',
			});
			if (canceled) return;

			const expiresAt = period === 'indefinitely' ? null
				: period === 'tenMinutes' ? Date.now() + (1000 * 60 * 10)
				: period === 'oneHour' ? Date.now() + (1000 * 60 * 60)
				: period === 'oneDay' ? Date.now() + (1000 * 60 * 60 * 24)
				: period === 'oneWeek' ? Date.now() + (1000 * 60 * 60 * 24 * 7)
				: null;

			os.apiWithDialog('mute/create', {
				userId: user.id,
				expiresAt,
			}).then(() => {
				user.isMuted = true;
			});
		}
	}

	async function toggleRenoteMute() {
		os.apiWithDialog(user.isRenoteMuted ? 'renote-mute/delete' : 'renote-mute/create', {
			userId: user.id,
		}).then(() => {
			user.isRenoteMuted = !user.isRenoteMuted;
		});
	}

	async function toggleBlock() {
		if (!await getConfirmed(user.isBlocking ? i18n.ts.unblockConfirm : i18n.ts.blockConfirm)) return;

		os.apiWithDialog(user.isBlocking ? 'blocking/delete' : 'blocking/create', {
			userId: user.id,
		}).then(() => {
			user.isBlocking = !user.isBlocking;
		});
	}

	async function toggleNotify() {
		os.apiWithDialog('following/update', {
			userId: user.id,
			notify: user.notify === 'normal' ? 'none' : 'normal',
		}).then(() => {
			user.notify = user.notify === 'normal' ? 'none' : 'normal';
		});
	}

	async function reportAbuse() {
		const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkAbuseReportWindow.vue').then(x => x.default), {
			user: user,
		}, {
			closed: () => dispose(),
		});
	}

	async function getConfirmed(text: string): Promise<boolean> {
		const confirm = await os.confirm({
			type: 'warning',
			title: 'confirm',
			text,
		});

		return !confirm.canceled;
	}

	async function userInfoUpdate() {
		os.apiWithDialog('federation/update-remote-user', {
			userId: user.id,
		});
	}

	async function invalidateFollow() {
		if (!await getConfirmed(i18n.ts.breakFollowConfirm)) return;

		os.apiWithDialog('following/invalidate', {
			userId: user.id,
		}).then(() => {
			user.isFollowed = !user.isFollowed;
		});
	}

	async function editMemo(): Promise<void> {
		const userDetailed = await misskeyApi('users/show', {
			userId: user.id,
		});

		const { canceled, result } = await os.form(i18n.ts.editMemo, {
			memo: {
				type: 'string',
				required: true,
				multiline: true,
				label: i18n.ts.memo,
				default: userDetailed.memo,
			},
		});

		if (canceled) return;

		os.apiWithDialog('users/update-memo', {
			memo: result.memo,
			userId: user.id,
		});
	}

	const menuItems: MenuItem[] = [];

	if (iAmModerator) {
		menuItems.push({
			icon: 'ti ti-user-exclamation',
			text: i18n.ts.moderation,
			action: () => {
				router.push('/admin/user/:userId', {
					params: {
						userId: user.id,
					},
				});
			},
		}, { type: 'divider' });
	}

	menuItems.push({
		icon: 'ti ti-at',
		text: i18n.ts.copyUsername,
		action: () => {
			copyToClipboard(`@${user.username}@${user.host ?? host}`);
		},
	});

	menuItems.push({
		icon: 'ti ti-share',
		text: i18n.ts.copyProfileUrl,
		action: () => {
			const canonical = user.host === null ? `@${user.username}` : `@${user.username}@${toUnicode(user.host)}`;
			copyToClipboard(`${url}/${canonical}`);
		},
	});

	menuItems.push({
		icon: 'ti ti-rss',
		text: i18n.ts.copyRSS,
		action: () => {
			copyToClipboard(`${user.host ?? host}/@${user.username}.atom`);
		},
	});

	if (user.host != null && user.url != null) {
		menuItems.push({
			icon: 'ti ti-external-link',
			text: i18n.ts.showOnRemote,
			action: () => {
				if (user.url == null) return;
				window.open(user.url, '_blank', 'noopener');
			},
		});
	} else {
		menuItems.push({
			icon: 'ti ti-code',
			text: i18n.ts.embed,
			type: 'parent',
			children: [{
				text: i18n.ts.noteOfThisUser,
				action: () => {
					genEmbedCode('user-timeline', user.id);
				},
			}], // TODO: ユーザーカードの埋め込みなど
		});
	}

	if ($i && meId === user.id) {
		menuItems.push({
			icon: 'ti ti-qrcode',
			text: i18n.ts.qr,
			action: () => {
				router.push('/qr');
			},
		});
	}

	if (notesSearchAvailable && (user.host == null || canSearchNonLocalNotes)) {
		menuItems.push({
			icon: 'ti ti-search',
			text: i18n.ts.searchThisUsersNotes,
			action: () => {
				const query = {
						username: user.username,
					} as { username: string, host?: string };

				if (user.host !== null) {
					query.host = user.host;
				}

				router.push('/search', {
					query
				});
			},
		});
	}

	if ($i) {
		menuItems.push({ type: 'divider' }, {
			icon: 'ti ti-pencil',
			text: i18n.ts.editMemo,
			action: editMemo,
		}, {
			type: 'parent',
			icon: 'ti ti-list',
			text: i18n.ts.addToList,
			children: async () => {
				const lists = await userListsCache.fetch();
				return lists.map(list => {
					const isListed = ref(list.userIds?.includes(user.id) ?? false);
					cleanups.push(watch(isListed, () => {
						if (isListed.value) {
							os.apiWithDialog('users/lists/push', {
								listId: list.id,
								userId: user.id,
							}).then(() => {
								list.userIds?.push(user.id);
							});
						} else {
							os.apiWithDialog('users/lists/pull', {
								listId: list.id,
								userId: user.id,
							}).then(() => {
								list.userIds?.splice(list.userIds.indexOf(user.id), 1);
							});
						}
					}));

					return {
						type: 'switch',
						text: list.name,
						ref: isListed,
					};
				});
			},
		}, {
			type: 'parent',
			icon: 'ti ti-antenna',
			text: i18n.ts.addToAntenna,
			children: async () => {
				const antennas = await antennasCache.fetch();
				const canonical = user.host === null ? `@${user.username}` : `@${user.username}@${toUnicode(user.host)}`;
				return antennas.filter((a) => a.src === 'users').map(antenna => ({
					text: antenna.name,
					action: async () => {
						await os.apiWithDialog('antennas/update', {
							antennaId: antenna.id,
							name: antenna.name,
							keywords: antenna.keywords,
							excludeKeywords: antenna.excludeKeywords,
							src: antenna.src,
							userListId: antenna.userListId,
							users: [...antenna.users, canonical],
							caseSensitive: antenna.caseSensitive,
							withReplies: antenna.withReplies,
							withFile: antenna.withFile,
						});
						antennasCache.delete();
					},
				}));
			},
		});
	}

	if ($i && meId !== user.id) {
		if (iAmModerator) {
			menuItems.push({
				type: 'parent',
				icon: 'ti ti-badges',
				text: i18n.ts.roles,
				children: async () => {
					const roles = await rolesCache.fetch();

					return roles.filter(r => r.target === 'manual').map(r => ({
						text: r.name,
						action: async () => {
							const { canceled, result: period } = await os.select({
								title: i18n.ts.period + ': ' + r.name,
								items: [{
									value: 'indefinitely', label: i18n.ts.indefinitely,
								}, {
									value: 'oneHour', label: i18n.ts.oneHour,
								}, {
									value: 'oneDay', label: i18n.ts.oneDay,
								}, {
									value: 'oneWeek', label: i18n.ts.oneWeek,
								}, {
									value: 'oneMonth', label: i18n.ts.oneMonth,
								}],
								default: 'indefinitely',
							});
							if (canceled) return;

							const expiresAt = period === 'indefinitely' ? null
								: period === 'oneHour' ? Date.now() + (1000 * 60 * 60)
								: period === 'oneDay' ? Date.now() + (1000 * 60 * 60 * 24)
								: period === 'oneWeek' ? Date.now() + (1000 * 60 * 60 * 24 * 7)
								: period === 'oneMonth' ? Date.now() + (1000 * 60 * 60 * 24 * 30)
								: null;

							os.apiWithDialog('admin/roles/assign', { roleId: r.id, userId: user.id, expiresAt });
						},
					}));
				},
			});
		}

		// フォローしたとしても user.isFollowing はリアルタイム更新されないので不便なため
		//if (user.isFollowing) {
		const withRepliesRef = ref(user.withReplies ?? false);

		menuItems.push({
			type: 'switch',
			icon: 'ti ti-messages',
			text: i18n.ts.showRepliesToOthersInTimeline,
			ref: withRepliesRef,
		}, {
			icon: user.notify === 'none' ? 'ti ti-bell' : 'ti ti-bell-off',
			text: user.notify === 'none' ? i18n.ts.notifyNotes : i18n.ts.unnotifyNotes,
			action: toggleNotify,
		});

		watch(withRepliesRef, (withReplies) => {
			misskeyApi('following/update', {
				userId: user.id,
				withReplies,
			}).then(() => {
				user.withReplies = withReplies;
			});
		});
		//}

		menuItems.push({ type: 'divider' }, {
			icon: 'ti ti-pencil-heart',
			text: i18n.ts.createUserSpecifiedNote,
			action: () => {
				const canonical = user.host === null ? `@${user.username}` : `@${user.username}@${user.host}`;
				os.post({ specified: user, initialText: `${canonical} ` });
			},
		});

		if ($i.policies.chatAvailability === 'available' && user.canChat && user.host == null) {
			menuItems.push({
				type: 'link',
				icon: 'ti ti-messages',
				text: i18n.ts._chat.chatWithThisUser,
				to: `/chat/user/${user.id}`,
			});
		}

		menuItems.push({ type: 'divider' }, {
			icon: user.isMuted ? 'ti ti-eye' : 'ti ti-eye-off',
			text: user.isMuted ? i18n.ts.unmute : i18n.ts.mute,
			action: toggleMute,
		}, {
			icon: user.isRenoteMuted ? 'ti ti-repeat' : 'ti ti-repeat-off',
			text: user.isRenoteMuted ? i18n.ts.renoteUnmute : i18n.ts.renoteMute,
			action: toggleRenoteMute,
		}, {
			icon: 'ti ti-ban',
			text: user.isBlocking ? i18n.ts.unblock : i18n.ts.block,
			action: toggleBlock,
		});

		if (user.isFollowed) {
			menuItems.push({
				icon: 'ti ti-link-off',
				text: i18n.ts.breakFollow,
				action: invalidateFollow,
			});
		}

		menuItems.push({ type: 'divider' }, {
			icon: 'ti ti-exclamation-circle',
			text: i18n.ts.reportAbuse,
			action: reportAbuse,
		});
	}

	if (user.host !== null) {
		menuItems.push({ type: 'divider' }, {
			icon: 'ti ti-refresh',
			text: i18n.ts.updateRemoteUser,
			action: userInfoUpdate,
		});
	}

	if (prefer.s.devMode) {
		menuItems.push({ type: 'divider' }, {
			icon: 'ti ti-hash',
			text: i18n.ts.copyUserId,
			action: () => {
				copyToClipboard(user.id);
			},
		});
	}

	if ($i && meId === user.id) {
		menuItems.push({ type: 'divider' }, {
			icon: 'ti ti-pencil',
			text: i18n.ts.editProfile,
			action: () => {
				router.push('/settings/profile');
			},
		});
	}

	const userActions = getPluginHandlers('user_action');
	if (userActions.length > 0) {
		menuItems.push({ type: 'divider' }, ...userActions.map(action => ({
			icon: 'ti ti-plug',
			text: action.title,
			action: () => {
				action.handler(user);
			},
		})));
	}

	return {
		menu: menuItems,
		cleanup: () => {
			if (_DEV_) console.log('user menu cleanup', cleanups);
			for (const cl of cleanups) {
				cl();
			}
		},
	};
}
