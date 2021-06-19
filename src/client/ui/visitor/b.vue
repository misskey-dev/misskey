<template>
<div class="mk-app">
	<a v-if="root" href="https://github.com/shyamean4151/misskey-neko" target="_blank" class="github-corner" aria-label="View source on GitHub"><svg width="80" height="80" viewBox="0 0 250 250" style="fill:var(--panel); color:var(--fg); position: fixed; z-index: 10; top: 0; border: 0; right: 0;" aria-hidden="true"><path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path><path d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2" fill="currentColor" style="transform-origin: 130px 106px;" class="octo-arm"></path><path d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z" fill="currentColor" class="octo-body"></path></svg></a>

	<div class="side" v-if="!narrow && !root">
		<XKanban class="kanban" full/>
	</div>

	<div class="main">
		<XKanban class="banner" :powered-by="root" v-if="narrow && !root"/>

		<div class="contents">
			<XHeader class="header" :info="pageInfo" v-if="!root"/>
			<main>
				<router-view v-slot="{ Component }">
					<transition :name="$store.state.animation ? 'page' : ''" mode="out-in" @enter="onTransition">
						<component :is="Component" :ref="changePage"/>
					</transition>
				</router-view>
			</main>
			<div class="powered-by" v-if="!root">
				<b><MkA to="/">Instance:{{ host }}</MkA></b>
				<small>Powered by <a href="https://github.com/shyamean4151/misskey-neko" target="_blank">Misskey-Neko</a></small>
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
			<MkA to="/" class="link" active-class="active"><i class="fas fa-home icon"></i>{{ $ts.home }}</MkA>
			<MkA to="/explore" class="link" active-class="active"><i class="fas fa-hashtag icon"></i>{{ $ts.explore }}</MkA>
			<MkA to="/featured" class="link" active-class="active"><i class="fas fa-fire-alt icon"></i>{{ $ts.featured }}</MkA>
			<MkA to="/channels" class="link" active-class="active"><i class="fas fa-satellite-dish icon"></i>{{ $ts.channel }}</MkA>
			<div class="action">
				<button class="_buttonPrimary" @click="signup()">{{ $ts.signup }}</button>
				<button class="_button" @click="signin()">{{ $ts.login }}</button>
			</div>
		</div>
	</transition>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import { host, instanceName } from '@client/config';
import { search } from '@client/scripts/search';
import * as os from '@client/os';
import MkPagination from '@client/components/ui/pagination.vue';
import XSigninDialog from '@client/components/signin-dialog.vue';
import XSignupDialog from '@client/components/signup-dialog.vue';
import MkButton from '@client/components/ui/button.vue';
import XHeader from './header.vue';
import XKanban from './kanban.vue';
import { ColdDeviceStorage } from '@client/store';
import * as symbols from '@client/symbols';

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
					if (ColdDeviceStorage.get('syncDeviceDarkMode')) return;
					this.$store.set('darkMode', !this.$store.state.darkMode);
				},
				's': search,
				'h|/': this.help
			};
		},

		root(): boolean {
			return this.$route.path === '/';
		},
	},

	created() {
		//document.documentElement.style.overflowY = 'scroll';

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
			if (page[symbols.PAGE_INFO]) {
				this.pageInfo = page[symbols.PAGE_INFO];
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

<style>
.github-corner:hover .octo-arm{animation:octocat-wave 560ms ease-in-out}@keyframes octocat-wave{0%,100%{transform:rotate(0)}20%,60%{transform:rotate(-25deg)}40%,80%{transform:rotate(10deg)}}@media (max-width:500px){.github-corner:hover .octo-arm{animation:none}.github-corner .octo-arm{animation:octocat-wave 560ms ease-in-out}}
</style>

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
	background-position: center;
	background-size: cover;
	background-attachment: fixed;

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
		min-width: 0;

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
