import { faAt, faListUl, faEye, faEyeSlash, faBan, faPencilAlt, faComments, faUsers, faMicrophoneSlash, faPlug, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { faSnowflake, faEnvelope } from '@fortawesome/free-regular-svg-icons';
import { i18n } from '@/i18n';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import { host } from '@/config';
import getAcct from '../../misc/acct/render';
import * as os from '@/os';
import { store, userActions } from '@/store';
import { router } from '@/router';

export function getUserMenu(user) {
	const meId = $i ? $i.id : null;

	async function pushList() {
		const t = i18n.global.t('selectList'); // なぜか後で参照すると null になるので最初にメモリに確保しておく
		const lists = await os.api('users/lists/list');
		if (lists.length === 0) {
			os.dialog({
				type: 'error',
				text: i18n.global.t('youHaveNoLists')
			});
			return;
		}
		const { canceled, result: listId } = await os.dialog({
			type: null,
			title: t,
			select: {
				items: lists.map(list => ({
					value: list.id, text: list.name
				}))
			},
			showCancelButton: true
		});
		if (canceled) return;
		os.apiWithDialog('users/lists/push', {
			listId: listId,
			userId: user.id
		});
	}

	async function inviteGroup() {
		const groups = await os.api('users/groups/owned');
		if (groups.length === 0) {
			os.dialog({
				type: 'error',
				text: i18n.global.t('youHaveNoGroups')
			});
			return;
		}
		const { canceled, result: groupId } = await os.dialog({
			type: null,
			title: i18n.global.t('group'),
			select: {
				items: groups.map(group => ({
					value: group.id, text: group.name
				}))
			},
			showCancelButton: true
		});
		if (canceled) return;
		os.apiWithDialog('users/groups/invite', {
			groupId: groupId,
			userId: user.id
		});
	}

	async function toggleMute() {
		os.apiWithDialog(user.isMuted ? 'mute/delete' : 'mute/create', {
			userId: user.id
		}).then(() => {
			user.isMuted = !user.isMuted;
		});
	}

	async function toggleBlock() {
		if (!await getConfirmed(user.isBlocking ? i18n.global.t('unblockConfirm') : i18n.global.t('blockConfirm'))) return;

		os.apiWithDialog(user.isBlocking ? 'blocking/delete' : 'blocking/create', {
			userId: user.id
		}).then(() => {
			user.isBlocking = !user.isBlocking;
		});
	}

	async function toggleSilence() {
		if (!await getConfirmed(i18n.global.t(user.isSilenced ? 'unsilenceConfirm' : 'silenceConfirm'))) return;

		os.apiWithDialog(user.isSilenced ? 'admin/unsilence-user' : 'admin/silence-user', {
			userId: user.id
		}).then(() => {
			user.isSilenced = !user.isSilenced;
		});
	}

	async function toggleSuspend() {
		if (!await getConfirmed(i18n.global.t(user.isSuspended ? 'unsuspendConfirm' : 'suspendConfirm'))) return;

		os.apiWithDialog(user.isSuspended ? 'admin/unsuspend-user' : 'admin/suspend-user', {
			userId: user.id
		}).then(() => {
			user.isSuspended = !user.isSuspended;
		});
	}

	function reportAbuse() {
		os.popup(import('@/components/abuse-report-window.vue'), {
			user: user,
		}, {}, 'closed');
	}

	async function getConfirmed(text: string): Promise<boolean> {
		const confirm = await os.dialog({
			type: 'warning',
			showCancelButton: true,
			title: 'confirm',
			text,
		});

		return !confirm.canceled;
	}

	let menu = [{
		icon: faAt,
		text: i18n.global.t('copyUsername'),
		action: () => {
			copyToClipboard(`@${user.username}@${user.host || host}`);
		}
	}, {
		icon: faEnvelope,
		text: i18n.global.t('sendMessage'),
		action: () => {
			os.post({ specified: user });
		}
	}, meId != user.id ? {
		type: 'link',
		icon: faComments,
		text: i18n.global.t('startMessaging'),
		to: '/my/messaging/' + getAcct(user),
	} : undefined, null, {
		icon: faListUl,
		text: i18n.global.t('addToList'),
		action: pushList
	}, meId != user.id ? {
		icon: faUsers,
		text: i18n.global.t('inviteToGroup'),
		action: inviteGroup
	} : undefined] as any;

	if ($i && meId != user.id) {
		menu = menu.concat([null, {
			icon: user.isMuted ? faEye : faEyeSlash,
			text: user.isMuted ? i18n.global.t('unmute') : i18n.global.t('mute'),
			action: toggleMute
		}, {
			icon: faBan,
			text: user.isBlocking ? i18n.global.t('unblock') : i18n.global.t('block'),
			action: toggleBlock
		}]);

		menu = menu.concat([null, {
			icon: faExclamationCircle,
			text: i18n.global.t('reportAbuse'),
			action: reportAbuse
		}]);

		if ($i && ($i.isAdmin || $i.isModerator)) {
			menu = menu.concat([null, {
				icon: faMicrophoneSlash,
				text: user.isSilenced ? i18n.global.t('unsilence') : i18n.global.t('silence'),
				action: toggleSilence
			}, {
				icon: faSnowflake,
				text: user.isSuspended ? i18n.global.t('unsuspend') : i18n.global.t('suspend'),
				action: toggleSuspend
			}]);
		}
	}

	if ($i && meId === user.id) {
		menu = menu.concat([null, {
			icon: faPencilAlt,
			text: i18n.global.t('editProfile'),
			action: () => {
				router.push('/settings/profile');
			}
		}]);
	}

	if (userActions.length > 0) {
		menu = menu.concat([null, ...userActions.map(action => ({
			icon: faPlug,
			text: action.title,
			action: () => {
				action.handler(user);
			}
		}))]);
	}

	return menu;
}
