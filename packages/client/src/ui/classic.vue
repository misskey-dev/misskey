<template>
<div class="gbhvwtnk" :class="{ wallpaper }" :style="`--globalHeaderHeight:${globalHeaderHeight}px`">
	<XHeaderMenu v-if="showMenuOnTop" v-get-size="(w, h) => globalHeaderHeight = h"/>

	<div class="columns" :class="{ fullView, withGlobalHeader: showMenuOnTop }">
		<div v-if="!showMenuOnTop" class="sidebar">
			<XSidebar/>
		</div>
		<div v-else ref="widgetsLeft" class="widgets left">
			<XWidgets :place="'left'" @mounted="attachSticky('widgetsLeft')"/>
		</div>

		<main class="main" :style="{ background: pageInfo?.bg }" @contextmenu.stop="onContextmenu">
			<div class="content">
				<MkStickyContainer>
					<template #header><MkHeader v-if="pageInfo && !pageInfo.hideHeader" :info="pageInfo"/></template>
					<router-view v-slot="{ Component }">
						<transition :name="$store.state.animation ? 'page' : ''" mode="out-in" @enter="onTransition">
							<keep-alive :include="['timeline']">
								<component :is="Component" :ref="changePage"/>
							</keep-alive>
						</transition>
					</router-view>
				</MkStickyContainer>
			</div>
		</main>

		<div v-if="isDesktop" ref="widgetsRight" class="widgets right">
			<XWidgets :place="null" @mounted="attachSticky('widgetsRight')"/>
		</div>
	</div>

	<transition name="tray-back">
		<div v-if="widgetsShowing"
			class="tray-back _modalBg"
			@click="widgetsShowing = false"
			@touchstart.passive="widgetsShowing = false"
		></div>
	</transition>

	<transition name="tray">
		<XWidgets v-if="widgetsShowing" class="tray"/>
	</transition>

	<iframe v-if="$store.state.aiChanMode" ref="live2d" class="ivnzpscs" src="https://misskey-dev.github.io/mascot-web/?scale=2&y=1.4"></iframe>

	<XCommon/>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent, markRaw } from 'vue';
import { instanceName } from '@/config';
import { StickySidebar } from '@/scripts/sticky-sidebar';
import XSidebar from './classic.sidebar.vue';
import XCommon from './_common_/common.vue';
import * as os from '@/os';
import { menuDef } from '@/menu';
import * as symbols from '@/symbols';

const DESKTOP_THRESHOLD = 1100;

export default defineComponent({
	components: {
		XCommon,
		XSidebar,
		XHeaderMenu: defineAsyncComponent(() => import('./classic.header.vue')),
		XWidgets: defineAsyncComponent(() => import('./classic.widgets.vue')),
	},

	provide() {
		return {
			shouldHeaderThin: this.showMenuOnTop,
			shouldSpacerMin: true,
		};
	},

	data() {
		return {
			pageInfo: null,
			menuDef: menuDef,
			globalHeaderHeight: 0,
			isDesktop: window.innerWidth >= DESKTOP_THRESHOLD,
			widgetsShowing: false,
			fullView: false,
			wallpaper: localStorage.getItem('wallpaper') != null,
		};
	},

	computed: {
		showMenuOnTop(): boolean {
			return this.$store.state.menuDisplay === 'top';
		}
	},

	created() {
		if (window.innerWidth < 1024) {
			localStorage.setItem('ui', 'default');
			location.reload();
		}

		document.documentElement.style.overflowY = 'scroll';

		if (this.$store.state.widgets.length === 0) {
			this.$store.set('widgets', [{
				name: 'calendar',
				id: 'a', place: null, data: {}
			}, {
				name: 'notifications',
				id: 'b', place: null, data: {}
			}, {
				name: 'trends',
				id: 'c', place: null, data: {}
			}]);
		}
	},

	mounted() {
		window.addEventListener('resize', () => {
			this.isDesktop = (window.innerWidth >= DESKTOP_THRESHOLD);
		}, { passive: true });

		if (this.$store.state.aiChanMode) {
			const iframeRect = this.$refs.live2d.getBoundingClientRect();
			window.addEventListener('mousemove', ev => {
				this.$refs.live2d.contentWindow.postMessage({
					type: 'moveCursor',
					body: {
						x: ev.clientX - iframeRect.left,
						y: ev.clientY - iframeRect.top,
					}
				}, '*');
			}, { passive: true });
			window.addEventListener('touchmove', ev => {
				this.$refs.live2d.contentWindow.postMessage({
					type: 'moveCursor',
					body: {
						x: ev.touches[0].clientX - iframeRect.left,
						y: ev.touches[0].clientY - iframeRect.top,
					}
				}, '*');
			}, { passive: true });
		}
	},

	methods: {
		changePage(page) {
			if (page == null) return;
			if (page[symbols.PAGE_INFO]) {
				this.pageInfo = page[symbols.PAGE_INFO];
				document.title = `${this.pageInfo.title} | ${instanceName}`;
			}
		},

		attachSticky(ref) {
			const sticky = new StickySidebar(this.$refs[ref], this.$store.state.menuDisplay === 'top' ? 0 : 16, this.$store.state.menuDisplay === 'top' ? 60 : 0); // TODO: ヘッダーの高さを60pxと決め打ちしているのを直す
			window.addEventListener('scroll', () => {
				sticky.calc(window.scrollY);
			}, { passive: true });
		},

		top() {
			window.scroll({ top: 0, behavior: 'smooth' });
		},

		onTransition() {
			if (window._scroll) window._scroll();
		},

		onContextmenu(e) {
			const isLink = (el: HTMLElement) => {
				if (el.tagName === 'A') return true;
				if (el.parentElement) {
					return isLink(el.parentElement);
				}
			};
			if (isLink(e.target)) return;
			if (['INPUT', 'TEXTAREA', 'IMG', 'VIDEO', 'CANVAS'].includes(e.target.tagName) || e.target.attributes['contenteditable']) return;
			if (window.getSelection().toString() !== '') return;
			const path = this.$route.path;
			os.contextMenu([{
				type: 'label',
				text: path,
			}, {
				icon: this.fullView ? 'fas fa-compress' : 'fas fa-expand',
				text: this.fullView ? this.$ts.quitFullView : this.$ts.fullView,
				action: () => {
					this.fullView = !this.fullView;
				}
			}, {
				icon: 'fas fa-window-maximize',
				text: this.$ts.openInWindow,
				action: () => {
					os.pageWindow(path);
				}
			}], e);
		},

		onAiClick(ev) {
			//if (this.live2d) this.live2d.click(ev);
		}
	}
});
</script>

<style lang="scss" scoped>
.tray-enter-active,
.tray-leave-active {
	opacity: 1;
	transform: translateX(0);
	transition: transform 300ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.tray-enter-from,
.tray-leave-active {
	opacity: 0;
	transform: translateX(240px);
}

.tray-back-enter-active,
.tray-back-leave-active {
	opacity: 1;
	transition: opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.tray-back-enter-from,
.tray-back-leave-active {
	opacity: 0;
}

.gbhvwtnk {
	$ui-font-size: 1em;
	$widgets-hide-threshold: 1200px;

	// ほんとは単に 100vh と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
	min-height: calc(var(--vh, 1vh) * 100);
	box-sizing: border-box;

	&.wallpaper {
		background: var(--wallpaperOverlay);
		//backdrop-filter: var(--blur, blur(4px));
	}

	> .columns {
		display: flex;
		justify-content: center;
		max-width: 100%;
		//margin: 32px 0;

		&.fullView {
			margin: 0;
		
			> .sidebar {
				display: none;
			}

			> .widgets {
				display: none;
			}

			> .main {
				margin: 0;
				border-radius: 0;
				box-shadow: none;
				width: 100%;
			}
		}

		> .main {
			min-width: 0;
			width: 750px;
			margin: 0 16px 0 0;
			background: var(--panel);
			border-left: solid 1px var(--divider);
			border-right: solid 1px var(--divider);
			border-radius: 0;
			overflow: clip;
			--margin: 12px;
		}

		> .widgets {
			//--panelBorder: none;
			width: 300px;
			margin-top: 16px;

			@media (max-width: $widgets-hide-threshold) {
				display: none;
			}

			&.left {
				margin-right: 16px;
			}
		}

		> .sidebar {
			margin-top: 16px;
		}

		&.withGlobalHeader {
			> .main {
				margin-top: 0;
				border: solid 1px var(--divider);
				border-radius: var(--radius);
				--stickyTop: var(--globalHeaderHeight);
			}

			> .widgets {
				--stickyTop: var(--globalHeaderHeight);
				margin-top: 0;
			}
		}

		@media (max-width: 850px) {
			margin: 0;

			> .sidebar {
				border-right: solid 0.5px var(--divider);
			}

			> .main {
				margin: 0;
				border-radius: 0;
				box-shadow: none;
				width: 100%;
			}
		}
	}

	> .tray-back {
		z-index: 1001;
	}

	> .tray {
		position: fixed;
		top: 0;
		right: 0;
		z-index: 1001;
		// ほんとは単に 100vh と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
		height: calc(var(--vh, 1vh) * 100);
		padding: var(--margin);
		box-sizing: border-box;
		overflow: auto;
		background: var(--bg);
	}

	> .ivnzpscs {
		position: fixed;
		bottom: 0;
		right: 0;
		width: 300px;
		height: 600px;
		border: none;
		pointer-events: none;
	}
}
</style>
