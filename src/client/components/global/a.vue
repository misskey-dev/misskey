<template>
<a :href="to" :class="active ? activeClass : null" @click.prevent="nav" @contextmenu.prevent.stop="onContextmenu">
	<slot></slot>
</a>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faExpandAlt, faColumns, faExternalLinkAlt, faLink, faWindowMaximize } from '@fortawesome/free-solid-svg-icons';
import * as os from '@/os';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import { router } from '@/router';
import { ui, url } from '@/config';
import { popout } from '@/scripts/popout';
import { ColdDeviceStorage } from '@/storage';

export default defineComponent({
	inject: {
		navHook: {
			default: null
		},
		sideViewHook: {
			default: null
		}
	},

	props: {
		to: {
			type: String,
			required: true,
		},
		activeClass: {
			type: String,
			required: false,
		},
		behavior: {
			type: String,
			required: false,
		},
	},

	computed: {
		active() {
			if (this.activeClass == null) return false;
			const resolved = router.resolve(this.to);
			if (resolved.path == this.$route.path) return true;
			if (resolved.name == null) return false;
			if (this.$route.name == null) return false;
			return resolved.name == this.$route.name;
		}
	},

	methods: {
		onContextmenu(e) {
			if (window.getSelection().toString() !== '') return;
			os.contextMenu([{
				type: 'label',
				text: this.to,
			}, {
				icon: faWindowMaximize,
				text: this.$t('openInWindow'),
				action: () => {
					os.pageWindow(this.to);
				}
			}, this.sideViewHook ? {
				icon: faColumns,
				text: this.$t('openInSideView'),
				action: () => {
					this.sideViewHook(this.to);
				}
			} : undefined, {
				icon: faExpandAlt,
				text: this.$t('showInPage'),
				action: () => {
					this.$router.push(this.to);
				}
			}, null, {
				icon: faExternalLinkAlt,
				text: this.$t('openInNewTab'),
				action: () => {
					window.open(this.to, '_blank');
				}
			}, {
				icon: faLink,
				text: this.$t('copyLink'),
				action: () => {
					copyToClipboard(`${url}${this.to}`);
				}
			}], e);
		},

		window() {
			os.pageWindow(this.to);
		},

		popout() {
			popout(this.to);
		},

		nav() {
			if (this.to.startsWith('/my/messaging')) {
				if (ColdDeviceStorage.get('chatOpenBehavior') === 'window') return this.window();
				if (ColdDeviceStorage.get('chatOpenBehavior') === 'popout') return this.popout();
			}

			if (this.behavior) {
				if (this.behavior === 'window') {
					return this.window();
				}
			}

			if (this.navHook) {
				this.navHook(this.to);
			} else {
				if (this.$pizzax.state.defaultSideView && this.sideViewHook && this.to !== '/') {
					return this.sideViewHook(this.to);
				}
				// TODO: a.vueからdeck-sotreを参照したくないのでなんとかする
				//if (deckStore.state.device.deckNavWindow && (ui === 'deck') && this.to !== '/') {
				//	return this.window();
				//}
				if (ui === 'desktop') {
					return this.window();
				}

				if (this.$router.currentRoute.value.path === this.to) {
					window.scroll({ top: 0, behavior: 'smooth' });
				} else {
					this.$router.push(this.to);
				}
			}
		}
	}
});
</script>
