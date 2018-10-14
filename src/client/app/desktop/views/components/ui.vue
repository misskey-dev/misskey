<template>
<div class="mk-ui" v-hotkey.global="keymap">
	<div class="bg" v-if="$store.getters.isSignedIn && $store.state.i.wallpaperUrl" :style="style"></div>
	<x-header class="header" v-if="navbar == 'top'" v-show="!zenMode" ref="header"/>
	<x-sidebar class="sidebar" v-if="navbar != 'top'" ref="sidebar"/>
	<div class="content" :class="[{ sidebar: navbar != 'top' }, navbar]">
		<slot></slot>
	</div>
	<mk-stream-indicator v-if="$store.getters.isSignedIn"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XHeader from './ui.header.vue';
import XSidebar from './ui.sidebar.vue';

export default Vue.extend({
	components: {
		XHeader,
		XSidebar
	},

	data() {
		return {
			zenMode: false
		};
	},

	computed: {
		navbar(): string {
			return this.$store.state.device.navbar;
		},

		style(): any {
			if (!this.$store.getters.isSignedIn || this.$store.state.i.wallpaperUrl == null) return {};
			return {
				backgroundColor: this.$store.state.i.wallpaperColor && this.$store.state.i.wallpaperColor.length == 3 ? `rgb(${ this.$store.state.i.wallpaperColor.join(',') })` : null,
				backgroundImage: `url(${ this.$store.state.i.wallpaperUrl })`
			};
		},

		keymap(): any {
			return {
				'p': this.post,
				'n': this.post,
				'z': this.toggleZenMode
			};
		}
	},

	watch: {
		'$store.state.uiHeaderHeight'() {
			this.$el.style.paddingTop = this.$store.state.uiHeaderHeight + 'px';
		},

		navbar() {
			if (this.navbar != 'top') {
				this.$store.commit('setUiHeaderHeight', 0);
			}
		}
	},

	mounted() {
		this.$el.style.paddingTop = this.$store.state.uiHeaderHeight + 'px';
	},

	methods: {
		post() {
			(this as any).apis.post();
		},

		toggleZenMode() {
			this.zenMode = !this.zenMode;
			this.$nextTick(() => {
				this.$store.commit('setUiHeaderHeight', this.$refs.header.$el.offsetHeight);
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-ui
	min-height 100vh
	padding-top 48px

	> .bg
		position fixed
		top 0
		left 0
		width 100%
		height 100vh
		background-size cover
		background-position center
		background-attachment fixed
		opacity 0.3

	> .header
		@media (max-width 1000px)
			display none

	> .content.sidebar.left
		padding-left 64px

	> .content.sidebar.right
		padding-right 64px

</style>
