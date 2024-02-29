<template>
<div class="mk-app">
	<div v-if="mainRouter.currentRoute?.name === 'index'" class="banner" :style="{ backgroundImage: `url(${ $instance.bannerUrl })` }">
		<div>
			<h1 v-if="meta"><img v-if="meta.logoImageUrl" class="logo" :src="meta.logoImageUrl"><span v-else class="text">{{ instanceName }}</span></h1>
			<div v-if="meta" class="about">
				<!-- eslint-disable-next-line vue/no-v-html -->
				<div class="desc" v-html="meta.description || $ts.introMisskey"></div>
			</div>
			<div class="action">
				<button class="_button primary" @click="signup()">{{ $ts.signup }}</button>
				<button class="_button" @click="signin()">{{ $ts.login }}</button>
			</div>
		</div>
	</div>
	<div v-else class="banner-mini" :style="{ backgroundImage: `url(${ $instance.bannerUrl })` }">
		<div>
			<h1 v-if="meta"><img v-if="meta.logoImageUrl" class="logo" :src="meta.logoImageUrl"><span v-else class="text">{{ instanceName }}</span></h1>
		</div>
	</div>

	<div class="main">
		<div ref="contents" class="contents" :class="{ wallpaper }">
			<header v-show="mainRouter.currentRoute?.name !== 'index'" ref="header" class="header">
				<XHeader :info="pageInfo"/>
			</header>
			<main ref="main" style="container-type: inline-size;">
				<RouterView/>
			</main>
			<div class="powered-by">
				<b><MkA to="/">{{ host }}</MkA></b>
				<small>Powered by <a href="https://github.com/misskey-dev/misskey" target="_blank">Misskey</a></small>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XHeader from './header.vue';
import { host, instanceName } from '@/config';
import { search } from '@/scripts/search';
import * as os from '@/os';
import MkButton from '@/components/MkButton.vue';
import { ColdDeviceStorage } from '@/store';
import { mainRouter } from '@/router';

const DESKTOP_THRESHOLD = 1100;

export default defineComponent({
	components: {
		XHeader,
		MkButton,
	},

	data() {
		return {
			host,
			instanceName,
			pageInfo: null,
			meta: null,
			narrow: window.innerWidth < 1280,
			announcements: {
				endpoint: 'announcements',
				limit: 10,
			},
			mainRouter,
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
				'h|/': this.help,
			};
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
		// @ThatOneCalculator: Are these methods even used?
		// I can't find references to them anywhere else in the code...

		// setParallax(el) {
		// 	new simpleParallax(el);
		// },

		changePage(page) {
			if (page == null) return;
			// eslint-disable-next-line no-undef
			if (page[symbols.PAGE_INFO]) {
				// eslint-disable-next-line no-undef
				this.pageInfo = page[symbols.PAGE_INFO];
			}
		},

		top() {
			window.scroll({ top: 0, behavior: 'smooth' });
		},

		help() {
			window.open('https://misskey-hub.net/docs/keyboard-shortcut.md', '_blank');
		},
	},
});
</script>

<style lang="scss" scoped>
.mk-app {
	min-height: 100vh;

	> .banner {
		position: relative;
		width: 100%;
		text-align: center;
		background-position: center;
		background-size: cover;

		> div {
			height: 100%;
			background: rgba(0, 0, 0, 0.3);

			* {
				color: #fff;
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
					color: var(--fg);

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

	> .banner-mini {
		position: relative;
		width: 100%;
		text-align: center;
		background-position: center;
		background-size: cover;

		> div {
			position: relative;
			z-index: 1;
			height: 100%;
			background: rgba(0, 0, 0, 0.3);

			* {
				color: #fff !important;
			}

			> header {
				
			}
					
			> h1 {
				margin: 0;
				padding: 32px;
				text-shadow: 0 0 8px black;

				> .logo {
					vertical-align: bottom;
					max-height: 100px;
				}
			}
		}
	}

	> .main {
		> .contents {
			position: relative;
			z-index: 1;

			> .header {
				position: sticky;
				top: 0;
				left: 0;
				z-index: 1000;
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
