<template>
<XWindow ref="window"
	:initial-width="400"
	:initial-height="500"
	:can-resize="true"
	:close-right="true"
	:contextmenu="contextmenu"
	@closed="$emit('closed')"
>
	<template #header>
		<XHeader :info="pageInfo" :with-back="false"/>
	</template>
	<template #buttons>
		<button class="_button" @click="back()" v-if="history.length > 0"><Fa :icon="faChevronLeft"/></button>
		<button class="_button" style="pointer-events: none;" v-else><!-- マージンのバランスを取るためのダミー --></button>
	</template>
	<div class="yrolvcoq" style="min-height: 100%; background: var(--bg);">
		<component :is="component" v-bind="props" :ref="changePage"/>
	</div>
</XWindow>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faExternalLinkAlt, faExpandAlt, faLink, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import XWindow from '@/components/ui/window.vue';
import XHeader from '@/ui/_common_/header.vue';
import { popout } from '@/scripts/popout';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import { resolve } from '@/router';

export default defineComponent({
	components: {
		XWindow,
		XHeader,
	},

	provide() {
		return {
			navHook: (url) => {
				this.navigate(url);
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
			history: [],
			faChevronLeft,
		};
	},

	computed: {
		contextmenu() {
			return [{
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
			}];
		},
	},

	methods: {
		changePage(page) {
			if (page == null) return;
			if (page.INFO) {
				this.pageInfo = page.INFO;
			}
		},

		navigate(url, record = true) {
			if (record) this.history.push(this.url);
			this.url = url;
			const { component, props } = resolve(url);
			this.component = component;
			this.props = props;
		},

		back() {
			this.navigate(this.history.pop(), false);
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
