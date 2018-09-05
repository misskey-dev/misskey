<template>
<div class="mk-media-banner">
	<div class="mk-media-banner-sensitive" v-if="media.isSensitive && hide" @click="hide = false">
		<span class="mk-media-banner-icon">%fa:exclamation-triangle%</span>
		<b>%i18n:@sensitive%</b>
		<span>%i18n:@click-to-show%</span>
	</div>
	<div class="mk-media-banner-audio" v-else-if="media.type.startsWith('audio')">
		<audio class="audio"
			:src="media.url"
			:title="media.name"
			controls
			ref="audio"
			preload="metadata" />
	</div>
	<a class="mk-media-banner-download" v-else
		:href="media.url"
		:title="media.name"
		:download="media.name"
	>
		<span class="mk-media-banner-icon">%fa:download%</span>
		<b>{{ media.name }}</b>
	</a>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		media: {
			type: Object,
			required: true
		},
		hide: {
			type: Boolean,
			default: true
		}
	}
})
</script>

<style lang="stylus" scoped>
root(isDark)
	width 100%
	border-radius 4px
	margin-top 4px
	overflow hidden

	.mk-media-banner-download,
	.mk-media-banner-sensitive
		display flex
		align-items center
		font-size 12px
		padding .2em .6em
		white-space nowrap

		> *
			display block

		> b
			flex-shrink 2147483647
			overflow hidden
			text-overflow ellipsis

		> *:not(:last-child)
			margin-right .2em

		> .mk-media-banner-icon
			font-size 1.6em

	.mk-media-banner-download
		background isDark ? #21242d : #f7f7f7

	.mk-media-banner-sensitive
		background #111
		color #fff

	.mk-media-banner-audio
		.audio
			display block
			width 100%
			height 100%

.mk-media-banner[data-darkmode]
	root(true)

.mk-media-banner:not([data-darkmode])
	root(false)
</style>
