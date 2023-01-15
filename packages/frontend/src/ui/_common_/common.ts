import * as os from '@/os';
import { instance } from '@/instance';
import { host } from '@/config';
import { i18n } from '@/i18n';
import { $i } from '@/account';

export function openInstanceMenu(ev: MouseEvent) {
	os.popupMenu([{
		text: instance.name ?? host,
		type: 'label',
	}, {
		type: 'link',
		text: i18n.ts.instanceInfo,
		icon: 'ti ti-info-circle',
		to: '/about',
	}, {
		type: 'link',
		text: i18n.ts.customEmojis,
		icon: 'ti ti-icons',
		to: '/about#emojis',
	}, {
		type: 'link',
		text: i18n.ts.federation,
		icon: 'ti ti-whirl',
		to: '/about#federation',
	}, {
		type: 'link',
		text: i18n.ts.charts,
		icon: 'ti ti-chart-line',
		to: '/about#charts',
	}, null, {
		type: 'parent',
		text: i18n.ts.tools,
		icon: 'ti ti-tool',
		children: [{
			type: 'link',
			to: '/scratchpad',
			text: i18n.ts.scratchpad,
			icon: 'ti ti-terminal-2',
		}, {
			type: 'link',
			to: '/api-console',
			text: 'API Console',
			icon: 'ti ti-terminal-2',
		}, {
			type: 'link',
			to: '/clicker',
			text: '🍪👈',
			icon: 'ti ti-cookie',
		}, ($i && ($i.isAdmin || $i.policies.canInvite) && instance.disableRegistration) ? {
			text: i18n.ts.invite,
			icon: 'ti ti-user-plus',
			action: () => {
				os.api('invite').then(x => {
					os.alert({
						type: 'info',
						text: x.code,
					});
				}).catch(err => {
					os.alert({
						type: 'error',
						text: err,
					});
				});
			},
		} : undefined, ($i && ($i.isAdmin || $i.policies.canManageCustomEmojis)) ? {
			type: 'link',
			to: '/custom-emojis-manager',
			text: i18n.ts.manageCustomEmojis,
			icon: 'ti ti-icons',
		} : undefined],
	}, null, {
		text: i18n.ts.help,
		icon: 'ti ti-question-circle',
		action: () => {
			window.open('https://misskey-hub.net/help.html', '_blank');
		},
	}, {
		type: 'link',
		text: i18n.ts.aboutMisskey,
		to: '/about-misskey',
	}], ev.currentTarget ?? ev.target, {
		align: 'left',
	});
}
