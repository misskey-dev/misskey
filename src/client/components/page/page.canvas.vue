<template>
<div>
	<canvas ref="canvas" class="ysrxegms" :width="value.width" :height="value.height"/>
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
	display: block;
}
</style>
