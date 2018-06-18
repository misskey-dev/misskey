<template>
<div class="mk-ui" :style="style">
	<x-header class="header" v-show="!zenMode"/>
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
	data() {
		return {
			zenMode: false
		};
	},
	computed: {
		style(): any {
			if (!this.$store.getters.isSignedIn || this.$store.state.i.wallpaperUrl == null) return {};
			return {
				backgroundColor: this.$store.state.i.wallpaperColor && this.$store.state.i.wallpaperColor.length == 3 ? `rgb(${ this.$store.state.i.wallpaperColor.join(',') })` : null,
				backgroundImage: `url(${ this.$store.state.i.wallpaperUrl })`
			};
		}
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

			if (e.which == 90) { // z
				e.preventDefault();
				this.zenMode = !this.zenMode;
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
	background-size cover
	background-position center
	background-attachment fixed

	> .header
		@media (max-width 1000px)
			display none

	> .content
		display flex
		flex-direction column
		flex 1
		overflow hidden
</style>
