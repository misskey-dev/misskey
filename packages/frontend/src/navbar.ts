import { computed, reactive } from 'vue';
import { $i } from './account';
import { miLocalStorage } from './local-storage';
import { openInstanceMenu } from './ui/_common_/common';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { ui } from '@/config';
import { unisonReload } from '@/scripts/unison-reload';

export const navbarItemDef = reactive({
	notifications: {
		title: i18n.ts.notifications,
		icon: 'ti ti-bell',
		show: computed(() => $i != null),
		indicated: computed(() => $i != null && $i.hasUnreadNotification),
		to: '/my/notifications',
	},
	drive: {
		title: i18n.ts.drive,
		icon: 'ti ti-cloud',
		show: computed(() => $i != null),
		to: '/my/drive',
	},
	followRequests: {
		title: i18n.ts.followRequests,
		icon: 'ti ti-user-plus',
		show: computed(() => $i != null && $i.isLocked),
		indicated: computed(() => $i != null && $i.hasPendingReceivedFollowRequest),
		to: '/my/follow-requests',
	},
	explore: {
		title: i18n.ts.explore,
		icon: 'ti ti-hash',
		to: '/explore',
	},
	announcements: {
		title: i18n.ts.announcements,
		icon: 'ti ti-speakerphone',
		indicated: computed(() => $i != null && $i.hasUnreadAnnouncement),
		to: '/announcements',
	},
	search: {
		title: i18n.ts.search,
		icon: 'ti ti-search',
		to: '/search',
	},
	lists: {
		title: i18n.ts.lists,
		icon: 'ti ti-list',
		show: computed(() => $i != null),
		to: '/my/lists',
	},
	antennas: {
		title: i18n.ts.antennas,
		icon: 'ti ti-antenna',
		show: computed(() => $i != null),
		to: '/my/antennas',
	},
	favorites: {
		title: i18n.ts.favorites,
		icon: 'ti ti-star',
		show: computed(() => $i != null),
		to: '/my/favorites',
	},
	pages: {
		title: i18n.ts.pages,
		icon: 'ti ti-news',
		to: '/pages',
	},
	play: {
		title: 'Play',
		icon: 'ti ti-player-play',
		to: '/play',
	},
	gallery: {
		title: i18n.ts.gallery,
		icon: 'ti ti-icons',
		to: '/gallery',
	},
	clips: {
		title: i18n.ts.clip,
		icon: 'ti ti-paperclip',
		show: computed(() => $i != null),
		to: '/my/clips',
	},
	channels: {
		title: i18n.ts.channel,
		icon: 'ti ti-device-tv',
		to: '/channels',
	},
	achievements: {
		title: i18n.ts.achievements,
		icon: 'ti ti-medal',
		show: computed(() => $i != null),
		to: '/my/achievements',
	},
	ui: {
		title: i18n.ts.switchUi,
		icon: 'ti ti-devices',
		action: (ev) => {
			os.popupMenu([{
				text: i18n.ts.default,
				active: ui === 'default' || ui === null,
				action: () => {
					miLocalStorage.setItem('ui', 'default');
					unisonReload();
				},
			}, {
				text: i18n.ts.deck,
				active: ui === 'deck',
				action: () => {
					miLocalStorage.setItem('ui', 'deck');
					unisonReload();
				},
			}, {
				text: i18n.ts.classic,
				active: ui === 'classic',
				action: () => {
					miLocalStorage.setItem('ui', 'classic');
					unisonReload();
				},
			}], ev.currentTarget ?? ev.target);
		},
	},
	about: {
		title: i18n.ts.about,
		icon: 'ti ti-info-circle',
		action: (ev) => {
			openInstanceMenu(ev);
		},
	},
	reload: {
		title: i18n.ts.reload,
		icon: 'ti ti-refresh',
		action: (ev) => {
			location.reload();
		},
	},
});
