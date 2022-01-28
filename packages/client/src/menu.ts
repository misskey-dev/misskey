import { computed, ref, reactive } from 'vue';
import { search } from '@/scripts/search';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { ui } from '@/config';
import { $i } from './account';
import { unisonReload } from '@/scripts/unison-reload';
import { router } from './router';

export const menuDef = reactive({
	notifications: {
		title: 'notifications',
		icon: 'fas fa-bell',
		show: computed(() => $i != null),
		indicated: computed(() => $i != null && $i.hasUnreadNotification),
		to: '/my/notifications',
	},
	messaging: {
		title: 'messaging',
		icon: 'fas fa-comments',
		show: computed(() => $i != null),
		indicated: computed(() => $i != null && $i.hasUnreadMessagingMessage),
		to: '/my/messaging',
	},
	drive: {
		title: 'drive',
		icon: 'fas fa-cloud',
		show: computed(() => $i != null),
		to: '/my/drive',
	},
	followRequests: {
		title: 'followRequests',
		icon: 'fas fa-user-clock',
		show: computed(() => $i != null && $i.isLocked),
		indicated: computed(() => $i != null && $i.hasPendingReceivedFollowRequest),
		to: '/my/follow-requests',
	},
	featured: {
		title: 'featured',
		icon: 'fas fa-fire-alt',
		to: '/featured',
	},
	explore: {
		title: 'explore',
		icon: 'fas fa-hashtag',
		to: '/explore',
	},
	announcements: {
		title: 'announcements',
		icon: 'fas fa-broadcast-tower',
		indicated: computed(() => $i != null && $i.hasUnreadAnnouncement),
		to: '/announcements',
	},
	search: {
		title: 'search',
		icon: 'fas fa-search',
		action: () => search(),
	},
	lists: {
		title: 'lists',
		icon: 'fas fa-list-ul',
		show: computed(() => $i != null),
		active: computed(() => router.currentRoute.value.path.startsWith('/timeline/list/') || router.currentRoute.value.path === '/my/lists' || router.currentRoute.value.path.startsWith('/my/lists/')),
		action: (ev) => {
			const items = ref([{
				type: 'pending'
			}]);
			os.api('users/lists/list').then(lists => {
				const _items = [...lists.map(list => ({
					type: 'link',
					text: list.name,
					to: `/timeline/list/${list.id}`
				})), null, {
					type: 'link',
					to: '/my/lists',
					text: i18n.ts.manageLists,
					icon: 'fas fa-cog',
				}];
				items.value = _items;
			});
			os.popupMenu(items, ev.currentTarget ?? ev.target);
		},
	},
	groups: {
		title: 'groups',
		icon: 'fas fa-users',
		show: computed(() => $i != null),
		to: '/my/groups',
	},
	antennas: {
		title: 'antennas',
		icon: 'fas fa-satellite',
		show: computed(() => $i != null),
		active: computed(() => router.currentRoute.value.path.startsWith('/timeline/antenna/') || router.currentRoute.value.path === '/my/antennas' || router.currentRoute.value.path.startsWith('/my/antennas/')),
		action: (ev) => {
			const items = ref([{
				type: 'pending'
			}]);
			os.api('antennas/list').then(antennas => {
				const _items = [...antennas.map(antenna => ({
					type: 'link',
					text: antenna.name,
					to: `/timeline/antenna/${antenna.id}`
				})), null, {
					type: 'link',
					to: '/my/antennas',
					text: i18n.ts.manageAntennas,
					icon: 'fas fa-cog',
				}];
				items.value = _items;
			});
			os.popupMenu(items, ev.currentTarget ?? ev.target);
		},
	},
	mentions: {
		title: 'mentions',
		icon: 'fas fa-at',
		show: computed(() => $i != null),
		indicated: computed(() => $i != null && $i.hasUnreadMentions),
		to: '/my/mentions',
	},
	messages: {
		title: 'directNotes',
		icon: 'fas fa-envelope',
		show: computed(() => $i != null),
		indicated: computed(() => $i != null && $i.hasUnreadSpecifiedNotes),
		to: '/my/messages',
	},
	favorites: {
		title: 'favorites',
		icon: 'fas fa-star',
		show: computed(() => $i != null),
		to: '/my/favorites',
	},
	pages: {
		title: 'pages',
		icon: 'fas fa-file-alt',
		to: '/pages',
	},
	gallery: {
		title: 'gallery',
		icon: 'fas fa-icons',
		to: '/gallery',
	},
	clips: {
		title: 'clip',
		icon: 'fas fa-paperclip',
		show: computed(() => $i != null),
		to: '/my/clips',
	},
	channels: {
		title: 'channel',
		icon: 'fas fa-satellite-dish',
		to: '/channels',
	},
	federation: {
		title: 'federation',
		icon: 'fas fa-globe',
		to: '/federation',
	},
	emojis: {
		title: 'emojis',
		icon: 'fas fa-laugh',
		to: '/emojis',
	},
	scratchpad: {
		title: 'scratchpad',
		icon: 'fas fa-terminal',
		to: '/scratchpad',
	},
	ui: {
		title: 'switchUi',
		icon: 'fas fa-columns',
		action: (ev) => {
			os.popupMenu([{
				text: i18n.ts.default,
				active: ui === 'default' || ui === null,
				action: () => {
					localStorage.setItem('ui', 'default');
					unisonReload();
				}
			}, {
				text: i18n.ts.deck,
				active: ui === 'deck',
				action: () => {
					localStorage.setItem('ui', 'deck');
					unisonReload();
				}
			}, {
				text: i18n.ts.classic,
				active: ui === 'classic',
				action: () => {
					localStorage.setItem('ui', 'classic');
					unisonReload();
				}
			}, /*{
				text: i18n.ts.desktop + ' (β)',
				active: ui === 'desktop',
				action: () => {
					localStorage.setItem('ui', 'desktop');
					unisonReload();
				}
			}*/], ev.currentTarget ?? ev.target);
		},
	},
});
