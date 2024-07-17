/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent } from 'vue';
import type { MenuItem } from '@/types/menu.js';
import * as os from '@/os.js';
import { instance } from '@/instance.js';
import { host } from '@/config.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/account.js';

function toolsMenuItems(): MenuItem[] {
	return [{
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
	}, ($i && ($i.isAdmin || $i.policies.canManageCustomEmojis)) ? {
		type: 'link',
		to: '/custom-emojis-manager',
		text: i18n.ts.manageCustomEmojis,
		icon: 'ti ti-icons',
	} : undefined, ($i && ($i.isAdmin || $i.policies.canManageAvatarDecorations)) ? {
		type: 'link',
		to: '/avatar-decorations',
		text: i18n.ts.manageAvatarDecorations,
		icon: 'ti ti-sparkles',
	} : undefined];
}

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
	}, { type: 'divider' }, {
		type: 'link',
		text: i18n.ts.ads,
		icon: 'ti ti-ad',
		to: '/ads',
	}, ($i && ($i.isAdmin || $i.policies.canInvite) && instance.disableRegistration) ? {
		type: 'link',
		to: '/invite',
		text: i18n.ts.invite,
		icon: 'ti ti-user-plus',
	} : undefined, {
		type: 'parent',
		text: i18n.ts.tools,
		icon: 'ti ti-tool',
		children: toolsMenuItems(),
	}, { type: 'divider' }, {
		type: 'link',
		text: i18n.ts.inquiry,
		icon: 'ti ti-help-circle',
		to: '/contact',
	}, (instance.impressumUrl) ? {
		type: 'a',
		text: i18n.ts.impressum,
		icon: 'ti ti-file-invoice',
		href: instance.impressumUrl,
		target: '_blank',
	} : undefined, (instance.tosUrl) ? {
		type: 'a',
		text: i18n.ts.termsOfService,
		icon: 'ti ti-notebook',
		href: instance.tosUrl,
		target: '_blank',
	} : undefined, (instance.privacyPolicyUrl) ? {
		type: 'a',
		text: i18n.ts.privacyPolicy,
		icon: 'ti ti-shield-lock',
		href: instance.privacyPolicyUrl,
		target: '_blank',
	} : undefined, (!instance.impressumUrl && !instance.tosUrl && !instance.privacyPolicyUrl) ? undefined : { type: 'divider' }, {
		type: 'a',
		text: i18n.ts.document,
		icon: 'ti ti-bulb',
		href: 'https://misskey-hub.net/docs/for-users/',
		target: '_blank',
	}, ($i) ? {
		text: i18n.ts._initialTutorial.launchTutorial,
		icon: 'ti ti-presentation',
		action: () => {
			const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/MkTutorialDialog.vue')), {}, {
				closed: () => dispose(),
			});
		},
	} : undefined, {
		type: 'link',
		text: i18n.ts.aboutMisskey,
		to: '/about-misskey',
	}], ev.currentTarget ?? ev.target, {
		align: 'left',
	});
}

export function openToolsMenu(ev: MouseEvent) {
	os.popupMenu(toolsMenuItems(), ev.currentTarget ?? ev.target, {
		align: 'left',
	});
}
