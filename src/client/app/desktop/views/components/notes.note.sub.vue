<template>
<div class="tkfdzaxtkdeianobciwadajxzbddorql" :title="title">
	<mk-avatar class="avatar" :user="note.user"/>
	<div class="main">
		<mk-note-header class="header" :note="note"/>
		<div class="body">
			<p v-if="note.cw != null" class="cw">
				<span class="text" v-if="note.cw != ''">{{ note.cw }}</span>
				<mk-cw-button v-model="showContent"/>
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

	data() {
		return {
			showContent: false
		};
	},

	computed: {
		title(): string {
			return new Date(this.note.createdAt).toLocaleString();
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

			> .cw
				cursor default
				display block
				margin 0
				padding 0
				overflow-wrap break-word
				color isDark ? #fff : #717171

				> .text
					margin-right 8px

			> .content
				> .text
					cursor default
					margin 0
					padding 0
					color isDark ? #959ba7 : #717171

					pre
						max-height 120px
						font-size 80%

.tkfdzaxtkdeianobciwadajxzbddorql[data-darkmode]
	root(true)

.tkfdzaxtkdeianobciwadajxzbddorql:not([data-darkmode])
	root(false)

</style>
