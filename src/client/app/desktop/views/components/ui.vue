<template>
<div class="mk-ui">
	<x-header class="header"/>
	<div class="content">
		<slot></slot>
	</div>
	<mk-stream-indicator v-if="$store.getters.isSignedIn"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XHeader from './ui.header.vue';

export default Vue.extend({
	components: {
		XHeader
	},
	mounted() {
		document.addEventListener('keydown', this.onKeydown);
	},
	beforeDestroy() {
		document.removeEventListener('keydown', this.onKeydown);
	},
	methods: {
		onKeydown(e) {
			if (e.target.tagName == 'INPUT' || e.target.tagName == 'TEXTAREA') return;

			if (e.which == 80 || e.which == 78) { // p or n
				e.preventDefault();
				(this as any).apis.post();
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-ui
	display flex
	flex-direction column
	flex 1

	> .header
		@media (max-width 1000px)
			display none

	> .content
		display flex
		flex-direction column
		flex 1
</style>
