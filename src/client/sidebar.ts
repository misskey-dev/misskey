import { faBell, faComments, faEnvelope } from '@fortawesome/free-regular-svg-icons';
import { faAt, faBroadcastTower, faCloud, faColumns, faDoorClosed, faFileAlt, faFireAlt, faGamepad, faHashtag, faListUl, faPaperclip, faSatellite, faSatelliteDish, faSearch, faStar, faTerminal, faUserClock, faUsers } from '@fortawesome/free-solid-svg-icons';
import { computed } from 'vue';
import { search } from '@/scripts/search';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { $i, isSignedIn } from './account';

export const sidebarDef = {
	notifications: {
		title: 'notifications',
		icon: faBell,
		show: computed(() => isSignedIn),
		indicated: computed(() => isSignedIn && $i.hasUnreadNotification),
		to: '/my/notifications',
	},
	messaging: {
		title: 'messaging',
		icon: faComments,
		show: computed(() => isSignedIn),
		indicated: computed(() => isSignedIn && $i.hasUnreadMessagingMessage),
		to: '/my/messaging',
	},
	drive: {
		title: 'drive',
		icon: faCloud,
		show: computed(() => isSignedIn),
		to: '/my/drive',
	},
	followRequests: {
		title: 'followRequests',
		icon: faUserClock,
		show: computed(() => isSignedIn && $i.isLocked),
		indicated: computed(() => isSignedIn && $i.hasPendingReceivedFollowRequest),
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
		indicated: computed(() => isSignedIn && $i.hasUnreadAnnouncement),
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
		show: computed(() => isSignedIn),
		to: '/my/lists',
	},
	groups: {
		title: 'groups',
		icon: faUsers,
		show: computed(() => isSignedIn),
		to: '/my/groups',
	},
	antennas: {
		title: 'antennas',
		icon: faSatellite,
		show: computed(() => isSignedIn),
		to: '/my/antennas',
	},
	mentions: {
		title: 'mentions',
		icon: faAt,
		show: computed(() => isSignedIn),
		indicated: computed(() => isSignedIn && $i.hasUnreadMentions),
		to: '/my/mentions',
	},
	messages: {
		title: 'directNotes',
		icon: faEnvelope,
		show: computed(() => isSignedIn),
		indicated: computed(() => isSignedIn && $i.hasUnreadSpecifiedNotes),
		to: '/my/messages',
	},
	favorites: {
		title: 'favorites',
		icon: faStar,
		show: computed(() => isSignedIn),
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
		show: computed(() => isSignedIn),
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
		show: computed(() => isSignedIn),
		to: computed(() => `/@${$i.username}/room`),
	},
	ui: {
		title: 'switchUi',
		icon: faColumns,
		action: (ev) => {
			os.modalMenu([{
				text: i18n.global.t('default'),
				action: () => {
					localStorage.setItem('ui', 'default');
					location.reload();
				}
			}, {
				text: i18n.global.t('deck'),
				action: () => {
					localStorage.setItem('ui', 'deck');
					location.reload();
				}
			}, {
				text: i18n.global.t('desktop') + ' (β)',
				action: () => {
					localStorage.setItem('ui', 'desktop');
					location.reload();
				}
			}], ev.currentTarget || ev.target);
		},
	},
};
