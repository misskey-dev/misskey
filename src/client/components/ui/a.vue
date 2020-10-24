<template>
<a :href="to" @click.prevent="nav" @contextmenu.prevent.stop="onContextmenu">
	<slot></slot>
</a>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import { faArrowRight, faColumns, faExternalLinkAlt, faLink, faWindowMaximize } from '@fortawesome/free-solid-svg-icons';
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
	},

	methods: {
		resolve() {
			const resolved = router.resolve(this.to);
			const route = resolved.matched[0];
			return {
				component: route.components.default,
				props: route.props?.default ? route.props.default(resolved) : resolved.params
			};
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
					const { component, props } = this.resolve();
					os.pageWindow(this.to, component, props);
				}
			}, this.sideViewHook ? {
				icon: faColumns,
				text: this.$t('openInSide'),
				action: () => {
					const { component, props } = this.resolve();
					this.sideViewHook(this.to, component, props);
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
				const { component, props } = this.resolve();
				this.navHook(this.to, component, props);
			} else {
				this.$router.push(this.to);
			}
		}
	}
});
</script>
