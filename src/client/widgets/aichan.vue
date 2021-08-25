<template>
<MkContainer :naked="props.transparent" :show-header="false">
	<canvas class="dedjhjmo" ref="canvas" @click="touched"></canvas>
</MkContainer>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import define from './define';
import MkContainer from '@client/components/ui/container.vue';
import * as os from '@client/os';

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
	extends: widget,
	components: {
		MkContainer,
	},
	data() {
		return {
			live2d: null as null | Promise<any>,
		};
	},
	mounted() {
		this.$nextTick(() => {
			this.live2d = import('@client/scripts/live2d/index')
				.then(({ load }) => load(this.$refs.canvas, {
					scale: 1.6,
					y: 1.1
				}))
				.then(live2d => markRaw(live2d));
		});
	},
	methods: {
		touched() {
			if (this.live2d) this.live2d.then(live2d => live2d.changeExpression('gurugurume'));
		}
	}
});
</script>

<style lang="scss" scoped>
.dedjhjmo {
	width: 100%;
	height: 350px;
}
</style>
