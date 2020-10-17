<template>
<div class="ysrxegms">
	<canvas ref="canvas" :width="value.width" :height="value.height"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as os from '@/os';

export default defineComponent({
	props: {
		value: {
			required: true
		},
		hpml: {
			required: true
		}
	},
	mounted() {
		this.hpml.registerCanvas(this.value.name, this.$refs.canvas);
	}
});
</script>

<style lang="scss" scoped>
.ysrxegms {
	display: inline-block;
	vertical-align: bottom;
	overflow: auto;
	max-width: 100%;

	> canvas {
		display: block;
	}
}
</style>
