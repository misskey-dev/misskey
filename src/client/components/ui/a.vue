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
			}, !this.navHook && this.sideViewHook ? {
				icon: faColumns,
				text: this.$t('openInSide'),
				action: () => {
					this.sideViewHook(this.to);
				}
			} : undefined, this.navHook ? {
				icon: faExpandAlt,
				text: this.$t('showInPage'),
				action: () => {
					this.$router.push(this.to);
				}
			} : undefined, null, {
				icon: faExternalLinkAlt,
				text: this.$t('openInNewTab'),
				action: () => {
					window.open(this.to, '_blank');
				}
			}, {
				icon: faLink,
				text: this.$t('copyLink'),
				action: () => {
					copyToClipboard(this.to);
				}
			}], e);
		},

		nav() {
			if (this.navHook) {
				this.navHook(this.to);
			} else {
				this.$router.push(this.to);
			}
		}
	}
});
</script>
