<template>
<div class="mk-note-preview" :class="{ smart: $store.state.device.postStyle == 'smart' }">
	<mk-avatar class="avatar" :user="note.user" v-if="$store.state.device.postStyle != 'smart'"/>
	<div class="main">
		<mk-note-header class="header" :note="note"/>
		<div class="body">
			<mk-sub-note-content class="text" :note="note"/>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['note']
});
</script>

<style lang="stylus" scoped>
root(isDark)
	display flex
	margin 0
	padding 0
	font-size 10px

	@media (min-width 350px)
		font-size 12px

	@media (min-width 500px)
		font-size 14px

	&.smart
		> .main
			width 100%

			> header
				align-items center

	> .avatar
		flex-shrink 0
		display block
		margin 0 10px 0 0
		width 40px
		height 40px
		border-radius 8px

		@media (min-width 350px)
			margin 0 10px 0 0
			width 44px
			height 44px

		@media (min-width 500px)
			margin 0 12px 0 0
			width 48px
			height 48px

	> .main
		flex 1
		min-width 0

		> .header
			margin-bottom 2px

		> .body

			> .text
				cursor default
				margin 0
				padding 0
				color isDark ? #959ba7 : #717171

.mk-note-preview[data-darkmode]
	root(true)

.mk-note-preview:not([data-darkmode])
	root(false)

</style>
