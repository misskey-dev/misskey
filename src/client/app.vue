<template>
<div class="mk-app" v-hotkey.global="keymap">
	<header class="header">
		<div class="title" ref="title">
			<transition name="header" mode="out-in" appear>
				<button class="_button back" v-if="canBack" @click="back()"><fa :icon="faChevronLeft"/></button>
			</transition>
			<transition name="header" mode="out-in" appear>
				<div class="body" :key="pageKey">
					<div class="default">
						<portal-target name="avatar" slim/>
						<h1 class="title"><portal-target name="icon" slim/><portal-target name="title" slim/></h1>
					</div>
					<div class="custom">
						<portal-target name="header" slim/>
					</div>
				</div>
			</transition>
		</div>
		<div class="sub">
			<fa :icon="faSearch"/>
			<input type="search" class="search" :placeholder="$t('search')" v-model="searchQuery" v-autocomplete="{ model: 'searchQuery' }" :disabled="searchWait" @keypress="searchKeypress"/>
			<button v-if="$store.getters.isSignedIn" class="post _buttonPrimary" @click="post()"><fa :icon="faPencilAlt"/></button>
		</div>
	</header>

	<nav class="nav" ref="nav">
		<div>
			<button class="item _button account" @click="openAccountMenu" v-if="$store.getters.isSignedIn">
				<mk-avatar :user="$store.state.i" class="avatar"/><mk-acct class="text" :user="$store.state.i"/>
			</button>
			<router-link class="item" active-class="active" to="/" exact v-if="$store.getters.isSignedIn">
				<fa :icon="faHome" fixed-width/><span class="text">{{ $t('timeline') }}</span>
			</router-link>
			<router-link class="item" active-class="active" to="/" exact v-else>
				<fa :icon="faHome" fixed-width/><span class="text">{{ $t('home') }}</span>
			</router-link>
			<router-link class="item" active-class="active" to="/featured">
				<fa :icon="faFireAlt" fixed-width/><span class="text">{{ $t('featured') }}</span>
			</router-link>
			<router-link class="item" active-class="active" to="/explore">
				<fa :icon="faHashtag" fixed-width/><span class="text">{{ $t('explore') }}</span>
			</router-link>
			<button class="item _button" @click="notificationsOpen = !notificationsOpen" ref="notificationButton" v-if="$store.getters.isSignedIn">
				<fa :icon="faBell" fixed-width/><span class="text">{{ $t('notifications') }}</span>
				<i v-if="$store.state.i.hasUnreadNotification"><fa :icon="faCircle"/></i>
			</button>
			<router-link class="item" active-class="active" to="/my/messaging" v-if="$store.getters.isSignedIn">
				<fa :icon="faComments" fixed-width/><span class="text">{{ $t('messaging') }}</span>
				<i v-if="$store.state.i.hasUnreadMessagingMessage"><fa :icon="faCircle"/></i>
			</router-link>
			<router-link class="item" active-class="active" to="/my/follow-requests" v-if="$store.getters.isSignedIn && $store.state.i.isLocked">
				<fa :icon="faUserClock" fixed-width/><span class="text">{{ $t('followRequests') }}</span>
				<i v-if="$store.state.i.pendingReceivedFollowRequestsCount"><fa :icon="faCircle"/></i>
			</router-link>
			<router-link class="item" active-class="active" to="/my/drive" v-if="$store.getters.isSignedIn">
				<fa :icon="faCloud" fixed-width/><span class="text">{{ $t('drive') }}</span>
			</router-link>
			<router-link class="item" active-class="active" to="/announcements">
				<fa :icon="faBroadcastTower" fixed-width/><span class="text">{{ $t('announcements') }}</span>
				<i v-if="$store.getters.isSignedIn && $store.state.i.hasUnreadAnnouncement"><fa :icon="faCircle"/></i>
			</router-link>
			<button class="item _button" :class="{ active: $route.path === '/instance' || $route.path.startsWith('/instance/') }" v-if="$store.getters.isSignedIn && ($store.state.i.isAdmin || $store.state.i.isModerator)" @click="oepnInstanceMenu">
				<fa :icon="faServer" fixed-width/><span class="text">{{ $t('instance') }}</span>
			</button>
			<button class="item _button" @click="search()">
				<fa :icon="faSearch" fixed-width/><span class="text">{{ $t('search') }}</span>
			</button>
			<button class="item _button" @click="more">
				<fa :icon="faEllipsisH" fixed-width/><span class="text">{{ $t('more') }}</span>
				<i v-if="$store.getters.isSignedIn && ($store.state.i.hasUnreadMentions || $store.state.i.hasUnreadSpecifiedNotes)"><fa :icon="faCircle"/></i>
			</button>
		</div>
	</nav>

	<div class="contents">
		<main ref="main">
			<div class="content">
				<transition name="page" mode="out-in">
					<keep-alive :include="['index']">
						<router-view></router-view>
					</keep-alive>
				</transition>
			</div>
			<div class="powerd-by" :class="{ visible: !$store.getters.isSignedIn }">
				<b><router-link to="/">{{ host }}</router-link></b>
				<small>Powered by <a href="https://github.com/syuilo/misskey" target="_blank">Misskey</a></small>
			</div>
		</main>

		<div class="widgets">
			<div ref="widgets" :class="{ edit: widgetsEditMode }">
				<template v-if="enableWidgets && $store.getters.isSignedIn">
					<template v-if="widgetsEditMode">
						<mk-button primary @click="addWidget" class="add"><fa :icon="faPlus"/></mk-button>
						<x-draggable
							:list="widgets"
							handle=".handle"
							animation="150"
							class="sortable"
							@sort="onWidgetSort"
						>
							<div v-for="widget in widgets" class="customize-container" :key="widget.id">
								<header>
									<span class="handle"><fa :icon="faBars"/></span>{{ widget.name }}<button class="remove" @click="removeWidget(widget)"><fa :icon="faTimes"/></button>
								</header>
								<div @click="widgetFunc(widget.id)">
									<component :is="`mkw-${widget.name}`" :widget="widget" :ref="widget.id" :is-customize-mode="true"/>
								</div>
							</div>
						</x-draggable>
					</template>
					<template v-else>
						<component class="widget" v-for="widget in widgets" :is="`mkw-${widget.name}`" :key="widget.id" :ref="widget.id" :widget="widget"/>
					</template>
					<button ref="widgetsEditButton" v-if="widgetsEditMode" class="_button edit" @click="widgetsEditMode = false">{{ $t('exitEdit') }}</button>
					<button ref="widgetsEditButton" v-else class="_button edit" @click="widgetsEditMode = true">{{ $t('editWidgets') }}</button>
				</template>
			</div>
		</div>
	</div>

	<div class="buttons">
		<button v-if="$store.getters.isSignedIn" class="button nav _button" @click="showNav" ref="navButton"><fa :icon="faBars"/><i v-if="$store.state.i.hasUnreadSpecifiedNotes || $store.state.i.pendingReceivedFollowRequestsCount || $store.state.i.hasUnreadMessagingMessage || $store.state.i.hasUnreadAnnouncement"><fa :icon="faCircle"/></i></button>
		<button v-if="$store.getters.isSignedIn" class="button home _button" :disabled="$route.path === '/'" @click="$router.push('/')"><fa :icon="faHome"/></button>
		<button v-if="$store.getters.isSignedIn" class="button notifications _button" @click="notificationsOpen = !notificationsOpen" ref="notificationButton2"><fa :icon="notificationsOpen ? faTimes : faBell"/><i v-if="$store.state.i.hasUnreadNotification"><fa :icon="faCircle"/></i></button>
		<button v-if="$store.getters.isSignedIn" class="button post _buttonPrimary" @click="post()"><fa :icon="faPencilAlt"/></button>
	</div>

	<button v-if="$store.getters.isSignedIn" class="post _buttonPrimary" @click="post()"><fa :icon="faPencilAlt"/></button>

	<transition name="zoom-in-top">
		<x-notifications v-if="notificationsOpen" class="notifications" ref="notifications"/>
	</transition>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faChevronLeft, faHashtag, faBroadcastTower, faFireAlt, faEllipsisH, faPencilAlt, faBars, faTimes, faSearch, faUserCog, faCog, faUser, faHome, faStar, faCircle, faAt, faListUl, faPlus, faUserClock, faUsers, faTachometerAlt, faExchangeAlt, faGlobe, faChartBar, faCloud, faGamepad, faServer, faFileAlt, faSatellite, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { faBell, faEnvelope, faLaugh, faComments } from '@fortawesome/free-regular-svg-icons';
import { v4 as uuid } from 'uuid';
import i18n from './i18n';
import { host } from './config';
import { search } from './scripts/search';
import contains from './scripts/contains';
import MkToast from './components/toast.vue';

export default Vue.extend({
	i18n,

	components: {
		XNotifications: () => import('./components/notifications.vue').then(m => m.default),
		MkButton: () => import('./components/ui/button.vue').then(m => m.default),
		XDraggable: () => import('vuedraggable'),
	},

	data() {
		return {
			host: host,
			pageKey: 0,
			searching: false,
			notificationsOpen: false,
			accounts: [],
			lists: [],
			connection: null,
			searchQuery: '',
			searchWait: false,
			widgetsEditMode: false,
			enableWidgets: window.innerWidth >= 1100,
			canBack: false,
			disconnectedDialog: null as Promise<void> | null,
			faChevronLeft, faComments, faHashtag, faBroadcastTower, faFireAlt, faEllipsisH, faPencilAlt, faBars, faTimes, faBell, faSearch, faUserCog, faCog, faUser, faHome, faStar, faCircle, faAt, faEnvelope, faListUl, faPlus, faUserClock, faLaugh, faUsers, faTachometerAlt, faExchangeAlt, faGlobe, faChartBar, faCloud, faServer
		};
	},

	computed: {
		keymap(): any {
			return {
				'p': this.post,
				'n': this.post,
			};
		},

		widgets(): any[] {
			return this.$store.state.settings.widgets;
		}
	},

	watch:{
		$route(to, from) {
			this.pageKey++;
			this.notificationsOpen = false;
			this.canBack = (window.history.length > 0 && !['index'].includes(to.name));
		},

		notificationsOpen(open) {
			if (open) {
				for (const el of Array.from(document.querySelectorAll('*'))) {
					el.addEventListener('mousedown', this.onMousedown);
				}
			} else {
				for (const el of Array.from(document.querySelectorAll('*'))) {
					el.removeEventListener('mousedown', this.onMousedown);
				}
			}
		}
	},

	created() {
		if (this.$store.getters.isSignedIn) {
			this.connection = this.$root.stream.useSharedConnection('main');
			this.connection.on('notification', this.onNotification);

			if (this.widgets.length === 0) {
				this.$store.dispatch('settings/setWidgets', [{
					name: 'notifications',
					id: 'a', data: {}
				}]);
			}
		}

		this.$root.stream.on('_disconnected_', () => {
			if (!this.disconnectedDialog) {
				if (this.$store.state.device.autoReload) {
					location.reload();
					return;
				}
				this.disconnectedDialog = this.$root.dialog({
					type: 'warning',
					showCancelButton: true,
					title: this.$t('disconnectedFromServer'),
					text: this.$t('reloadConfirm'),
				}).then(({ canceled }) => {
					if (!canceled) {
						location.reload();
					}
					this.disconnectedDialog = null;
				});
			}
		});

		setInterval(() => {
			this.$refs.title.style.left = (this.$refs.main.getBoundingClientRect().left - this.$refs.nav.offsetWidth) + 'px';
		}, 1000);

		// https://stackoverflow.com/questions/33891709/when-flexbox-items-wrap-in-column-mode-container-does-not-grow-its-width
		if (this.enableWidgets) {
			setInterval(() => {
				const width = this.$refs.widgetsEditButton.offsetLeft + 300;
				this.$refs.widgets.style.width = width + 'px';
			}, 1000);
		}
	},

	methods: {
		back() {
			if (this.canBack) window.history.back();
		},

		post() {
			this.$root.post();
		},

		search() {
			if (this.searching) return;

			this.$root.dialog({
				title: this.$t('search'),
				input: true
			}).then(async ({ canceled, result: query }) => {
				if (canceled || query == null || query == '') return;

				this.searching = true;
				search(this, query).finally(() => {
					this.searching = false;
				});
			});
		},

		searchKeypress(e) {
			if (e.keyCode == 13) {
				this.searchWait = true;
				search(this, this.searchQuery).finally(() => {
					this.searchWait = false;
					this.searchQuery = '';
				});
			}
		},

		showNav(ev) {
			this.$root.menu({
				items: [{
					text: this.$t('search'),
					icon: faSearch,
					action: this.search,
				}, null, this.$store.state.i.isAdmin || this.$store.state.i.isModerator ? {
					text: this.$t('instance'),
					icon: faServer,
					action: () => this.oepnInstanceMenu(ev),
				} : undefined, {
					type: 'link',
					text: this.$t('announcements'),
					to: '/announcements',
					icon: faBroadcastTower,
					indicate: this.$store.state.i.hasUnreadAnnouncement,
				}, {
					type: 'link',
					text: this.$t('featured'),
					to: '/featured',
					icon: faFireAlt,
				}, {
					type: 'link',
					text: this.$t('explore'),
					to: '/explore',
					icon: faHashtag,
				}, {
					type: 'link',
					text: this.$t('messaging'),
					to: '/my/messaging',
					icon: faComments,
					indicate: this.$store.state.i.hasUnreadMessagingMessage,
				}, this.$store.state.i.isLocked ? {
					type: 'link',
					text: this.$t('followRequests'),
					to: '/my/follow-requests',
					icon: faUserClock,
					indicate: this.$store.state.i.pendingReceivedFollowRequestsCount > 0,
				} : undefined, {
					type: 'link',
					text: this.$t('drive'),
					to: '/my/drive',
					icon: faCloud,
				}, {
					text: this.$t('more'),
					icon: faEllipsisH,
					action: () => this.more(ev),
					indicate: this.$store.state.i.hasUnreadMentions || this.$store.state.i.hasUnreadSpecifiedNotes
				}, null, {
					type: 'user',
					user: this.$store.state.i,
					action: () => this.openAccountMenu(ev),
				}],
				direction: 'up',
				align: 'left',
				fixed: true,
				width: 200,
				source: ev.currentTarget || ev.target,
			});
		},

		async openAccountMenu(ev) {
			const accounts = (await this.$root.api('users/show', { userIds: this.$store.state.device.accounts.map(x => x.id) })).filter(x => x.id !== this.$store.state.i.id);

			const accountItems = accounts.map(account => ({
				type: 'user',
				user: account,
				action: () => { this.switchAccount(account) }
			}));

			this.$root.menu({
				items: [...[{
					type: 'link',
					text: this.$t('profile'),
					to: `/@${ this.$store.state.i.username }`,
					avatar: this.$store.state.i,
				}, {
					type: 'link',
					text: this.$t('settings'),
					to: '/my/settings',
					icon: faCog,
				}, null, {
					type: 'item',
					text: this.$t('addAcount'),
					icon: faPlus,
					action: () => { this.addAcount() },
				}], ...accountItems],
				align: 'left',
				fixed: true,
				width: 240,
				source: ev.currentTarget || ev.target,
			});
		},

		oepnInstanceMenu(ev) {
			this.$root.menu({
				items: [{
					type: 'link',
					text: this.$t('statistics'),
					to: '/instance/stats',
					icon: faChartBar,
				}, {
					type: 'link',
					text: this.$t('customEmojis'),
					to: '/instance/emojis',
					icon: faLaugh,
				}, {
					type: 'link',
					text: this.$t('users'),
					to: '/instance/users',
					icon: faUsers,
				}, {
					type: 'link',
					text: this.$t('files'),
					to: '/instance/files',
					icon: faCloud,
				}, {
					type: 'link',
					text: this.$t('monitor'),
					to: '/instance/monitor',
					icon: faTachometerAlt,
				}, {
					type: 'link',
					text: this.$t('jobQueue'),
					to: '/instance/queue',
					icon: faExchangeAlt,
				}, {
					type: 'link',
					text: this.$t('federation'),
					to: '/instance/federation',
					icon: faGlobe,
				}, {
					type: 'link',
					text: this.$t('announcements'),
					to: '/instance/announcements',
					icon: faBroadcastTower,
				}, null, {
					type: 'link',
					text: this.$t('general'),
					to: '/instance',
					icon: faCog,
				}],
				align: 'left',
				fixed: true,
				width: 200,
				source: ev.currentTarget || ev.target,
			});
		},

		more(ev) {
			this.$root.menu({
				items: [...(this.$store.getters.isSignedIn ? [{
					type: 'link',
					text: this.$t('lists'),
					to: '/my/lists',
					icon: faListUl,
				}, {
					type: 'link',
					text: this.$t('antennas'),
					to: '/my/antennas',
					icon: faSatellite,
				}, {
					type: 'link',
					text: this.$t('mentions'),
					to: '/my/mentions',
					icon: faAt,
					indicate: this.$store.state.i.hasUnreadMentions
				}, {
					type: 'link',
					text: this.$t('directNotes'),
					to: '/my/messages',
					icon: faEnvelope,
					indicate: this.$store.state.i.hasUnreadSpecifiedNotes
				}, {
					type: 'link',
					text: this.$t('favorites'),
					to: '/my/favorites',
					icon: faStar,
				}, {
					type: 'link',
					text: this.$t('pages'),
					to: '/my/pages',
					icon: faFileAlt,
				}, {
					type: 'link',
					text: this.$t('games'),
					to: '/games',
					icon: faGamepad,
				}, null] : []), {
					type: 'link',
					text: this.$t('about'),
					to: '/about',
					icon: faInfoCircle,
				}],
				align: 'left',
				fixed: true,
				width: 200,
				source: ev.currentTarget || ev.target,
			});
		},

		async addAcount() {
			this.$root.new(await import('./components/signin-dialog.vue').then(m => m.default)).$once('login', res => {
				this.$store.dispatch('addAcount', res);
				this.$root.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			});
		},

		async switchAccount(account) {
			const token = this.$store.state.device.accounts.find(x => x.id === account.id).token;
			this.$root.api('i', {}, token).then(i => {
				this.$store.dispatch('switchAccount', {
					...i,
					token: token
				});
				location.reload();
			});
		},

		onNotification(notification) {
			// TODO: ユーザーが画面を見てないと思われるとき(ブラウザやタブがアクティブじゃないなど)は送信しない
			this.$root.stream.send('readNotification', {
				id: notification.id
			});

			this.$root.new(MkToast, {
				notification
			});
		},

		onMousedown(e) {
			e.preventDefault();
			if (!contains(this.$refs.notifications.$el, e.target) &&
				!contains(this.$refs.notificationButton, e.target) &&
				!contains(this.$refs.notificationButton2, e.target)
				) this.notificationsOpen = false;
			return false;
		},

		widgetFunc(id) {
			const w = this.$refs[id][0];
			if (w.func) w.func();
		},

		onWidgetSort() {
			this.saveHome();
		},

		addWidget(ev) {
			const widgets = [
				'memo',
				'notifications',
				'timeline',
				'calendar',
				'rss',
				'trends',
			];

			this.$root.menu({
				items: widgets.map(widget => ({
					text: this.$t('_widgets.' + widget),
					action: () => {
						this.$store.dispatch('settings/addWidget', {
							name: widget,
							id: uuid(),
							data: {}
						});
					}
				})),
				source: ev.currentTarget || ev.target,
			});
		},

		removeWidget(widget) {
			this.$store.dispatch('settings/removeWidget', widget);
		},

		saveHome() {
			this.$store.dispatch('settings/setWidgets', this.widgets);
		}
	}
});
</script>

<style lang="scss" scoped>
.header-enter-active, .header-leave-active {
	transition: opacity 0.5s, transform 0.5s !important;
}
.header-enter {
	opacity: 0;
	transform: scale(0.9);
}
.header-leave-to {
	opacity: 0;
	transform: scale(0.9);
}

.page-enter-active, .page-leave-active {
	transition: opacity 0.5s, transform 0.5s !important;
}
.page-enter {
	opacity: 0;
	transform: translateY(-32px);
}
.page-leave-to {
	opacity: 0;
	transform: translateY(32px);
}

.mk-app {
	$header-height: 60px;
	$nav-width: 250px;
	$nav-icon-only-width: 74px;
	$main-width: 700px;
	$ui-font-size: 1em;
	$nav-icon-only-threshold: 1300px;
	$nav-hide-threshold: 700px;
	$side-hide-threshold: 1100px;

	min-height: 100vh;
	box-sizing: border-box;
	padding-top: $header-height;

	&, > .header > .body {
		display: flex;
		margin: 0 auto;
	}

	> .header {
		position: fixed;
		z-index: 1000;
		top: 0;
		right: 0;
		height: $header-height;
		width: calc(100% - #{$nav-width});
		//background-color: var(--panel);
		-webkit-backdrop-filter: blur(32px);
		backdrop-filter: blur(32px);
		background-color: var(--header);
		border-bottom: solid 1px var(--divider);

		@media (max-width: $nav-icon-only-threshold) {
			width: calc(100% - #{$nav-icon-only-width});
		}

		@media (max-width: $nav-hide-threshold) {
			width: 100%;
		}

		> .title {
			position: relative;
			line-height: $header-height;
			height: $header-height;
			max-width: $main-width;
			text-align: center;

			> .back {
				position: absolute;
				z-index: 1;
				top: 0;
				left: 0;
				height: $header-height;
				width: $header-height;
			}

			> .body {
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				height: $header-height;

				> .default {
					padding: 0 $header-height;

					> .avatar {
						$size: 32px;
						display: inline-block;
						width: $size;
						height: $size;
						vertical-align: bottom;
						margin: (($header-height - $size) / 2) 8px (($header-height - $size) / 2) 0;
					}

					> .title {
						display: inline-block;
						font-size: $ui-font-size;
						margin: 0;
						line-height: $header-height;

						> [data-icon] {
							margin-right: 8px;
						}
					}
				}

				> .custom {
					position: absolute;
					top: 0;
					left: 0;
					height: 100%;
					width: 100%;
				}
			}
		}

		> .sub {
			$post-button-size: 42px;
			$post-button-margin: (($header-height - $post-button-size) / 2);
			position: absolute;
			top: 0;
			right: 16px;
			height: $header-height;

			@media (max-width: $side-hide-threshold) {
				display: none;
			}

			> [data-icon] {
				position: absolute;
				top: 0;
				left: 16px;
				height: $header-height;
				pointer-events: none;
				font-size: 16px;
			}

			> .search {
				$margin: 8px;
				width: calc(100% - #{$post-button-size + $post-button-margin + $margin});
				box-sizing: border-box;
				margin-right: $margin;
				padding: 0 12px 0 42px;
				font-size: 1rem;
				line-height: 38px;
				border: none;
				border-radius: 38px;
				color: var(--fg);
				background: var(--bg);

				&:focus {
					outline: none;
				}
			}

			> .post {
				width: $post-button-size;
				height: $post-button-size;
				margin: $post-button-margin 0 $post-button-margin $post-button-margin;
				border-radius: 100%;
				font-size: 16px;
			}
		}
	}

	> .nav {
		$avatar-size: 32px;
		$avatar-margin: ($header-height - $avatar-size) / 2;

		flex: 0 0 $nav-width;
		width: $nav-width;
		box-sizing: border-box;

		@media (max-width: $nav-icon-only-threshold) {
			flex: 0 0 $nav-icon-only-width;
			width: $nav-icon-only-width;
		}

		@media (max-width: $nav-hide-threshold) {
			display: none;
		}

		> div {
			position: fixed;
			top: 0;
			left: 0;
			z-index: 1001;
			width: $nav-width;
			height: 100vh;
			padding-top: 16px;
			box-sizing: border-box;
			background: var(--navBg);
			border-right: solid 1px var(--divider);

			@media (max-width: $nav-icon-only-threshold) {
				width: $nav-icon-only-width;
			}

			> .item {
				position: relative;
				display: block;
				padding-left: 32px;
				font-size: $ui-font-size;
				font-weight: bold;
				line-height: 3.2rem;
				text-overflow: ellipsis;
				overflow: hidden;
				white-space: nowrap;
				width: 100%;
				text-align: left;
				box-sizing: border-box;
				color: var(--navFg);

				&:not(.active) {
					opacity: 0.85;

					&:hover {
						opacity: 1;

						> [data-icon] {
							opacity: 1;
						}
					}

					> [data-icon] {
						opacity: 0.85;
					}
				}

				> [data-icon] {
					width: ($header-height - ($avatar-margin * 2));
				}

				> [data-icon],
				> .avatar {
					margin-right: $avatar-margin;
				}

				> .avatar {
					width: $avatar-size;
					height: $avatar-size;
					vertical-align: middle;
				}

				> i {
					position: absolute;
					top: 0;
					left: 20px;
					color: var(--navIndicator);
					font-size: 8px;
					animation: blink 1s infinite;
				}

				&:hover {
					text-decoration: none;
				}

				&.active {
					color: var(--navActive);
				}

				@media (max-width: $nav-icon-only-threshold) {
					padding-left: 0;
					width: 100%;
					text-align: center;
					font-size: $ui-font-size * 1.2;
					line-height: 3.7rem;

					> [data-icon],
					> .avatar {
						margin-right: 0;
					}

					> i {
						left: 10px;
					}

					> .text {
						display: none;
					}
				}
			}
		}
	}

	> .contents {
		display: flex;
		margin: 0 auto;
		min-width: 0;

		> main {
			width: $main-width;
			min-width: $main-width;

			@media (max-width: $side-hide-threshold) {
				min-width: 0;
			}

			> .content {
				padding: 16px;
				box-sizing: border-box;

				@media (max-width: 500px) {
					padding: 8px;
				}
			}

			> .powerd-by {
				font-size: 14px;
				text-align: center;
				margin: 32px 0;
				visibility: hidden;

				&.visible {
					visibility: visible;
				}

				&:not(.visible) {
					@media (min-width: 850px) {
						display: none;
					}
				}

				@media (max-width: 500px) {
					margin-top: 16px;
				}

				> small {
					display: block;
					margin-top: 8px;
					opacity: 0.5;

					@media (max-width: 500px) {
						margin-top: 4px;
					}
				}
			}
		}

		> .widgets {
			box-sizing: border-box;

			@media (max-width: $side-hide-threshold) {
				display: none;
			}

			> div {
				position: sticky;
				top: calc(#{$header-height} + var(--margin));
				height: calc(100vh - #{$header-height} - var(--margin));

				&.edit {
					overflow: auto;
					width: auto !important;
				}

				&:not(.edit) {
					display: inline-flex;
					flex-wrap: wrap;
					flex-direction: column;
					place-content: flex-start;
				}

				> * {
					margin: 0 var(--margin) var(--margin) 0;
					width: 300px;
				}

				> .add {
					margin: 0 auto;
				}

				> .edit {
					display: block;
					font-size: 0.9em;
					margin: 0 auto;
				}

				.customize-container {
					margin: 8px 0;
					background: #fff;

					> header {
						position: relative;
						line-height: 32px;
						background: #eee;

						> .handle {
							padding: 0 8px;
						}

						> .remove {
							position: absolute;
							top: 0;
							right: 0;
							padding: 0 8px;
							line-height: 32px;
						}
					}

					> div {
						padding: 8px;

						> * {
							pointer-events: none;
						}
					}
				}
			}
		}
	}

	> .post {
		display: none;
		position: fixed;
		z-index: 1000;
		bottom: 32px;
		right: 32px;
		width: 64px;
		height: 64px;
		border-radius: 100%;
		box-shadow: 0 3px 5px -1px rgba(0, 0, 0, 0.2), 0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12);
		font-size: 22px;

		@media (min-width: ($nav-hide-threshold + 1px)) {
			display: block;
		}

		@media (min-width: ($side-hide-threshold + 1px)) {
			display: none;
		}
	}

	> .buttons {
		position: fixed;
		z-index: 1000;
		bottom: 0;
		padding: 0 32px 32px 32px;
		display: flex;
		width: 100%;
		box-sizing: border-box;
		background: linear-gradient(0deg, var(--bg), var(--bonzsgfz));

		@media (max-width: 500px) {
			padding: 0 16px 16px 16px;
		}

		@media (min-width: ($nav-hide-threshold + 1px)) {
			display: none;
		}

		> .button {
			position: relative;
			padding: 0;
			margin: auto;
			width: 64px;
			height: 64px;
			border-radius: 100%;
			box-shadow: 0 3px 5px -1px rgba(0, 0, 0, 0.2), 0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12);

			&:first-child {
				margin-left: 0;
			}

			&:last-child {
				margin-right: 0;
			}

			> * {
				font-size: 22px;
			}

			&:disabled {
				cursor: default;

				> * {
					opacity: 0.5;
				}
			}

			&:not(.post) {
				background: var(--panel);
				color: var(--fg);

				&:hover {
					background: var(--pcncwizz);
				}

				> i {
					position: absolute;
					top: 0;
					left: 0;
					color: var(--accent);
					font-size: 16px;
					animation: blink 1s infinite;
				}
			}
		}
	}

	> .notifications {
		position: fixed;
		top: 32px;
		left: 0;
		right: 0;
		margin: 0 auto;
		z-index: 10001;
		width: 350px;
		height: 400px;
		background: var(--vocsgcxy);
		-webkit-backdrop-filter: blur(12px);
		backdrop-filter: blur(12px);
		border-radius: 6px;
		box-shadow: 0 3px 12px rgba(27, 31, 35, 0.15);
		overflow: hidden;

		@media (max-width: 800px) {
			width: 320px;
			height: 350px;
		}

		@media (max-width: 500px) {
			width: 290px;
			height: 310px;
		}
	}
}
</style>
