<template>
<div class="sub" :title="title">
	<mk-avatar class="avatar" :user="note.user"/>
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
import dateStringify from '../../../common/scripts/date-stringify';

export default Vue.extend({
	props: ['note'],
	computed: {
		title(): string {
			return dateStringify(this.note.createdAt);
		}
	}
});
</script>

<style lang="stylus" scoped>
root(isDark)
	display flex
	margin 0
	padding 16px 32px
	font-size 0.9em
	background isDark ? #21242d : #fcfcfc

	> .avatar
		flex-shrink 0
		display block
		margin 0 12px 0 0
		width 48px
		height 48px
		border-radius 8px

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

				pre
					max-height 120px
					font-size 80%

.sub[data-darkmode]
	root(true)

.sub:not([data-darkmode])
	root(false)

</style>
