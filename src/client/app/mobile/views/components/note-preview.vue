<template>
<div class="yohlumlkhizgfkvvscwfcrcggkotpvry" :class="{ smart: $store.state.device.postStyle == 'smart', mini: narrow }">
	<mk-avatar class="avatar" :user="note.user" v-if="$store.state.device.postStyle != 'smart' && !narrow"/>
	<div class="main">
		<mk-note-header class="header" :note="note" :mini="true"/>
		<div class="body">
			<p v-if="note.cw != null" class="cw">
				<span class="text" v-if="note.cw != ''">{{ note.cw }}</span>
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
.yohlumlkhizgfkvvscwfcrcggkotpvry
	display flex
	margin 0
	padding 0
	overflow hidden
	font-size 10px

	&:not(.mini)

		@media (min-width 350px)
			font-size 12px

		@media (min-width 500px)
			font-size 14px

		> .avatar

			@media (min-width 350px)
				margin 0 10px 0 0
				width 44px
				height 44px

			@media (min-width 500px)
				margin 0 12px 0 0
				width 48px
				height 48px

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
					cursor default
					margin 0
					padding 0
					color var(--subNoteText)

</style>
