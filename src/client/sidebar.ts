import { faBell, faComments, faEnvelope } from '@fortawesome/free-regular-svg-icons';
import { faAt, faBroadcastTower, faCloud, faColumns, faDoorClosed, faFileAlt, faFireAlt, faGamepad, faHashtag, faListUl, faSatellite, faSatelliteDish, faSearch, faStar, faTerminal, faUserClock, faUsers } from '@fortawesome/free-solid-svg-icons';
import { computed } from 'vue';
import { store } from '@/store';
import { deckmode } from '@/config';
import { search } from '@/scripts/search';
import { popout } from '@/scripts/popout';
import { router } from '@/router';
import * as os from '@/os';

export const sidebarDef = {
	notifications: {
		title: 'notifications',
		icon: faBell,
		show: computed(() => store.getters.isSignedIn),
		indicated: computed(() => store.getters.isSignedIn && store.state.i.hasUnreadNotification),
		to: '/my/notifications',
	},
	messaging: {
		title: 'messaging',
		icon: faComments,
		show: computed(() => store.getters.isSignedIn),
		indicated: computed(() => store.getters.isSignedIn && store.state.i.hasUnreadMessagingMessage),
		action: () => {
			switch (store.state.device.chatOpenBehavior) {
				case 'window': { os.pageWindow('/my/messaging'); break; }
				case 'popout': { popout('/my/messaging'); break; }
				default: { router.push('/my/messaging'); break; }
			}
		}
	},
	drive: {
		title: 'drive',
		icon: faCloud,
		show: computed(() => store.getters.isSignedIn),
		to: '/my/drive',
	},
	followRequests: {
		title: 'followRequests',
		icon: faUserClock,
		show: computed(() => store.getters.isSignedIn && store.state.i.isLocked),
		indicated: computed(() => store.getters.isSignedIn && store.state.i.hasPendingReceivedFollowRequest),
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
		indicated: computed(() => store.getters.isSignedIn && store.state.i.hasUnreadAnnouncement),
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
		show: computed(() => store.getters.isSignedIn),
		to: '/my/lists',
	},
	groups: {
		title: 'groups',
		icon: faUsers,
		show: computed(() => store.getters.isSignedIn),
		to: '/my/groups',
	},
	antennas: {
		title: 'antennas',
		icon: faSatellite,
		show: computed(() => store.getters.isSignedIn),
		to: '/my/antennas',
	},
	mentions: {
		title: 'mentions',
		icon: faAt,
		show: computed(() => store.getters.isSignedIn),
		indicated: computed(() => store.getters.isSignedIn && store.state.i.hasUnreadMentions),
		to: '/my/mentions',
	},
	messages: {
		title: 'directNotes',
		icon: faEnvelope,
		show: computed(() => store.getters.isSignedIn),
		indicated: computed(() => store.getters.isSignedIn && store.state.i.hasUnreadSpecifiedNotes),
		to: '/my/messages',
	},
	favorites: {
		title: 'favorites',
		icon: faStar,
		show: computed(() => store.getters.isSignedIn),
		to: '/my/favorites',
	},
	pages: {
		title: 'pages',
		icon: faFileAlt,
		show: computed(() => store.getters.isSignedIn),
		to: '/my/pages',
	},
	channels: {
		title: 'channel',
		icon: faSatelliteDish,
		to: '/channels',
	},
	games: {
		title: 'games',
		icon: faGamepad,
		to: '/games',
	},
	scratchpad: {
		title: 'scratchpad',
		icon: faTerminal,
		to: '/scratchpad',
	},
	rooms: {
		title: 'rooms',
		icon: faDoorClosed,
		show: computed(() => store.getters.isSignedIn),
		to: computed(() => `/@${store.state.i.username}/room`),
	},
	deck: {
		title: deckmode ? 'undeck' : 'deck',
		icon: faColumns,
		action: () => {
			localStorage.setItem('deckmode', (!deckmode).toString());
			location.reload();
		},
	},
};
