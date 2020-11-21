<template>
<div class="mk-app">
	<div class="banner" v-if="$route.path === '/'" :style="{ backgroundImage: `url(${ $store.state.instance.meta.bannerUrl })` }">
		<div>
			<h1 v-if="meta"><img class="logo" v-if="meta.logoImageUrl" :src="meta.logoImageUrl"><span v-else class="text">{{ instanceName }}</span></h1>
			<div class="about" v-if="meta">
				<div class="desc" v-html="meta.description || $t('introMisskey')"></div>
			</div>
			<div class="action">
				<button class="_button primary" @click="signup()">{{ $t('signup') }}</button>
				<button class="_button" @click="signin()">{{ $t('login') }}</button>
			</div>
		</div>
	</div>

	<div class="main">
		<header>
			<MkA class="link" to="/">{{ $t('home') }}</MkA>
			<MkA class="link" to="/announcements">{{ $t('announcements') }}</MkA>
			<MkA class="link" to="/channels">{{ $t('channel') }}</MkA>
			<MkA class="link" to="/about">{{ $t('aboutX', { x: instanceName }) }}</MkA>
		</header>

		<div v-if="narrow" class="banner" :class="{ asBg: $route.path === '/' }" :style="{ backgroundImage: `url(${ $store.state.instance.meta.bannerUrl })` }">
			<h1 v-if="$route.path !== '/'">{{ instanceName }}</h1>
		</div>

		<div class="contents" ref="contents" :class="{ wallpaper }">
			<header class="header" ref="header" v-show="$route.path !== '/'">
				<XHeader :info="pageInfo"/>
			</header>
			<main ref="main">
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
import XHeader from '../_common_/header.vue';

const DESKTOP_THRESHOLD = 1100;

export default defineComponent({
	components: {
		XHeader,
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
.mk-app {
	min-height: 100vh;

	> .banner {
		width: 100%;
		text-align: center;
		background-position: center;
		background-size: cover;

		> div {
			height: 100%;
			background: rgba(0, 0, 0, 0.3);

			* {
				color: #fff !important;
			}
					
			> h1 {
				margin: 0;
				padding: 96px 32px 0 32px;
				text-shadow: 0 0 8px black;

				> .logo {
					vertical-align: bottom;
					max-height: 150px;
				}
			}

			> .about {
				padding: 32px;
				max-width: 580px;
				margin: 0 auto;
				box-sizing: border-box;
				text-shadow: 0 0 8px black;
			}

			> .action {
				padding-bottom: 64px;
				
				> button {
					display: inline-block;
					padding: 10px 20px;
					box-sizing: border-box;
					text-align: center;
					border-radius: 999px;
					background: var(--panel);

					&.primary {
						background: var(--accent);
						color: #fff;
					}

					&:first-child {
						margin-right: 16px;
					}
				}
			}
		}
	}

	> .main {
		> header {
			position: relative;
			z-index: 1;
			background: var(--panel);
			padding: 0 32px;
			text-align: left;
			overflow: auto;
			white-space: nowrap;

			> .link {
				display: inline-block;
				line-height: 60px;
				padding: 0 0.7em;

				&.MkA-active {
					box-shadow: 0 -2px 0 0 var(--accent) inset;
				}
			}
		}

		> .banner {
			position: relative;
			width: 100%;
			height: 200px;
			background-size: cover;
			background-position: center;

			&.asBg {
				position: absolute;
				left: 0;
				height: 320px;
			}

			&:after {
				content: "";
				display: block;
				position: absolute;
				bottom: 0;
				left: 0;
				width: 100%;
				height: 64px;
				background: linear-gradient(transparent, var(--bg));
			}

			> h1 {
				margin: 0;
				text-align: center;
				color: #fff;
				text-shadow: 0 0 8px #000;
				line-height: 200px;
			}
		}

		> .contents {
			position: relative;
			z-index: 1;

			> .header {
				position: sticky;
				top: 0;
				left: 0;
				z-index: 1000;
				height: 60px;
				width: 100%;
				line-height: 60px;
				text-align: center;
				-webkit-backdrop-filter: blur(32px);
				backdrop-filter: blur(32px);
				background-color: var(--header);
				border-bottom: 1px solid var(--divider);
			}

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
}
</style>

<style lang="scss">
</style>
