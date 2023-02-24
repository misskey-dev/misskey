import { defineAsyncComponent } from 'vue';
import { i18n } from '@/i18n';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import { host } from '@/config';
import * as os from '@/os';
import { userActions } from '@/store';
import { $i, iAmModerator } from '@/account';
import { mainRouter } from '@/router';
import { Router } from '@/nirax';

export function getUserMenu(user, router: Router = mainRouter) {
	const meId = $i ? $i.id : null;

	async function pushList() {
		const t = i18n.ts.selectList; // なぜか後で参照すると null になるので最初にメモリに確保しておく
		const lists = await os.api('users/lists/list');
		if (lists.length === 0) {
			os.alert({
				type: 'error',
				text: i18n.ts.youHaveNoLists,
			});
			return;
		}
		const { canceled, result: listId } = await os.select({
			title: t,
			items: lists.map(list => ({
				value: list.id, text: list.name,
			})),
		});
		if (canceled) return;
		os.apiWithDialog('users/lists/push', {
			listId: listId,
			userId: user.id,
		});
	}

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
					value: 'indefinitely', text: i18n.ts.indefinitely,
				}, {
					value: 'tenMinutes', text: i18n.ts.tenMinutes,
				}, {
					value: 'oneHour', text: i18n.ts.oneHour,
				}, {
					value: 'oneDay', text: i18n.ts.oneDay,
				}, {
					value: 'oneWeek', text: i18n.ts.oneWeek,
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

	async function toggleBlock() {
		if (!await getConfirmed(user.isBlocking ? i18n.ts.unblockConfirm : i18n.ts.blockConfirm)) return;

		os.apiWithDialog(user.isBlocking ? 'blocking/delete' : 'blocking/create', {
			userId: user.id,
		}).then(() => {
			user.isBlocking = !user.isBlocking;
		});
	}

	function reportAbuse() {
		os.popup(defineAsyncComponent(() => import('@/components/MkAbuseReportWindow.vue')), {
			user: user,
		}, {}, 'closed');
	}

	async function getConfirmed(text: string): Promise<boolean> {
		const confirm = await os.confirm({
			type: 'warning',
			title: 'confirm',
			text,
		});

		return !confirm.canceled;
	}

	async function invalidateFollow() {
		if (!await getConfirmed(i18n.ts.breakFollowConfirm)) return;

		os.apiWithDialog('following/invalidate', {
			userId: user.id,
		}).then(() => {
			user.isFollowed = !user.isFollowed;
		});
	}

	let menu = [{
		icon: 'ti ti-at',
		text: i18n.ts.copyUsername,
		action: () => {
			copyToClipboard(`@${user.username}@${user.host || host}`);
		},
	}, {
		icon: 'ti ti-info-circle',
		text: i18n.ts.info,
		action: () => {
			router.push(`/user-info/${user.id}`);
		},
	}, {
		icon: 'ti ti-rss',
		text: i18n.ts.copyRSS,
		action: () => {
			copyToClipboard(`${user.host ?? host}/@${user.username}.atom`);
		},
	}, {
		icon: 'ti ti-mail',
		text: i18n.ts.sendMessage,
		action: () => {
			os.post({ specified: user });
		},
	}, null, {
		icon: 'ti ti-list',
		text: i18n.ts.addToList,
		action: pushList,
	}] as any;

	if ($i && meId !== user.id) {
		menu = menu.concat([null, {
			icon: user.isMuted ? 'ti ti-eye' : 'ti ti-eye-off',
			text: user.isMuted ? i18n.ts.unmute : i18n.ts.mute,
			action: toggleMute,
		}, {
			icon: 'ti ti-ban',
			text: user.isBlocking ? i18n.ts.unblock : i18n.ts.block,
			action: toggleBlock,
		}]);

		if (user.isFollowed) {
			menu = menu.concat([{
				icon: 'ti ti-link-off',
				text: i18n.ts.breakFollow,
				action: invalidateFollow,
			}]);
		}

		menu = menu.concat([null, {
			icon: 'ti ti-exclamation-circle',
			text: i18n.ts.reportAbuse,
			action: reportAbuse,
		}]);

		if (iAmModerator) {
			menu = menu.concat([null, {
				icon: 'ti ti-user-exclamation',
				text: i18n.ts.moderation,
				action: () => {
					router.push('/user-info/' + user.id + '#moderation');
				},
			}, {
				icon: 'ti ti-badges',
				text: i18n.ts.roles,
				action: async () => {
					const roles = await os.api('admin/roles/list');

					const { canceled, result: roleId } = await os.select({
						title: i18n.ts._role.chooseRoleToAssign,
						items: roles.map(r => ({ text: r.name, value: r.id })),
					});
					if (canceled) return;

					await os.apiWithDialog('admin/roles/assign', { roleId, userId: user.id });
				},
			}]);
		}
	}

	if ($i && meId === user.id) {
		menu = menu.concat([null, {
			icon: 'ti ti-pencil',
			text: i18n.ts.editProfile,
			action: () => {
				router.push('/settings/profile');
			},
		}]);
	}

	if (userActions.length > 0) {
		menu = menu.concat([null, ...userActions.map(action => ({
			icon: 'ti ti-plug',
			text: action.title,
			action: () => {
				action.handler(user);
			},
		}))]);
	}

	return menu;
}
