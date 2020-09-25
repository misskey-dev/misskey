<template>
<div class="mk-app" v-hotkey.global="keymap">
	<XSidebar ref="nav"/>

	<div class="contents" ref="contents" :class="{ wallpaper }">
		<header class="header" ref="header">
			<transition :name="$store.state.device.animation ? 'header' : ''" mode="out-in" appear>
				<button class="_button back" v-if="canBack" @click="back()"><Fa :icon="faChevronLeft"/></button>
			</transition>
			<template v-if="pageInfo">
				<div class="title" v-for="header in pageInfo.header" :key="header.id" :class="{ clickable: header.onClick, selected: header.selected }" @click="header.onClick">
					<Fa v-if="header.icon" :icon="header.icon" class="icon"/>
					<span>{{ header.title }}</span>
				</div>
			</template>
		</header>
		<main ref="main">
			<div class="content">
				<router-view v-slot="{ Component }">
					<transition :name="$store.state.device.animation ? 'page' : ''" mode="out-in" @enter="onTransition">
						<keep-alive :include="['index']">
							<component :is="Component" :ref="changePage"/>
						</keep-alive>
					</transition>
				</router-view>
			</div>
			<div class="powerd-by" :class="{ visible: !$store.getters.isSignedIn }">
				<b><router-link to="/">{{ host }}</router-link></b>
				<small>Powered by <a href="https://github.com/syuilo/misskey" target="_blank">Misskey</a></small>
			</div>
		</main>
	</div>

	<template v-if="isDesktop">
		<div v-for="place in ['left', 'right']" ref="widgets" class="widgets" :class="{ edit: widgetsEditMode, fixed: $store.state.device.fixedWidgetsPosition, empty: widgets[place].length === 0 && !widgetsEditMode }" :key="place">
			<div class="spacer"></div>
			<div class="container" v-if="widgetsEditMode">
				<MkButton primary @click="addWidget(place)" class="add"><Fa :icon="faPlus"/></MkButton>
				<XDraggable
					:list="widgets[place]"
					handle=".handle"
					animation="150"
					class="sortable"
					@sort="onWidgetSort"
				>
					<div v-for="widget in widgets[place]" class="customize-container _panel" :key="widget.id">
						<header>
							<span class="handle"><Fa :icon="faBars"/></span>{{ $t('_widgets.' + widget.name) }}<button class="remove _button" @click="removeWidget(widget)"><Fa :icon="faTimes"/></button>
						</header>
						<div @click="widgetFunc(widget.id)">
							<component class="_close_ _forceContainerFull_" :is="`mkw-${widget.name}`" :widget="widget" :ref="widget.id" :is-customize-mode="true"/>
						</div>
					</div>
				</XDraggable>
			</div>
			<div class="container" v-else>
				<component v-for="widget in widgets[place]" class="_close_ _forceContainerFull_" :is="`mkw-${widget.name}`" :key="widget.id" :ref="widget.id" :widget="widget"/>
			</div>
		</div>
	</template>

	<div class="buttons" :class="{ navHidden }">
		<button class="button nav _button" @click="showNav" ref="navButton"><Fa :icon="faBars"/><i v-if="navIndicated"><Fa :icon="faCircle"/></i></button>
		<button v-if="$route.name === 'index'" class="button home _button" @click="top()"><Fa :icon="faHome"/></button>
		<button v-else class="button home _button" @click="$router.push('/')"><Fa :icon="faHome"/></button>
		<button v-if="$store.getters.isSignedIn" class="button notifications _button" @click="$router.push('/my/notifications')"><Fa :icon="faBell"/><i v-if="$store.state.i.hasUnreadNotification"><Fa :icon="faCircle"/></i></button>
		<button v-if="$store.getters.isSignedIn" class="button post _buttonPrimary" @click="post()"><Fa :icon="faPencilAlt"/></button>
	</div>

	<button v-if="$store.getters.isSignedIn" class="post _buttonPrimary" :class="{ navHidden }" @click="post()"><Fa :icon="faPencilAlt"/></button>

	<StreamIndicator v-if="$store.getters.isSignedIn"/>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import { faGripVertical, faChevronLeft, faHashtag, faBroadcastTower, faFireAlt, faEllipsisH, faPencilAlt, faBars, faTimes, faSearch, faUserCog, faCog, faUser, faHome, faStar, faCircle, faAt, faListUl, faPlus, faUserClock, faUsers, faTachometerAlt, faExchangeAlt, faGlobe, faChartBar, faCloud, faServer, faInfoCircle, faQuestionCircle, faProjectDiagram } from '@fortawesome/free-solid-svg-icons';
import { faBell, faEnvelope, faLaugh, faComments } from '@fortawesome/free-regular-svg-icons';
import { v4 as uuid } from 'uuid';
import { host } from '@/config';
import { search } from '@/scripts/search';
import { StickySidebar } from '@/scripts/sticky-sidebar';
import { widgets } from '@/widgets';
import XSidebar from '@/components/sidebar.vue';
import * as os from '@/os';

const DESKTOP_THRESHOLD = 1100;

export default defineComponent({
	components: {
		XSidebar,
		XClock: defineAsyncComponent(() => import('@/components/header-clock.vue')),
		MkButton: defineAsyncComponent(() => import('@/components/ui/button.vue')),
		XDraggable: defineAsyncComponent(() => import('vue-draggable-next').then(x => x.VueDraggableNext)),
	},

	data() {
		return {
			host: host,
			pageKey: 0,
			pageInfo: null,
			searching: false,
			connection: null,
			searchQuery: '',
			searchWait: false,
			widgetsEditMode: false,
			isDesktop: window.innerWidth >= DESKTOP_THRESHOLD,
			canBack: false,
			menuDef: this.$store.getters.nav({}),
			navHidden: false,
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
			this.connection = os.stream.useSharedConnection('main');
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
		this.calcHeaderWidth();

		const ro = new ResizeObserver((entries, observer) => {
			this.calcHeaderWidth();
		});

		ro.observe(this.$refs.contents);

		window.addEventListener('resize', this.calcHeaderWidth, { passive: true });

		if (!this.isDesktop) {
			window.addEventListener('resize', () => {
				if (window.innerWidth >= DESKTOP_THRESHOLD) this.isDesktop = true;
			}, { passive: true });
		}

		// widget follow
		this.attachSticky();
	},

	methods: {
		async changePage(page) {
			if (page && page.getPageInfo) {
				this.pageInfo = await page.getPageInfo();
			}
		},

		calcHeaderWidth() {
			const width = this.$refs.contents.offsetWidth;
			this.$refs.header.style.width = `${width}px`;
		},

		showNav() {
			this.$refs.nav.show();
		},

		attachSticky() {
			if (!this.isDesktop) return;
			if (this.$store.state.device.fixedWidgetsPosition) return;

			// NOTE: Vue3の仕様かどうか知らんけど this.$refs.widgets が要素が一つしかない場合に配列ではないので配列にする
			const widgets = Array.isArray(this.$refs.widgets) ? this.$refs.widgets : [this.$refs.widgets];

			const stickyWidgetColumns = widgets.map(w => new StickySidebar(w.children[1], w.children[0], w.offsetTop));
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
			os.post();
		},

		search() {
			if (this.searching) return;

			os.dialog({
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
			if (this.$store.state.i.mutingNotificationTypes.includes(notification.type)) {
				return;
			}
			if (document.visibilityState === 'visible') {
				os.stream.send('readNotification', {
					id: notification.id
				});

				const promise = os.popup(await import('@/components/toast.vue'), {
					notification
				}, {
					done: () => {
						promise.cancel();
					}
				});
			}

			os.sound('notification');
		},

		widgetFunc(id) {
			this.$refs[id][0].setting();
		},

		onWidgetSort() {
			this.saveHome();
		},

		async addWidget(place) {
			const { canceled, result: widget } = await os.dialog({
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
	$ui-font-size: 1em; // TODO: どこかに集約したい
	$header-sub-hide-threshold: 1090px;
	$left-widgets-hide-threshold: 1600px;
	$right-widgets-hide-threshold: 1090px;

	// ほんとは単に 100vh と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
	min-height: calc(var(--vh, 1vh) * 100);
	box-sizing: border-box;

	display: flex;

	> .contents {
		width: 100%;
		min-width: 0;
		padding-top: $header-height;

		&.wallpaper {
			background: var(--wallpaperOverlay);
			backdrop-filter: blur(4px);
		}

		> .header {
			position: fixed;
			z-index: 1000;
			top: 0;
			height: $header-height;
			width: 100%;
			line-height: $header-height;
			text-align: center;
			//background-color: var(--panel);
			-webkit-backdrop-filter: blur(32px);
			backdrop-filter: blur(32px);
			background-color: var(--header);
			border-bottom: solid 1px var(--divider);

			> .back {
				position: absolute;
				z-index: 1;
				top: 0;
				left: 0;
				height: $header-height;
				width: $header-height;
			}

			> .title {
				display: inline-block;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				height: $header-height;
				padding: 0 16px;

				> .icon {
					margin-right: 8px;
				}

				&.clickable {
					cursor: pointer;

					&:hover {
						color: var(--fgHighlighted);
					}
				}

				&.selected {
					box-shadow: 0 -2px 0 0 var(--accent) inset;
					color: var(--fgHighlighted);
				}
			}
		}

		> main {
			min-width: 0;

			> .content {
				> * {
					// ほんとは単に calc(100vh - #{$header-height}) と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
					min-height: calc((var(--vh, 1vh) * 100) - #{$header-height});
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

	> .post {
		display: block;
		position: fixed;
		z-index: 1000;
		bottom: 32px;
		right: 32px;
		width: 64px;
		height: 64px;
		border-radius: 100%;
		box-shadow: 0 3px 5px -1px rgba(0, 0, 0, 0.2), 0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12);
		font-size: 22px;

		&.navHidden {
			display: none;
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

		&:not(.navHidden) {
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

<style lang="scss">
</style>>
