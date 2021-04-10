<template>
<div class="mk-app">
	<div class="contents">
		<header class="header">
			<XHeader :info="pageInfo"/>
		</header>
		<main ref="main">
			<div class="content">
				<router-view v-slot="{ Component }">
					<transition :name="$store.state.animation ? 'page' : ''" mode="out-in" @enter="onTransition">
						<keep-alive :include="['timeline']">
							<component :is="Component" :ref="changePage"/>
						</keep-alive>
					</transition>
				</router-view>
			</div>
		</main>
	</div>

	<XCommon/>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import { faLayerGroup, faBars, faHome, faCircle } from '@fortawesome/free-solid-svg-icons';
import { faBell } from '@fortawesome/free-regular-svg-icons';
import { host } from '@client/config';
import XHeader from './_common_/header.vue';
import XCommon from './_common_/common.vue';

export default defineComponent({
	components: {
		XCommon,
		XHeader,
	},

	data() {
		return {
			host: host,
			pageInfo: null,
			faLayerGroup, faBars, faBell, faHome, faCircle,
		};
	},

	created() {
		document.documentElement.style.overflowY = 'scroll';
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
	$header-height: 52px;
	$ui-font-size: 1em; // TODO: どこかに集約したい

	// ほんとは単に 100vh と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
	min-height: calc(var(--vh, 1vh) * 100);
	box-sizing: border-box;

	> .contents {
		padding-top: $header-height;

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
			border-bottom: solid 0.5px var(--divider);
		}

		> main {
			> .content {
				> * {
					// ほんとは単に calc(100vh - #{$header-height}) と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
					min-height: calc((var(--vh, 1vh) * 100) - #{$header-height});
				}
			}
		}
	}
}
</style>
