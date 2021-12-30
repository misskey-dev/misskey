<template>
<MkContainer :naked="props.transparent" :show-header="false">
	<iframe ref="live2d" class="dedjhjmo" src="https://misskey-dev.github.io/mascot-web/?scale=1.5&y=1.1&eyeY=100" @click="touched"></iframe>
</MkContainer>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import define from './define';
import MkContainer from '@/components/ui/container.vue';
import * as os from '@/os';

const widget = define({
	name: 'ai',
	props: () => ({
		transparent: {
			type: 'boolean',
			default: false,
		},
	})
});

export default defineComponent({
	components: {
		MkContainer,
	},
	extends: widget,
	data() {
		return {
		};
	},
	mounted() {
		window.addEventListener('mousemove', ev => {
			const iframeRect = this.$refs.live2d.getBoundingClientRect();
			this.$refs.live2d.contentWindow.postMessage({
				type: 'moveCursor',
				body: {
					x: ev.clientX - iframeRect.left,
					y: ev.clientY - iframeRect.top,
				}
			}, '*');
		}, { passive: true });
	},
	methods: {
		touched() {
			//if (this.live2d) this.live2d.changeExpression('gurugurume');
		}
	}
});
</script>

<style lang="scss" scoped>
.dedjhjmo {
	width: 100%;
	height: 350px;
	border: none;
	pointer-events: none;
}
</style>
