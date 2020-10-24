<template>
<a :href="to" @click.prevent="nav" @contextmenu.prevent.stop="onContextmenu">
	<slot></slot>
</a>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import { faArrowRight, faColumns, faExternalLinkAlt, faLink, faWindowMaximize } from '@fortawesome/free-solid-svg-icons';
import * as os from '@/os';
import copyToClipboard from '../../scripts/copy-to-clipboard';

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

		// TODO: 将来的にはURLをルーティング定義と照らし合わせてpropsをURLから自動抽出するようにしたい
		props: {
			type: Object,
			required: false,
			default: {},
		},
	},

	methods: {
		getComponent() {
			// TODO: 将来的にはルーティング定義から算出するようにしたい
			if (this.to.startsWith('/@')) return import('@/pages/user/index.vue');
			if (this.to.startsWith('/notes/')) return import('@/pages/note.vue');
		},
		onContextmenu(e) {
			if (window.getSelection().toString() !== '') return;
			os.contextMenu([{
				icon: faArrowRight,
				text: this.$t('showInPage'),
				action: () => {
					this.$router.push(this.to);
				}
			}, {
				icon: faWindowMaximize,
				text: this.$t('openInWindow'),
				action: () => {
					os.pageWindow(this.to, defineAsyncComponent(() => this.getComponent()), this.props);
				}
			}, this.sideViewHook ? {
				icon: faColumns,
				text: this.$t('openInSide'),
				action: () => {
					this.sideViewHook(this.to, defineAsyncComponent(() => this.getComponent()), this.props);
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
				this.navHook(this.to, defineAsyncComponent(() => this.getComponent()), this.props);
			} else {
				this.$router.push(this.to);
			}
		}
	}
});
</script>
