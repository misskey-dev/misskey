<template>
<div class="mk-app">
	<header>
		<MkA class="link" to="/">{{ $t('home') }}</MkA>
		<MkA class="link" to="/announcements">{{ $t('announcements') }}</MkA>
		<MkA class="link" to="/channels">{{ $t('channel') }}</MkA>
		<MkA class="link" to="/about">{{ $t('aboutX', { x: instanceName }) }}</MkA>
	</header>

	<div class="banner" :style="{ backgroundImage: `url(${ $store.state.instance.meta.bannerUrl })` }">
		<h1>{{ instanceName }}</h1>
	</div>

	<div class="contents" ref="contents" :class="{ wallpaper }">
		<header class="header" ref="header">
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

	<XCommon/>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import { } from '@fortawesome/free-solid-svg-icons';
import { host, instanceName } from '@/config';
import { search } from '@/scripts/search';
import * as os from '@/os';
import XHeader from './_common_/header.vue';
import XCommon from './_common_/common.vue';

const DESKTOP_THRESHOLD = 1100;

export default defineComponent({
	components: {
		XCommon,
		XHeader,
	},

	data() {
		return {
			host,
			instanceName,
			pageKey: 0,
			pageInfo: null,
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
	}
});
</script>

<style lang="scss" scoped>
.mk-app {
	min-height: 100vh;

	> header {
		background: var(--panel);
		padding: 0 16px;
		text-align: center;
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
</style>

<style lang="scss">
</style>
