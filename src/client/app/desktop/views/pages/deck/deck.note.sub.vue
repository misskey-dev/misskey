<template>
<div class="fnlfosztlhtptnongximhlbykxblytcq">
	<mk-avatar class="avatar" :user="note.user"/>
	<div class="main">
		<mk-note-header class="header" :note="note" :mini="true"/>
		<div class="body">
			<mk-sub-note-content class="text" :note="note"/>
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
	}
});
</script>

<style lang="stylus" scoped>
.fnlfosztlhtptnongximhlbykxblytcq
	display flex
	padding 16px
	font-size 10px
	background var(--subNoteBg)

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

			> .text
				margin 0
				padding 0
				color var(--subNoteText)

				pre
					max-height 120px
					font-size 80%

</style>
