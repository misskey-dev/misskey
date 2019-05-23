<template>
<div class="mrdgzndn">
	<mfm :text="text" :is-note="false" :i="$store.state.i" :key="text"/>
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
.mrdgzndn
	&:not(:first-child)
		margin-top 0.5em

	&:not(:last-child)
		margin-bottom 0.5em
</style>
