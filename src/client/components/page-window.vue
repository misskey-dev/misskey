<template>
<XWindow ref="window" :initial-width="400" :initial-height="500" :can-resize="true" @closed="$emit('closed')">
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
import { faExternalLinkAlt, faExpandAlt } from '@fortawesome/free-solid-svg-icons';
import XWindow from '@/components/ui/window.vue';
import XHeader from '@/ui/_common_/header.vue';
import { popout } from '@/scripts/popout';

export default defineComponent({
	components: {
		XWindow,
		XHeader,
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
			default: {},
		},
	},

	emits: ['closed'],

	data() {
		return {
			pageInfo: null,
			url: this.initialUrl,
			component: this.initialComponent,
			props: this.initialProps,
			faExternalLinkAlt, faExpandAlt,
		};
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
