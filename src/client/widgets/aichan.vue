<template>
<MkContainer :naked="props.transparent" :show-header="false">
	<canvas class="dedjhjmo" ref="canvas"></canvas>
</MkContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import define from './define';
import MkContainer from '@client/components/ui/container.vue';
import * as os from '@client/os';
import { load as loadLive2d } from '@client/scripts/live2d/index';

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
	mounted() {
		this.$nextTick(() => {
			loadLive2d(this.$refs.canvas, {
				scale: 1.6,
				y: 1.1
			});
		});
	}
});
</script>

<style lang="scss" scoped>
.dedjhjmo {
	width: 100%;
	height: 350px;
}
</style>
