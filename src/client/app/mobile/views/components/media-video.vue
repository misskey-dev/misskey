<template>
	<a class="mk-media-video"
		:href="video.url"
		target="_blank"
		:style="imageStyle"
		:title="video.name">
		%fa:R play-circle%
	</a>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
	props: ['video'],
	computed: {
		imageStyle(): any {
			return {
				'background-image': `url(${this.video.url}?thumbnail&size=512)`
			};
		}
	},})
</script>

<style lang="stylus" scoped>
.mk-media-video
	display flex
	justify-content center
	align-items center

	font-size 3.5em
	overflow hidden
	background-position center
	background-size cover
	width 100%
	height 100%
</style>
