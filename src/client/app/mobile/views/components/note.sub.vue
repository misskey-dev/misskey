<template>
<div class="zlrxdaqttccpwhpaagdmkawtzklsccam" :class="{ smart: $store.state.device.postStyle == 'smart', mini: narrow }">
	<mk-avatar class="avatar" :user="note.user" v-if="$store.state.device.postStyle != 'smart'"/>
	<div class="main">
		<mk-note-header class="header" :note="note" :mini="true"/>
		<div class="body">
			<p v-if="note.cw != null" class="cw">
				<mfm v-if="note.cw != ''" class="text" :text="note.cw" :author="note.user" :i="$store.state.i" :custom-emojis="note.emojis" />
				<mk-cw-button v-model="showContent" :note="note"/>
			</p>
			<div class="content" v-show="note.cw == null || showContent">
				<mk-sub-note-content class="text" :note="note"/>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		note: {
			type: Object,
			required: true
		},
		// TODO
		truncate: {
			type: Boolean,
			default: true
		}
	},

	inject: {
		narrow: {
			default: false
		}
	},

	data() {
		return {
			showContent: false
		};
	}
});
</script>

<style lang="stylus" scoped>
.zlrxdaqttccpwhpaagdmkawtzklsccam
	display flex
	padding 16px
	font-size 10px
	background var(--subNoteBg)

	&:not(.mini)

		@media (min-width 350px)
			font-size 12px

		@media (min-width 500px)
			font-size 14px

		@media (min-width 600px)
			padding 24px 32px

		> .avatar

			@media (min-width 350px)
				margin-right 10px
				width 42px
				height 42px

			@media (min-width 500px)
				margin-right 14px
				width 50px
				height 50px

	&.smart
		> .main
			width 100%

			> header
				align-items center

	> .avatar
		flex-shrink 0
		display block
		margin 0 8px 0 0
		width 38px
		height 38px
		border-radius 8px

	> .main
		flex 1
		min-width 0

		> .header
			margin-bottom 2px

		> .body
			> .cw
				cursor default
				display block
				margin 0
				padding 0
				overflow-wrap break-word
				color var(--noteText)

				> .text
					margin-right 8px

			> .content
				> .text
					margin 0
					padding 0
					color var(--subNoteText)

					pre
						max-height 120px
						font-size 80%

</style>
