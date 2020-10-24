<template>
<a :href="to" @click.prevent="nav" @contextmenu.prevent.stop="onContextmenu">
	<slot></slot>
</a>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faArrowRight, faColumns, faExternalLinkAlt, faLink, faWindowMaximize } from '@fortawesome/free-solid-svg-icons';
import * as os from '@/os';
import copyToClipboard from '@/scripts/copy-to-clipboard';

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
	},

	methods: {
		onContextmenu(e) {
			if (window.getSelection().toString() !== '') return;
			os.contextMenu([{
				type: 'label',
				text: this.to,
			}, {
				icon: faArrowRight,
				text: this.$t('showInPage'),
				action: () => {
					this.$router.push(this.to);
				}
			}, {
				icon: faWindowMaximize,
				text: this.$t('openInWindow'),
				action: () => {
					os.pageWindow(this.to);
				}
			}, this.sideViewHook ? {
				icon: faColumns,
				text: this.$t('openInSide'),
				action: () => {
					this.sideViewHook(this.to);
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
