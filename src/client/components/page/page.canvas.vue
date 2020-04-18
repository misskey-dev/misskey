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
		script: {
			required: true
		}
	},
	mounted() {
		this.script.aoiScript.registerCanvas(this.value.name, this.$refs.canvas);
	}
});
</script>

<style lang="scss" scoped>
.ysrxegms {
	display: inline-block;
	vertical-align: bottom;

	> canvas {
		display: block;
	}
}
</style>
