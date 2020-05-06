import { faTerminal, faHashtag, faBroadcastTower, faFireAlt, faSearch, faStar, faAt, faListUl, faUserClock, faUsers, faCloud, faGamepad, faFileAlt, faSatellite } from '@fortawesome/free-solid-svg-icons';
import { faBell, faEnvelope, faComments } from '@fortawesome/free-regular-svg-icons';

export function createMenuDef(actions) {
	return {
		notifications: {
			title: 'notifications',
			icon: faBell,
			show: store => store.getters.isSignedIn,
			indicate: store => store.getters.isSignedIn && store.state.i.hasUnreadNotification,
			to: '/my/notifications',
		},
		messaging: {
			title: 'messaging',
			icon: faComments,
			show: store => store.getters.isSignedIn,
			indicate: store => store.getters.isSignedIn && store.state.i.hasUnreadMessagingMessage,
			to: '/my/messaging',
		},
		drive: {
			title: 'drive',
			icon: faCloud,
			show: store => store.getters.isSignedIn,
			to: '/my/drive',
		},
		followRequests: {
			title: 'followRequests',
			icon: faUserClock,
			show: store => store.getters.isSignedIn && store.state.i.isLocked,
			indicate: store => store.getters.isSignedIn && store.state.i.hasPendingReceivedFollowRequest,
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
			indicate: store => store.getters.isSignedIn && store.state.i.hasUnreadAnnouncement,
			to: '/announcements',
		},
		search: {
			title: 'search',
			icon: faSearch,
			action: () => actions.search(),
		},
		lists: {
			title: 'lists',
			icon: faListUl,
			show: store => store.getters.isSignedIn,
			to: '/my/lists',
		},
		groups: {
			title: 'groups',
			icon: faUsers,
			show: store => store.getters.isSignedIn,
			to: '/my/groups',
		},
		antennas: {
			title: 'antennas',
			icon: faSatellite,
			show: store => store.getters.isSignedIn,
			to: '/my/antennas',
		},
		mentions: {
			title: 'mentions',
			icon: faAt,
			show: store => store.getters.isSignedIn,
			indicate: store => store.getters.isSignedIn && store.state.i.hasUnreadMentions,
			to: '/my/mentions',
		},
		messages: {
			title: 'directNotes',
			icon: faEnvelope,
			show: store => store.getters.isSignedIn,
			indicate: store => store.getters.isSignedIn && store.state.i.hasUnreadSpecifiedNotes,
			to: '/my/messages',
		},
		favorites: {
			title: 'favorites',
			icon: faStar,
			show: store => store.getters.isSignedIn,
			to: '/my/favorites',
		},
		pages: {
			title: 'pages',
			icon: faFileAlt,
			show: store => store.getters.isSignedIn,
			to: '/my/pages',
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
	};
}
