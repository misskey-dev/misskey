<template>
<div class="mk-app">
	<header>
		<router-link class="link" to="/">{{ $t('home') }}</router-link>
		<router-link class="link" to="/about">{{ $t('aboutX', { x: instanceName || host }) }}</router-link>
		<router-link class="link" to="">foo</router-link>
	</header>

	<div class="banner" :style="{ backgroundImage: `url(${ $store.state.instance.meta.bannerUrl })` }"></div>

	<div class="contents" ref="contents" :class="{ wallpaper }">
		<header class="header" ref="header">
			<XHeader v-if="pageInfo" :info="pageInfo"/>
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

	<StreamIndicator v-if="$store.getters.isSignedIn"/>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import { } from '@fortawesome/free-solid-svg-icons';
import { host, instanceName } from '@/config';
import { search } from '@/scripts/search';
import * as os from '@/os';
import XHeader from './_common_/header.vue';

const DESKTOP_THRESHOLD = 1100;

export default defineComponent({
	components: {
		XHeader
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
		async changePage(page) {
			if (page == null) return;
			if (page.info) {
				this.pageInfo = page.info;
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
	max-width: 1300px;
	margin: 0 auto;
	box-shadow: 1px 0 var(--divider), -1px 0 var(--divider);

	> header {
		background: var(--panel);
		padding: 0 8px;

		> .link {
			line-height: 54px;
			padding: 0 0.5em;
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
	}
}
</style>

<style lang="scss">
</style>
