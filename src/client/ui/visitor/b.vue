<template>
<div class="mk-app">
	<div class="side" v-if="!narrow && $route.path !== '/'">
		<XKanban class="kanban" full/>
	</div>

	<div class="main">
		<XKanban class="banner" :full="$route.path === '/'" v-if="narrow || $route.path === '/'"/>

		<div class="contents">
			<XHeader class="header" :info="pageInfo" v-if="$route.path !== '/'"/>
			<main>
				<router-view v-slot="{ Component }">
					<transition :name="$store.state.device.animation ? 'page' : ''" mode="out-in" @enter="onTransition">
						<component :is="Component" :ref="changePage"/>
					</transition>
				</router-view>
			</main>
			<div class="powered-by">
				<b><MkA to="/">{{ host }}</MkA></b>
				<small>Powered by <a href="https://github.com/syuilo/misskey" target="_blank">Misskey</a></small>
			</div>
		</div>
	</div>

	<transition name="tray-back">
		<div class="menu-back _modalBg"
			v-if="showMenu"
			@click="showMenu = false"
			@touchstart.passive="showMenu = false"
		></div>
	</transition>

	<transition name="tray">
		<div v-if="showMenu" class="menu">
			<MkA to="/" class="link" active-class="active"><Fa :icon="faHome" class="icon"/>{{ $t('home') }}</MkA>
			<MkA to="/explore" class="link" active-class="active"><Fa :icon="faHashtag" class="icon"/>{{ $t('explore') }}</MkA>
			<MkA to="/featured" class="link" active-class="active"><Fa :icon="faFireAlt" class="icon"/>{{ $t('featured') }}</MkA>
			<MkA to="/channels" class="link" active-class="active"><Fa :icon="faSatelliteDish" class="icon"/>{{ $t('channel') }}</MkA>
			<div class="action">
				<button class="_buttonPrimary" @click="signup()">{{ $t('signup') }}</button>
				<button class="_button" @click="signin()">{{ $t('login') }}</button>
			</div>
		</div>
	</transition>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import { } from '@fortawesome/free-solid-svg-icons';
import { host, instanceName } from '@/config';
import { search } from '@/scripts/search';
import * as os from '@/os';
import MkPagination from '@/components/ui/pagination.vue';
import XSigninDialog from '@/components/signin-dialog.vue';
import XSignupDialog from '@/components/signup-dialog.vue';
import MkButton from '@/components/ui/button.vue';
import XHeader from './header.vue';
import XKanban from './kanban.vue';

const DESKTOP_THRESHOLD = 1100;

export default defineComponent({
	components: {
		XHeader,
		XKanban,
		MkPagination,
		MkButton,
	},

	data() {
		return {
			host,
			instanceName,
			pageKey: 0,
			pageInfo: null,
			meta: null,
			showMenu: false,
			narrow: window.innerWidth < 1280,
			announcements: {
				endpoint: 'announcements',
				limit: 10,
			},
			isDesktop: window.innerWidth >= DESKTOP_THRESHOLD,
		};
	},

	computed: {
		keymap(): any {
			return {
				'd': () => {
					if (this.$store.state.device.syncDeviceDarkMode) return;
					this.$store.commit('device/set', { key: 'darkMode', value: !this.$store.state.device.darkMode });
				},
				's': search,
				'h|/': this.help
			};
		},
	},

	watch: {
		$route(to, from) {
			this.pageKey++;
		},
	},

	created() {
		document.documentElement.style.overflowY = 'scroll';

		os.api('meta', { detail: true }).then(meta => {
			this.meta = meta;
		});
	},

	mounted() {
		if (!this.isDesktop) {
			window.addEventListener('resize', () => {
				if (window.innerWidth >= DESKTOP_THRESHOLD) this.isDesktop = true;
			}, { passive: true });
		}
	},

	methods: {
		changePage(page) {
			if (page == null) return;
			if (page.INFO) {
				this.pageInfo = page.INFO;
			}
		},

		top() {
			window.scroll({ top: 0, behavior: 'smooth' });
		},

		help() {
			this.$router.push('/docs/keyboard-shortcut');
		},

		onTransition() {
			if (window._scroll) window._scroll();
		},

		signin() {
			os.popup(XSigninDialog, {
				autoSet: true
			}, {}, 'closed');
		},

		signup() {
			os.popup(XSignupDialog, {
				autoSet: true
			}, {}, 'closed');
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
	transform: translateX(-240px);
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

.mk-app {
	display: flex;
	min-height: 100vh;

	> .side {
		width: 500px;
		height: 100vh;

		> .kanban {
			position: fixed;
			top: 0;
			left: 0;
			width: 500px;
			height: 100vh;
			overflow: auto;
		}
	}

	> .main {
		flex: 1;

		> .banner {
		}

		> .contents {
			position: relative;
			z-index: 1;

			> .powered-by {
				padding: 28px;
				font-size: 14px;
				text-align: center;
				border-top: 1px solid var(--divider);

				> small {
					display: block;
					margin-top: 8px;
					opacity: 0.5;
				}
			}
		}
	}

	> .menu-back {
		position: fixed;
		z-index: 1001;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
	}

	> .menu {
		position: fixed;
		z-index: 1001;
		top: 0;
		left: 0;
		width: 240px;
		height: 100vh;
		background: var(--panel);

		> .link {
			display: block;
			padding: 16px;

			> .icon {
				margin-right: 1em;
			}
		}

		> .action {
			padding: 16px;

			> button {
				display: block;
				width: 100%;
				padding: 10px;
				box-sizing: border-box;
				text-align: center;
				border-radius: 999px;

				&._button {
					background: var(--panel);
				}

				&:first-child {
					margin-bottom: 16px;
				}
			}
		}
	}
}
</style>
