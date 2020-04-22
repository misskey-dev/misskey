<template>
<div class="ysrxegms">
	<canvas ref="canvas" :width="value.width" :height="value.height"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
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
