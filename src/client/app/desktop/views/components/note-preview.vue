<template>
<div class="qiziqtywpuaucsgarwajitwaakggnisj" :title="title">
	<mk-avatar class="avatar" :user="note.user" v-if="!narrow"/>
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
	},

	computed: {
		title(): string {
			return new Date(this.note.createdAt).toLocaleString();
		}
	}
});
</script>

<style lang="stylus" scoped>
.qiziqtywpuaucsgarwajitwaakggnisj
	display flex
	overflow hidden
	font-size 0.9em

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
