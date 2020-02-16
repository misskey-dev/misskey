<template>
<div class="mk-app" v-hotkey.global="keymap">
	<header class="header">
		<div class="title" ref="title">
			<transition :name="$store.state.device.animation ? 'header' : ''" mode="out-in" appear>
				<button class="_button back" v-if="canBack" @click="back()"><fa :icon="faChevronLeft"/></button>
			</transition>
			<transition :name="$store.state.device.animation ? 'header' : ''" mode="out-in" appear>
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
			<button v-if="widgetsEditMode" class="_button edit active" @click="widgetsEditMode = false"><fa :icon="faGripVertical"/></button>
			<button v-else class="_button edit" @click="widgetsEditMode = true"><fa :icon="faGripVertical"/></button>
			<div class="search">
				<fa :icon="faSearch"/>
				<input type="search" :placeholder="$t('search')" v-model="searchQuery" v-autocomplete="{ model: 'searchQuery' }" :disabled="searchWait" @keypress="searchKeypress"/>
			</div>
			<button v-if="$store.getters.isSignedIn" class="post _buttonPrimary" @click="post()"><fa :icon="faPencilAlt"/></button>
			<x-clock v-if="isDesktop" class="clock"/>
		</div>
	</header>

	<transition name="nav-back">
		<div class="nav-back"
			v-if="showNav"
			@click="showNav = false"
			@touchstart="showNav = false"
		></div>
	</transition>

	<transition name="nav">
		<nav class="nav" ref="nav" v-show="showNav">
			<div>
				<button class="item _button account" @click="openAccountMenu" v-if="$store.getters.isSignedIn">
					<mk-avatar :user="$store.state.i" class="avatar"/><mk-acct class="text" :user="$store.state.i"/>
				</button>
				<div class="divider"></div>
				<router-link class="item index" active-class="active" to="/" exact v-if="$store.getters.isSignedIn">
					<fa :icon="faHome" fixed-width/><span class="text">{{ $t('timeline') }}</span>
				</router-link>
				<router-link class="item index" active-class="active" to="/" exact v-else>
					<fa :icon="faHome" fixed-width/><span class="text">{{ $t('home') }}</span>
				</router-link>
				<button class="item _button notifications" @click="notificationsOpen = !notificationsOpen" ref="notificationButton" v-if="$store.getters.isSignedIn">
					<fa :icon="faBell" fixed-width/><span class="text">{{ $t('notifications') }}</span>
					<i v-if="$store.state.i.hasUnreadNotification"><fa :icon="faCircle"/></i>
				</button>
				<router-link class="item" active-class="active" to="/my/messaging" v-if="$store.getters.isSignedIn">
					<fa :icon="faComments" fixed-width/><span class="text">{{ $t('messaging') }}</span>
					<i v-if="$store.state.i.hasUnreadMessagingMessage"><fa :icon="faCircle"/></i>
				</router-link>
				<router-link class="item" active-class="active" to="/my/drive" v-if="$store.getters.isSignedIn">
					<fa :icon="faCloud" fixed-width/><span class="text">{{ $t('drive') }}</span>
				</router-link>
				<router-link class="item" active-class="active" to="/my/follow-requests" v-if="$store.getters.isSignedIn && $store.state.i.isLocked">
					<fa :icon="faUserClock" fixed-width/><span class="text">{{ $t('followRequests') }}</span>
					<i v-if="$store.state.i.hasPendingReceivedFollowRequest"><fa :icon="faCircle"/></i>
				</router-link>
				<div class="divider"></div>
				<router-link class="item" active-class="active" to="/featured">
					<fa :icon="faFireAlt" fixed-width/><span class="text">{{ $t('featured') }}</span>
				</router-link>
				<router-link class="item" active-class="active" to="/explore">
					<fa :icon="faHashtag" fixed-width/><span class="text">{{ $t('explore') }}</span>
				</router-link>
				<router-link class="item" active-class="active" to="/announcements">
					<fa :icon="faBroadcastTower" fixed-width/><span class="text">{{ $t('announcements') }}</span>
					<i v-if="$store.getters.isSignedIn && $store.state.i.hasUnreadAnnouncement"><fa :icon="faCircle"/></i>
				</router-link>
				<button class="item _button" @click="search()">
					<fa :icon="faSearch" fixed-width/><span class="text">{{ $t('search') }}</span>
				</button>
				<div class="divider"></div>
				<button class="item _button" :class="{ active: $route.path === '/instance' || $route.path.startsWith('/instance/') }" v-if="$store.getters.isSignedIn && ($store.state.i.isAdmin || $store.state.i.isModerator)" @click="oepnInstanceMenu">
					<fa :icon="faServer" fixed-width/><span class="text">{{ $t('instance') }}</span>
				</button>
				<button class="item _button" @click="more">
					<fa :icon="faEllipsisH" fixed-width/><span class="text">{{ $t('more') }}</span>
					<i v-if="$store.getters.isSignedIn && ($store.state.i.hasUnreadMentions || $store.state.i.hasUnreadSpecifiedNotes)"><fa :icon="faCircle"/></i>
				</button>
				<router-link class="item" active-class="active" to="/settings">
					<fa :icon="faCog" fixed-width/><span class="text">{{ $t('settings') }}</span>
				</router-link>
			</div>
		</nav>
	</transition>

	<div class="contents" ref="contents" :class="{ wallpaper }">
		<main ref="main">
			<div class="content">
				<transition :name="$store.state.device.animation ? 'page' : ''" mode="out-in" @enter="onTransition">
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
				<template v-if="isDesktop && $store.getters.isSignedIn">
					<template v-if="widgetsEditMode">
						<mk-button primary @click="addWidget" class="add"><fa :icon="faPlus"/></mk-button>
						<x-draggable
							:list="widgets"
							handle=".handle"
							animation="150"
							class="sortable"
							@sort="onWidgetSort"
						>
							<div v-for="widget in widgets" class="customize-container _panel" :key="widget.id">
								<header>
									<span class="handle"><fa :icon="faBars"/></span>{{ $t('_widgets.' + widget.name) }}<button class="remove _button" @click="removeWidget(widget)"><fa :icon="faTimes"/></button>
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
				</template>
			</div>
		</div>
	</div>

	<div class="buttons">
		<button v-if="$store.getters.isSignedIn" class="button nav _button" @click="showNav = true" ref="navButton"><fa :icon="faBars"/><i v-if="$store.state.i.hasUnreadSpecifiedNotes || $store.state.i.hasPendingReceivedFollowRequest || $store.state.i.hasUnreadMessagingMessage || $store.state.i.hasUnreadAnnouncement"><fa :icon="faCircle"/></i></button>
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
import { faGripVertical, faChevronLeft, faHashtag, faBroadcastTower, faFireAlt, faEllipsisH, faPencilAlt, faBars, faTimes, faSearch, faUserCog, faCog, faUser, faHome, faStar, faCircle, faAt, faListUl, faPlus, faUserClock, faUsers, faTachometerAlt, faExchangeAlt, faGlobe, faChartBar, faCloud, faGamepad, faServer, faFileAlt, faSatellite, faInfoCircle, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { faBell, faEnvelope, faLaugh, faComments } from '@fortawesome/free-regular-svg-icons';
import { ResizeObserver } from '@juggle/resize-observer';
import { v4 as uuid } from 'uuid';
import i18n from './i18n';
import { host, instanceName } from './config';
import { search } from './scripts/search';
import contains from './scripts/contains';
import MkToast from './components/toast.vue';

const DESKTOP_THRESHOLD = 1100;

export default Vue.extend({
	i18n,

	components: {
		XClock: () => import('./components/header-clock.vue').then(m => m.default),
		XNotifications: () => import('./components/notifications.vue').then(m => m.default),
		MkButton: () => import('./components/ui/button.vue').then(m => m.default),
		XDraggable: () => import('vuedraggable'),
	},

	data() {
		return {
			host: host,
			pageKey: 0,
			showNav: false,
			searching: false,
			notificationsOpen: false,
			accounts: [],
			lists: [],
			connection: null,
			searchQuery: '',
			searchWait: false,
			widgetsEditMode: false,
			isDesktop: window.innerWidth >= DESKTOP_THRESHOLD,
			canBack: false,
			disconnectedDialog: null as Promise<void> | null,
			wallpaper: localStorage.getItem('wallpaper') != null,
			faGripVertical, faChevronLeft, faComments, faHashtag, faBroadcastTower, faFireAlt, faEllipsisH, faPencilAlt, faBars, faTimes, faBell, faSearch, faUserCog, faCog, faUser, faHome, faStar, faCircle, faAt, faEnvelope, faListUl, faPlus, faUserClock, faLaugh, faUsers, faTachometerAlt, faExchangeAlt, faGlobe, faChartBar, faCloud, faServer
		};
	},

	computed: {
		keymap(): any {
			return {
				'p': this.post,
				'n': this.post,
				's': this.search,
				'h|/': this.help
			};
		},

		widgets(): any[] {
			return this.$store.state.deviceUser.widgets;
		}
	},

	watch:{
		$route(to, from) {
			this.pageKey++;
			this.notificationsOpen = false;
			this.showNav = false;
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
		},

		isDesktop() {
			if (this.isDesktop) this.adjustWidgetsWidth();
		}
	},

	created() {
		if (this.$store.getters.isSignedIn) {
			this.connection = this.$root.stream.useSharedConnection('main');
			this.connection.on('notification', this.onNotification);

			if (this.widgets.length === 0) {
				this.$store.commit('deviceUser/setWidgets', [{
					name: 'calendar',
					id: 'a', data: {}
				}, {
					name: 'notifications',
					id: 'b', data: {}
				}, {
					name: 'trends',
					id: 'c', data: {}
				}]);
			}
		}

		this.$root.stream.on('_disconnected_', () => {
			if (this.disconnectedDialog) return;
			if (this.$store.state.device.autoReload) {
				location.reload();
				return;
			}

			setTimeout(() => {
				if (this.$root.stream.state !== 'reconnecting') return;

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
			}, 150)
		});
	},

	mounted() {
		if (this.isDesktop) this.adjustWidgetsWidth();

		const adjustTitlePosition = () => {
			this.$refs.title.style.left = (this.$refs.main.getBoundingClientRect().left - this.$refs.nav.offsetWidth) + 'px';
		};

		adjustTitlePosition();

		const ro = new ResizeObserver((entries, observer) => {
			adjustTitlePosition();
		});

		ro.observe(this.$refs.contents);

		window.addEventListener('resize', adjustTitlePosition, { passive: true });

		if (!this.isDesktop) {
			window.addEventListener('resize', () => {
				if (window.innerWidth >= DESKTOP_THRESHOLD) this.isDesktop = true;
			}, { passive: true });
		}
	},

	methods: {
		adjustWidgetsWidth() {
			// https://stackoverflow.com/questions/33891709/when-flexbox-items-wrap-in-column-mode-container-does-not-grow-its-width
			const adjust = () => {
				const lastChild = this.$refs.widgets.children[this.$refs.widgets.children.length - 1];
				if (lastChild == null) return;

				const width = lastChild.offsetLeft + 300 + 16;
				this.$refs.widgets.style.width = width + 'px';
			};
			setInterval(adjust, 1000);
			setTimeout(adjust, 100);
		},

		help() {
			this.$router.push('/docs/keyboard-shortcut');
		},

		back() {
			if (this.canBack) window.history.back();
		},

		onTransition() {
			if (window._scroll) window._scroll();
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

		async openAccountMenu(ev) {
			const accounts = (await this.$root.api('users/show', { userIds: this.$store.state.device.accounts.map(x => x.id) })).filter(x => x.id !== this.$store.state.i.id);

			const accountItems = accounts.map(account => ({
				type: 'user',
				user: account,
				action: () => { this.switchAccount(account); }
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
				}, null, ...accountItems, {
					type: 'item',
					icon: faPlus,
					text: this.$t('addAcount'),
					action: () => {
						this.$root.menu({
							items: [{
								type: 'item',
								text: this.$t('existingAcount'),
								action: () => { this.addAcount(); },
							}, {
								type: 'item',
								text: this.$t('createAccount'),
								action: () => { this.createAccount(); },
							}],
							align: 'left',
							fixed: true,
							width: 240,
							source: ev.currentTarget || ev.target,
						});
					},
				}]],
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
					text: this.$t('dashboard'),
					to: '/instance',
					icon: faTachometerAlt,
				}, null, {
					type: 'link',
					text: this.$t('settings'),
					to: '/instance/settings',
					icon: faCog,
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
					text: this.$t('groups'),
					to: '/my/groups',
					icon: faUsers,
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
					text: this.$t('help'),
					to: '/docs',
					icon: faQuestionCircle,
				}, {
					type: 'link',
					text: this.$t('aboutX', { x: instanceName || host }),
					to: '/about',
					icon: faInfoCircle,
				}, {
					type: 'link',
					text: this.$t('aboutMisskey'),
					to: '/about-misskey',
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

		async createAccount() {
			this.$root.new(await import('./components/signup-dialog.vue').then(m => m.default)).$once('signup', res => {
				this.$store.dispatch('addAcount', res);
				this.switchAccountWithToken(res.i);
			});
		},

		async switchAccount(account: any) {
			const token = this.$store.state.device.accounts.find((x: any) => x.id === account.id).token;
			this.switchAccountWithToken(token);
		},

		switchAccountWithToken(token: string) {
			this.$root.dialog({
				type: 'waiting',
				iconOnly: true
			});

			this.$root.api('i', {}, token).then((i: any) => {
				this.$store.dispatch('switchAccount', {
					...i,
					token: token
				}).then(() => {
					location.reload();
				});
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
				'clock'
			];

			this.$root.menu({
				items: widgets.map(widget => ({
					text: this.$t('_widgets.' + widget),
					action: () => {
						this.$store.commit('deviceUser/addWidget', {
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
			this.$store.commit('deviceUser/removeWidget', widget);
		},

		saveHome() {
			this.$store.commit('deviceUser/setWidgets', this.widgets);
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

.nav-enter-active,
.nav-leave-active {
	opacity: 1;
	transform: translateX(0);
	transition: transform 300ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.nav-enter,
.nav-leave-active {
	opacity: 0;
	transform: translateX(-240px);
}

.nav-back-enter-active,
.nav-back-leave-active {
	opacity: 1;
	transition: opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.nav-back-enter,
.nav-back-leave-active {
	opacity: 0;
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
			display: flex;
			align-items: center;
			position: absolute;
			top: 0;
			right: 16px;
			height: $header-height;

			@media (max-width: $side-hide-threshold) {
				display: none;
			}

			> .edit {
				padding: 16px;

				&.active {
					color: var(--accent);
				}
			}

			> .search {
				position: relative;

				> input {
					width: 220px;
					box-sizing: border-box;
					margin-right: 8px;
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

				> [data-icon] {
					position: absolute;
					top: 0;
					left: 16px;
					height: 100%;
					pointer-events: none;
					font-size: 16px;
				}
			}

			> .post {
				width: $post-button-size;
				height: $post-button-size;
				margin-left: $post-button-margin;
				border-radius: 100%;
				font-size: 16px;
			}

			> .clock {
				margin-left: 8px;
			}
		}
	}

	> .nav-back {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 1001;
		width: 100%;
		height: 100%;
		background: var(--modalBg);
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
			position: fixed;
			top: 0;
			left: 0;
			z-index: 1001;
		}

		@media (min-width: $nav-hide-threshold + 1px) {
			display: block !important;
		}

		> div {
			position: fixed;
			top: 0;
			left: 0;
			z-index: 1001;
			width: $nav-width;
			height: 100vh;
			padding: 16px 0;
			padding-bottom: calc(3.7rem + 24px);
			box-sizing: border-box;
			overflow: auto;
			background: var(--navBg);
			border-right: solid 1px var(--divider);

			> .divider {
				margin: 16px 0;
				border-top: solid 1px var(--divider);
			}

			@media (max-width: $nav-icon-only-threshold) and (min-width: $nav-hide-threshold + 1px) {
				width: $nav-icon-only-width;
				padding: 8px 0;
				padding-bottom: calc(3.7rem + 24px);

				> .divider {
					margin: 8px auto;
					width: calc(100% - 32px);
				}
			}

			> .item {
				position: relative;
				display: block;
				padding-left: 32px;
				font-size: $ui-font-size;
				line-height: 3.2rem;
				text-overflow: ellipsis;
				overflow: hidden;
				white-space: nowrap;
				width: 100%;
				text-align: left;
				box-sizing: border-box;
				color: var(--navFg);

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
					color: var(--navHoverFg);
				}

				&.active {
					color: var(--navActive);
				}

				&:last-child {
					position: fixed;
					bottom: 0;
					width: inherit;
					padding-top: 8px;
					padding-bottom: 8px;
					background: var(--navBg);
					border-top: solid 1px var(--divider);
					border-right: solid 1px var(--divider);
				}

				@media (max-width: $nav-icon-only-threshold) and (min-width: $nav-hide-threshold + 1px) {
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

			@media (max-width: $nav-hide-threshold) {
				> .index,
				> .notifications {
					display: none;
				}
			}
		}
	}

	> .contents {
		display: flex;
		margin: 0 auto;
		min-width: 0;

		&.wallpaper {
			background: var(--wallpaperOverlay);
		}

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

				.customize-container {
					margin: 8px 0;
					background: #fff;

					> header {
						position: relative;
						line-height: 32px;

						> .handle {
							padding: 0 8px;
							cursor: move;
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
