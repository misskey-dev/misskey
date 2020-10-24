<template>
<XWindow ref="window"
	:initial-width="400"
	:initial-height="500"
	:can-resize="true"
	:contextmenu="contextmenu"
	@closed="$emit('closed')"
>
	<template #header>
		<XHeader :info="pageInfo" :with-back="false"/>
	</template>
	<template #buttons>
		<button class="_button" @click="expand" v-tooltip="$t('showInPage')"><Fa :icon="faExpandAlt"/></button>
		<button class="_button" @click="popout" v-tooltip="$t('popout')"><Fa :icon="faExternalLinkAlt"/></button>
	</template>
	<div class="yrolvcoq" style="min-height: 100%; background: var(--bg);">
		<component :is="component" v-bind="props" :ref="changePage"/>
	</div>
</XWindow>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import { faExternalLinkAlt, faExpandAlt, faLink } from '@fortawesome/free-solid-svg-icons';
import XWindow from '@/components/ui/window.vue';
import XHeader from '@/ui/_common_/header.vue';
import { popout } from '@/scripts/popout';
import copyToClipboard from '@/scripts/copy-to-clipboard';

export default defineComponent({
	components: {
		XWindow,
		XHeader,
	},

	provide() {
		return {
			navHook: (url, component, props) => {
				this.url = url;
				this.component = markRaw(component);
				this.props = props;
			}
		};
	},

	props: {
		initialUrl: {
			type: String,
			required: true,
		},
		initialComponent: {
			type: Object,
			required: true,
		},
		initialProps: {
			type: Object,
			required: false,
			default: () => {},
		},
	},

	emits: ['closed'],

	data() {
		return {
			pageInfo: null,
			url: this.initialUrl,
			component: this.initialComponent,
			props: this.initialProps,
			contextmenu: [{
				type: 'label',
				text: this.url,
			}, {
				icon: faExpandAlt,
				text: this.$t('showInPage'),
				action: this.expand
			}, {
				icon: faExternalLinkAlt,
				text: this.$t('popout'),
				action: this.popout
			}, null, {
				icon: faExternalLinkAlt,
				text: this.$t('openInNewTab'),
				action: () => {
					window.open(this.url, '_blank');
					this.$refs.window.close();
				}
			}, {
				icon: faLink,
				text: this.$t('copyLink'),
				action: () => {
					copyToClipboard(this.url);
				}
			}],
			faExternalLinkAlt, faExpandAlt,
		};
	},

	methods: {
		changePage(page) {
			if (page == null) return;
			if (page.INFO) {
				this.pageInfo = page.INFO;
			}
		},

		expand() {
			this.$router.push(this.url);
			this.$refs.window.close();
		},

		popout() {
			popout(this.url, this.$el);
			this.$refs.window.close();
		},
	},
});
</script>

<style lang="scss" scoped>
.yrolvcoq {
	--section-padding: 16px;
}
</style>
