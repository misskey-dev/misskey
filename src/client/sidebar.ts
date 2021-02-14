import { faBell, faComments, faEnvelope } from '@fortawesome/free-regular-svg-icons';
import { faAt, faBroadcastTower, faCloud, faColumns, faDoorClosed, faFileAlt, faFireAlt, faGamepad, faHashtag, faListUl, faPaperclip, faSatellite, faSatelliteDish, faSearch, faStar, faTerminal, faUserClock, faUsers } from '@fortawesome/free-solid-svg-icons';
import { computed } from 'vue';
import { search } from '@/scripts/search';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { $i } from './account';

export const sidebarDef = {
	notifications: {
		title: 'notifications',
		icon: faBell,
		show: computed(() => $i != null),
		indicated: computed(() => $i != null && $i.hasUnreadNotification),
		to: '/my/notifications',
	},
	messaging: {
		title: 'messaging',
		icon: faComments,
		show: computed(() => $i != null),
		indicated: computed(() => $i != null && $i.hasUnreadMessagingMessage),
		to: '/my/messaging',
	},
	drive: {
		title: 'drive',
		icon: faCloud,
		show: computed(() => $i != null),
		to: '/my/drive',
	},
	followRequests: {
		title: 'followRequests',
		icon: faUserClock,
		show: computed(() => $i != null && $i.isLocked),
		indicated: computed(() => $i != null && $i.hasPendingReceivedFollowRequest),
		to: '/my/follow-requests',
	},
	featured: {
		title: 'featured',
		icon: faFireAlt,
		to: '/featured',
	},
	explore: {
		title: 'explore',
		icon: faHashtag,
		to: '/explore',
	},
	announcements: {
		title: 'announcements',
		icon: faBroadcastTower,
		indicated: computed(() => $i != null && $i.hasUnreadAnnouncement),
		to: '/announcements',
	},
	search: {
		title: 'search',
		icon: faSearch,
		action: () => search(),
	},
	lists: {
		title: 'lists',
		icon: faListUl,
		show: computed(() => $i != null),
		to: '/my/lists',
	},
	groups: {
		title: 'groups',
		icon: faUsers,
		show: computed(() => $i != null),
		to: '/my/groups',
	},
	antennas: {
		title: 'antennas',
		icon: faSatellite,
		show: computed(() => $i != null),
		to: '/my/antennas',
	},
	mentions: {
		title: 'mentions',
		icon: faAt,
		show: computed(() => $i != null),
		indicated: computed(() => $i != null && $i.hasUnreadMentions),
		to: '/my/mentions',
	},
	messages: {
		title: 'directNotes',
		icon: faEnvelope,
		show: computed(() => $i != null),
		indicated: computed(() => $i != null && $i.hasUnreadSpecifiedNotes),
		to: '/my/messages',
	},
	favorites: {
		title: 'favorites',
		icon: faStar,
		show: computed(() => $i != null),
		to: '/my/favorites',
	},
	pages: {
		title: 'pages',
		icon: faFileAlt,
		to: '/pages',
	},
	clips: {
		title: 'clip',
		icon: faPaperclip,
		show: computed(() => $i != null),
		to: '/my/clips',
	},
	channels: {
		title: 'channel',
		icon: faSatelliteDish,
		to: '/channels',
	},
	games: {
		title: 'games',
		icon: faGamepad,
		to: '/games/reversi',
	},
	scratchpad: {
		title: 'scratchpad',
		icon: faTerminal,
		to: '/scratchpad',
	},
	rooms: {
		title: 'rooms',
		icon: faDoorClosed,
		show: computed(() => $i != null),
		to: computed(() => `/@${$i.username}/room`),
	},
	ui: {
		title: 'switchUi',
		icon: faColumns,
		action: (ev) => {
			os.modalMenu([{
				text: i18n.locale.default,
				action: () => {
					localStorage.setItem('ui', 'default');
					location.reload();
				}
			}, {
				text: i18n.locale.deck,
				action: () => {
					localStorage.setItem('ui', 'deck');
					location.reload();
				}
			}, {
				text: 'Chat (β)',
				action: () => {
					localStorage.setItem('ui', 'chat');
					location.reload();
				}
			}, {
				text: i18n.locale.desktop + ' (β)',
				action: () => {
					localStorage.setItem('ui', 'desktop');
					location.reload();
				}
			}], ev.currentTarget || ev.target);
		},
	},
};
