<template>
<ui-textarea class="" :value="text" readonly></ui-textarea>
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

	data() {
		return {
			text: this.script.interpolate(this.value.text),
		};
	},

	created() {
		this.$watch('script.vars', () => {
			this.text = this.script.interpolate(this.value.text);
		}, { deep: true });
	}
});
</script>

<style lang="stylus" scoped>
</style>
