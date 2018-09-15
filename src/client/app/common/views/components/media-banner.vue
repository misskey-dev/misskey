<template>
<div class="mk-media-banner">
	<div class="sensitive" v-if="media.isSensitive && hide" @click="hide = false">
		<span class="icon">%fa:exclamation-triangle%</span>
		<b>%i18n:@sensitive%</b>
		<span>%i18n:@click-to-show%</span>
	</div>
	<div class="audio" v-else-if="media.type.startsWith('audio')">
		<audio class="audio"
			:src="media.url"
			:title="media.name"
			controls
			ref="audio"
			preload="metadata" />
	</div>
	<a class="download" v-else
		:href="media.url"
		:title="media.name"
		:download="media.name"
	>
		<span class="icon">%fa:download%</span>
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

	> .download,
	> .sensitive
		display flex
		align-items center
		font-size 12px
		padding 8px 12px
		white-space nowrap

		> *
			display block

		> b
			overflow hidden
			text-overflow ellipsis

		> *:not(:last-child)
			margin-right .2em

		> .icon
			font-size 1.6em

	> .download
		background isDark ? #21242d : #f7f7f7

	> .sensitive
		background #111
		color #fff

	> .audio
		.audio
			display block
			width 100%

.mk-media-banner[data-darkmode]
	root(true)

.mk-media-banner:not([data-darkmode])
	root(false)
</style>
