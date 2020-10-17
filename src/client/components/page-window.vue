<template>
<XWindow ref="window" :initial-width="400" :initial-height="450" :can-resize="true" @closed="$emit('closed')">
	<template #header>
		tesst
	</template>
	<template #buttons>
		<button class="_button" @click="expand"><Fa :icon="faExpandAlt"/></button>
		<button class="_button" @click="popout"><Fa :icon="faExternalLinkAlt"/></button>
	</template>
	<div style="min-height: 100%; background: var(--bg);">
		<component :is="component" v-bind="props"/>
	</div>
</XWindow>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import { faExternalLinkAlt, faExpandAlt } from '@fortawesome/free-solid-svg-icons';
import XWindow from '@/components/ui/window.vue';
import * as config from '@/config';

export default defineComponent({
	components: {
		XWindow,
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
		expand() {
			this.$router.push(this.url);
			this.$refs.window.close();
		},

		popout() {
			let url = this.url.startsWith('http://') || this.url.startsWith('https://') ? this.url : config.url + this.url;
			url += '?zen'; // TODO: ちゃんとURLパースしてクエリ付ける
			const main = this.$el as any;
			if (main) {
				const position = main.getBoundingClientRect();
				const width = parseInt(getComputedStyle(main, '').width, 10);
				const height = parseInt(getComputedStyle(main, '').height, 10);
				const x = window.screenX + position.left;
				const y = window.screenY + position.top;
				window.open(url, url,
					`width=${width}, height=${height}, top=${y}, left=${x}`);
				this.$refs.window.close();
			} else {
				const x = window.top.outerHeight / 2 + window.top.screenY - (parseInt(this.height, 10) / 2);
				const y = window.top.outerWidth / 2 + window.top.screenX - (parseInt(this.width, 10) / 2);
				window.open(url, url,
					`width=${this.width}, height=${this.height}, top=${x}, left=${y}`);
			}
		},
	},
});
</script>
