<template>
<div class="mk-app" v-hotkey.global="keymap">
	<div class="contents">
		<header class="header">
			<XHeader :info="pageInfo"/>
		</header>
		<main ref="main">
			<div class="content">
				<router-view v-slot="{ Component }">
					<transition :name="$store.state.device.animation ? 'page' : ''" mode="out-in" @enter="onTransition">
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
import { host } from '@/config';
import { search } from '@/scripts/search';
import XHeader from './_common_/header.vue';
import XCommon from './_common_/common.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		XCommon,
		XHeader,
	},

	data() {
		return {
			host: host,
			pageKey: 0,
			pageInfo: null,
			connection: null,
			faLayerGroup, faBars, faBell, faHome, faCircle,
		};
	},

	computed: {
		keymap(): any {
			return {
				'd': () => {
					if (this.$store.state.device.syncDeviceDarkMode) return;
					this.$store.commit('device/set', { key: 'darkMode', value: !this.$store.state.device.darkMode });
				},
				'p': os.post,
				'n': os.post,
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

		this.connection = os.stream.useSharedConnection('main', 'UI');
		this.connection.on('notification', this.onNotification);
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

		async onNotification(notification) {
			if (this.$store.state.i.mutingNotificationTypes.includes(notification.type)) {
				return;
			}
			if (document.visibilityState === 'visible') {
				os.stream.send('readNotification', {
					id: notification.id
				});

				os.popup(await import('@/components/toast.vue'), {
					notification
				}, {}, 'closed');
			}

			os.sound('notification');
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
			border-bottom: solid 1px var(--divider);
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
