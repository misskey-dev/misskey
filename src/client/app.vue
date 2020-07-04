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
				<button class="item _button index active" @click="top()" v-if="$route.name === 'index'">
					<fa :icon="faHome" fixed-width/><span class="text">{{ $store.getters.isSignedIn ? $t('timeline') : $t('home') }}</span>
				</button>
				<router-link class="item index" active-class="active" to="/" exact v-else>
					<fa :icon="faHome" fixed-width/><span class="text">{{ $store.getters.isSignedIn ? $t('timeline') : $t('home') }}</span>
				</router-link>
				<template v-for="item in menu">
					<div v-if="item === '-'" class="divider"></div>
					<component v-else-if="menuDef[item] && (menuDef[item].show !== false)" :is="menuDef[item].to ? 'router-link' : 'button'" class="item _button" :class="item" active-class="active" @click="() => { if (menuDef[item].action) menuDef[item].action() }" :to="menuDef[item].to">
						<fa :icon="menuDef[item].icon" fixed-width/><span class="text">{{ $t(menuDef[item].title) }}</span>
						<i v-if="menuDef[item].indicated"><fa :icon="faCircle"/></i>
					</component>
				</template>
				<div class="divider"></div>
				<button class="item _button" :class="{ active: $route.path === '/instance' || $route.path.startsWith('/instance/') }" v-if="$store.getters.isSignedIn && ($store.state.i.isAdmin || $store.state.i.isModerator)" @click="oepnInstanceMenu">
					<fa :icon="faServer" fixed-width/><span class="text">{{ $t('instance') }}</span>
				</button>
				<button class="item _button" @click="more">
					<fa :icon="faEllipsisH" fixed-width/><span class="text">{{ $t('more') }}</span>
					<i v-if="otherNavItemIndicated"><fa :icon="faCircle"/></i>
				</button>
				<router-link class="item" active-class="active" to="/preferences">
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

		<template v-if="isDesktop">
			<div class="widgets" :class="{ edit: widgetsEditMode }" v-for="place in ['left', 'right']" :key="place">
				<template v-if="widgetsEditMode">
					<mk-button primary @click="addWidget(place)" class="add"><fa :icon="faPlus"/></mk-button>
					<x-draggable
						:list="widgets[place]"
						handle=".handle"
						animation="150"
						class="sortable"
						@sort="onWidgetSort"
					>
						<div v-for="widget in widgets[place]" class="customize-container _panel" :key="widget.id">
							<header>
								<span class="handle"><fa :icon="faBars"/></span>{{ $t('_widgets.' + widget.name) }}<button class="remove _button" @click="removeWidget(widget)"><fa :icon="faTimes"/></button>
							</header>
							<div @click="widgetFunc(widget.id)">
								<component :is="`mkw-${widget.name}`" :widget="widget" :ref="widget.id" :is-customize-mode="true"/>
							</div>
						</div>
					</x-draggable>
				</template>
				<component v-else class="_widget" v-for="widget in widgets[place]" :is="`mkw-${widget.name}`" :key="widget.id" :ref="widget.id" :widget="widget"/>
			</div>
		</template>
	</div>

	<div class="buttons">
		<button class="button nav _button" @click="showNav = true" ref="navButton"><fa :icon="faBars"/><i v-if="navIndicated"><fa :icon="faCircle"/></i></button>
		<button v-if="$route.name === 'index'" class="button home _button" @click="top()"><fa :icon="faHome"/></button>
		<button v-else class="button home _button" @click="$router.push('/')"><fa :icon="faHome"/></button>
		<button v-if="$store.getters.isSignedIn" class="button notifications _button" @click="$router.push('/my/notifications')"><fa :icon="faBell"/><i v-if="$store.state.i.hasUnreadNotification"><fa :icon="faCircle"/></i></button>
		<button v-if="$store.getters.isSignedIn" class="button post _buttonPrimary" @click="post()"><fa :icon="faPencilAlt"/></button>
	</div>

	<button v-if="$store.getters.isSignedIn" class="post _buttonPrimary" @click="post()"><fa :icon="faPencilAlt"/></button>

	<stream-indicator v-if="$store.getters.isSignedIn"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faGripVertical, faChevronLeft, faHashtag, faBroadcastTower, faFireAlt, faEllipsisH, faPencilAlt, faBars, faTimes, faSearch, faUserCog, faCog, faUser, faHome, faStar, faCircle, faAt, faListUl, faPlus, faUserClock, faUsers, faTachometerAlt, faExchangeAlt, faGlobe, faChartBar, faCloud, faServer, faInfoCircle, faQuestionCircle, faProjectDiagram } from '@fortawesome/free-solid-svg-icons';
import { faBell, faEnvelope, faLaugh, faComments } from '@fortawesome/free-regular-svg-icons';
import { ResizeObserver } from '@juggle/resize-observer';
import { v4 as uuid } from 'uuid';
import { host, instanceName } from './config';
import { search } from './scripts/search';

const DESKTOP_THRESHOLD = 1100;

export default Vue.extend({
	components: {
		XClock: () => import('./components/header-clock.vue').then(m => m.default),
		MkButton: () => import('./components/ui/button.vue').then(m => m.default),
		XDraggable: () => import('vuedraggable'),
	},

	data() {
		return {
			host: host,
			pageKey: 0,
			showNav: false,
			searching: false,
			accounts: [],
			lists: [],
			connection: null,
			searchQuery: '',
			searchWait: false,
			widgetsEditMode: false,
			menuDef: this.$store.getters.nav({
				search: this.search
			}),
			isDesktop: window.innerWidth >= DESKTOP_THRESHOLD,
			canBack: false,
			wallpaper: localStorage.getItem('wallpaper') != null,
			faGripVertical, faChevronLeft, faComments, faHashtag, faBroadcastTower, faFireAlt, faEllipsisH, faPencilAlt, faBars, faTimes, faBell, faSearch, faUserCog, faCog, faUser, faHome, faStar, faCircle, faAt, faEnvelope, faListUl, faPlus, faUserClock, faLaugh, faUsers, faTachometerAlt, faExchangeAlt, faGlobe, faChartBar, faCloud, faServer, faProjectDiagram
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
			if (this.$store.getters.isSignedIn) {
				const widgets = this.$store.state.deviceUser.widgets;
				return {
					left: widgets.filter(x => x.place === 'left'),
					right: widgets.filter(x => x.place == null || x.place === 'right'),
					mobile: widgets.filter(x => x.place === 'mobile'),
				};
			} else {
				return {
					left: [],
					right: [{
						name: 'welcome',
						id: 'a', place: 'right', data: {}
					}, {
						name: 'calendar',
						id: 'b', place: 'right', data: {}
					}, {
						name: 'trends',
						id: 'c', place: 'right', data: {}
					}],
					mobile: [],
				};
			}
		},

		menu(): string[] {
			return this.$store.state.deviceUser.menu;
		},

		otherNavItemIndicated(): boolean {
			if (!this.$store.getters.isSignedIn) return false;
			for (const def in this.menuDef) {
				if (this.menu.includes(def)) continue;
				if (this.menuDef[def].indicated) return true;
			}
			return false;
		},

		navIndicated(): boolean {
			if (!this.$store.getters.isSignedIn) return false;
			for (const def in this.menuDef) {
				if (def === 'timeline') continue;
				if (def === 'notifications') continue;
				if (this.menuDef[def].indicated) return true;
			}
			return false;
		}
	},

	watch:{
		$route(to, from) {
			this.pageKey++;
			this.showNav = false;
			this.canBack = (window.history.length > 0 && !['index'].includes(to.name));
		},
	},

	created() {
		if (this.$store.getters.isSignedIn) {
			this.connection = this.$root.stream.useSharedConnection('main');
			this.connection.on('notification', this.onNotification);

			if (this.$store.state.deviceUser.widgets.length === 0) {
				this.$store.commit('deviceUser/setWidgets', [{
					name: 'calendar',
					id: 'a', place: 'right', data: {}
				}, {
					name: 'notifications',
					id: 'b', place: 'right', data: {}
				}, {
					name: 'trends',
					id: 'c', place: 'right', data: {}
				}]);
			}
		}
	},

	mounted() {
		const adjustTitlePosition = () => {
			const left = this.$refs.main.getBoundingClientRect().left - this.$refs.nav.offsetWidth;
			if (left >= 0) {
				this.$refs.title.style.left = left + 'px';
			}
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
		top() {
			window.scroll({ top: 0, behavior: 'smooth' });
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
				if (canceled || query == null || query === '') return;

				this.searching = true;
				search(this, query).finally(() => {
					this.searching = false;
				});
			});
		},

		searchKeypress(e) {
			if (e.keyCode === 13) {
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
					text: this.$t('accountSettings'),
					to: '/my/settings',
					icon: faCog,
				}, null, ...accountItems, {
					icon: faPlus,
					text: this.$t('addAcount'),
					action: () => {
						this.$root.menu({
							items: [{
								text: this.$t('existingAcount'),
								action: () => { this.addAcount(); },
							}, {
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
					text: this.$t('relays'),
					to: '/instance/relays',
					icon: faProjectDiagram,
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
			const items = Object.keys(this.menuDef).filter(k => !this.menu.includes(k)).map(k => this.menuDef[k]).filter(def => def.show == null ? true : def.show).map(def => ({
				type: def.to ? 'link' : 'button',
				text: this.$t(def.title),
				icon: def.icon,
				to: def.to,
				action: def.action,
				indicate: def.indicated,
			}));
			this.$root.menu({
				items: [...items, null, {
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
					this.$nextTick(() => {
						location.reload();
					});
				});
			});
		},

		async onNotification(notification) {
			if (document.visibilityState === 'visible') {
				this.$root.stream.send('readNotification', {
					id: notification.id
				});

				this.$root.new(await import('./components/toast.vue').then(m => m.default), {
					notification
				});
			}

			this.$root.sound('notification');
		},

		widgetFunc(id) {
			const w = this.$refs[id][0];
			if (w.func) w.func();
		},

		onWidgetSort() {
			this.saveHome();
		},

		async addWidget(place) {
			const widgets = [
				'memo',
				'notifications',
				'timeline',
				'calendar',
				'rss',
				'trends',
				'clock',
				'activity',
				'photos',
			];

			const { canceled, result: widget } = await this.$root.dialog({
				type: null,
				title: this.$t('chooseWidget'),
				select: {
					items: widgets.map(widget => ({
						value: widget,
						text: this.$t('_widgets.' + widget),
					}))
				},
				showCancelButton: true
			});
			if (canceled) return;

			this.$store.commit('deviceUser/addWidget', {
				name: widget,
				id: uuid(),
				place: place,
				data: {}
			});
		},

		removeWidget(widget) {
			this.$store.commit('deviceUser/removeWidget', widget);
		},

		saveHome() {
			this.$store.commit('deviceUser/setWidgets', [...this.widgets.left, ...this.widgets.right, ...this.widgets.mobile]);
		}
	}
});
</script>

<style lang="scss" scoped>
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
	$nav-icon-only-width: 80px;
	$main-width: 670px;
	$ui-font-size: 1em;
	$nav-icon-only-threshold: 1279px;
	$nav-hide-threshold: 650px;
	$header-sub-hide-threshold: 1090px;
	$left-widgets-hide-threshold: 1600px;
	$right-widgets-hide-threshold: 1090px;

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

			@media (max-width: $header-sub-hide-threshold) {
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

				> .divider {
					margin: 8px auto;
					width: calc(100% - 32px);
				}

				> .item {
					&:first-child {
						margin-bottom: 8px;
					}

					&:last-child {
						margin-top: 8px;
					}
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

				&:first-child, &:last-child {
					position: sticky;
					z-index: 1;
					padding-top: 8px;
					padding-bottom: 8px;
					background: var(--X14);
					-webkit-backdrop-filter: blur(8px);
					backdrop-filter: blur(8px);
				}

				&:first-child {
					top: 0;
					margin-bottom: 16px;
					border-bottom: solid 1px var(--divider);
				}

				&:last-child {
					bottom: 0;
					margin-top: 16px;
					border-top: solid 1px var(--divider);
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
			backdrop-filter: blur(4px);
		}

		> main {
			width: $main-width;
			min-width: 0;

			> .content {
				> * {
					min-height: calc(100vh - #{$header-height});
					box-sizing: border-box;
					padding: var(--margin);

					&.full {
						padding: 0 var(--margin);
					}

					&.naked {
						background: var(--bg);
					}
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
			position: sticky;
			top: $header-height;
			height: calc(100vh - #{$header-height});
			padding: 0 var(--margin);
			overflow: auto;
			box-shadow: 1px 0 0 0 var(--divider), -1px 0 0 0 var(--divider);

			&:first-of-type {
				order: -1;

				@media (max-width: $left-widgets-hide-threshold) {
					display: none;
				}
			}

			&:empty {
				display: none;
			}

			@media (max-width: $right-widgets-hide-threshold) {
				display: none;
			}

			> * {
				margin: var(--margin) 0;
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

		@media (min-width: ($header-sub-hide-threshold + 1px)) {
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
		background: linear-gradient(0deg, var(--bg), var(--X1));

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
					background: var(--X2);
				}

				> i {
					position: absolute;
					top: 0;
					left: 0;
					color: var(--indicator);
					font-size: 16px;
					animation: blink 1s infinite;
				}
			}
		}
	}
}
</style>
