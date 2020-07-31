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
			<template v-if="$store.getters.isSignedIn">
				<button v-if="widgetsEditMode" class="_button edit active" @click="widgetsEditMode = false"><fa :icon="faGripVertical"/></button>
				<button v-else class="_button edit" @click="widgetsEditMode = true"><fa :icon="faGripVertical"/></button>
			</template>
			<div class="search">
				<fa :icon="faSearch"/>
				<input type="search" :placeholder="$t('search')" v-model="searchQuery" v-autocomplete="{ model: 'searchQuery' }" :disabled="searchWait" @keypress="searchKeypress"/>
			</div>
			<button v-if="$store.getters.isSignedIn" class="post _buttonPrimary" @click="post()"><fa :icon="faPencilAlt"/></button>
			<x-clock v-if="isDesktop" class="clock"/>
		</div>
	</header>

	<x-sidebar ref="nav"/>

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
			<div v-for="place in ['left', 'right']" ref="widgets" class="widgets" :class="{ edit: widgetsEditMode, fixed: $store.state.device.fixedWidgetsPosition, empty: widgets[place].length === 0 && !widgetsEditMode }" :key="place">
				<div class="spacer"></div>
				<div class="container" v-if="widgetsEditMode">
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
								<component class="_close_ _forceContainerFull_" :is="`mkw-${widget.name}`" :widget="widget" :ref="widget.id" :is-customize-mode="true"/>
							</div>
						</div>
					</x-draggable>
				</div>
				<div class="container" v-else>
					<component v-for="widget in widgets[place]" class="_close_ _forceContainerFull_" :is="`mkw-${widget.name}`" :key="widget.id" :ref="widget.id" :widget="widget"/>
				</div>
			</div>
		</template>
	</div>

	<div class="buttons">
		<button class="button nav _button" @click="showNav" ref="navButton"><fa :icon="faBars"/><i v-if="navIndicated"><fa :icon="faCircle"/></i></button>
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
import { defineComponent, defineAsyncComponent } from 'vue';
import { faGripVertical, faChevronLeft, faHashtag, faBroadcastTower, faFireAlt, faEllipsisH, faPencilAlt, faBars, faTimes, faSearch, faUserCog, faCog, faUser, faHome, faStar, faCircle, faAt, faListUl, faPlus, faUserClock, faUsers, faTachometerAlt, faExchangeAlt, faGlobe, faChartBar, faCloud, faServer, faInfoCircle, faQuestionCircle, faProjectDiagram } from '@fortawesome/free-solid-svg-icons';
import { faBell, faEnvelope, faLaugh, faComments } from '@fortawesome/free-regular-svg-icons';
import { v4 as uuid } from 'uuid';
import { host } from './config';
import { search } from './scripts/search';
import { StickySidebar } from './scripts/sticky-sidebar';
import { widgets } from './widgets';
import XSidebar from './components/sidebar.vue';

const DESKTOP_THRESHOLD = 1100;

export default defineComponent({
	components: {
		XSidebar,
		XClock: defineAsyncComponent(() => import('./components/header-clock.vue').then(m => m.default)),
		MkButton: defineAsyncComponent(() => import('./components/ui/button.vue').then(m => m.default)),
		XDraggable: defineAsyncComponent(() => import('vuedraggable')),
	},

	data() {
		return {
			host: host,
			pageKey: 0,
			searching: false,
			connection: null,
			searchQuery: '',
			searchWait: false,
			widgetsEditMode: false,
			isDesktop: window.innerWidth >= DESKTOP_THRESHOLD,
			canBack: false,
			menuDef: this.$store.getters.nav({}),
			wallpaper: localStorage.getItem('wallpaper') != null,
			faGripVertical, faChevronLeft, faComments, faHashtag, faBroadcastTower, faFireAlt, faEllipsisH, faPencilAlt, faBars, faTimes, faBell, faSearch, faUserCog, faCog, faUser, faHome, faStar, faCircle, faAt, faEnvelope, faListUl, faPlus, faUserClock, faLaugh, faUsers, faTachometerAlt, faExchangeAlt, faGlobe, faChartBar, faCloud, faServer, faProjectDiagram
		};
	},

	computed: {
		keymap(): any {
			return {
				'd': () => {
					if (this.$store.state.device.syncDeviceDarkMode) return;
					this.$store.commit('device/set', { key: 'darkMode', value: !this.$store.state.device.darkMode });
				},
				'p': this.post,
				'n': this.post,
				's': this.search,
				'h|/': this.help
			};
		},

		widgets(): any {
			if (this.$store.getters.isSignedIn) {
				const widgets = this.$store.state.deviceUser.widgets;
				return {
					left: widgets.filter(x => x.place === 'left'),
					right: widgets.filter(x => x.place == null || x.place === 'right'),
					mobile: widgets.filter(x => x.place === 'mobile'),
				};
			} else {
				const right = [{
					name: 'calendar',
					id: 'b', place: 'right', data: {}
				}, {
					name: 'trends',
					id: 'c', place: 'right', data: {}
				}];

				if (this.$route.name !== 'index') {
					right.unshift({
						name: 'welcome',
						id: 'a', place: 'right', data: {}
					});
				}

				return {
					left: [],
					right,
					mobile: [],
				};
			}
		},

		menu(): string[] {
			return this.$store.state.deviceUser.menu;
		},

		navIndicated(): boolean {
			if (!this.$store.getters.isSignedIn) return false;
			for (const def in this.menuDef) {
				if (def === 'notifications') continue; // 通知は下にボタンとして表示されてるから
				if (this.menuDef[def].indicated) return true;
			}
			return false;
		}
	},

	watch: {
		$route(to, from) {
			this.pageKey++;
			this.canBack = (window.history.length > 0 && !['index'].includes(to.name));
		},

		isDesktop() {
			this.$nextTick(() => {
				this.attachSticky();
			});
		}
	},

	created() {
		document.documentElement.style.overflowY = 'scroll';

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
			const left = this.$refs.main.getBoundingClientRect().left - this.$refs.nav.$el.offsetWidth;
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

		// widget follow
		this.attachSticky();
	},

	methods: {
		showNav() {
			this.$refs.nav.show();
		},

		attachSticky() {
			if (!this.isDesktop) return;
			if (this.$store.state.device.fixedWidgetsPosition) return;

			const stickyWidgetColumns = this.$refs.widgets.map(w => new StickySidebar(w.children[1], w.children[0], w.offsetTop));
			window.addEventListener('scroll', () => {
				for (const stickyWidgetColumn of stickyWidgetColumns) {
					stickyWidgetColumn.calc(window.scrollY);
				}
			}, { passive: true });
		},

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
			this.$refs[id][0].setting();
		},

		onWidgetSort() {
			this.saveHome();
		},

		async addWidget(place) {
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
.mk-app {
	$header-height: 60px;
	$nav-width: 250px; // TODO: どこかに集約したい
	$nav-icon-only-width: 80px; // TODO: どこかに集約したい
	$main-width: 670px;
	$ui-font-size: 1em; // TODO: どこかに集約したい
	$nav-icon-only-threshold: 1279px; // TODO: どこかに集約したい
	$nav-hide-threshold: 650px; // TODO: どこかに集約したい
	$header-sub-hide-threshold: 1090px;
	$left-widgets-hide-threshold: 1600px;
	$right-widgets-hide-threshold: 1090px;

	// ほんとは単に 100vh と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
	min-height: calc(var(--vh, 1vh) * 100);
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
					-webkit-appearance: textfield;

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
					// ほんとは単に calc(100vh - #{$header-height}) と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
					min-height: calc((var(--vh, 1vh) * 100) - #{$header-height});
					box-sizing: border-box;
					padding: var(--margin);

					&.full {
						padding: 0 var(--margin);
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
			padding: 0 var(--margin);
			box-shadow: 1px 0 0 0 var(--divider), -1px 0 0 0 var(--divider);

			&.fixed {
				position: sticky;
				overflow: auto;
				// ほんとは単に calc(100vh - #{$header-height}) と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
				height: calc((var(--vh, 1vh) * 100) - #{$header-height});
				top: $header-height;
			}

			&:first-of-type {
				order: -1;

				@media (max-width: $left-widgets-hide-threshold) {
					display: none;
				}
			}

			&.empty {
				display: none;
			}

			@media (max-width: $right-widgets-hide-threshold) {
				display: none;
			}

			> .container {
				position: sticky;
				height: min-content;
				// ほんとは単に calc(100vh - #{$header-height}) と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
				min-height: calc((var(--vh, 1vh) * 100) - #{$header-height});
				padding: var(--margin) 0;
				box-sizing: border-box;

				> * {
					margin: var(--margin) 0;
					width: 300px;

					&:first-child {
						margin-top: 0;
					}

					&:last-child {
						margin-bottom: 0;
					}
				}
			}

			> .add {
				margin: 0 auto;
			}

			.customize-container {
				margin: 8px 0;

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
