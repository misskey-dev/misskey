<template>
<div class="mk-home">
	<mk-timeline @loaded="onTlLoaded"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	methods: {
		onTlLoaded() {
			this.$emit('loaded');
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-home

	> .mk-timeline
		max-width 600px
		margin 0 auto
		padding 8px

	@media (min-width 500px)
		padding 16px

</style>
