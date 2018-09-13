<template>
<div class="qiziqtywpuaucsgarwajitwaakggnisj" :title="title">
	<mk-avatar class="avatar" :user="note.user" v-if="!mini"/>
	<div class="main">
		<mk-note-header class="header" :note="note" :mini="true"/>
		<div class="body">
			<p v-if="note.cw != null" class="cw">
				<span class="text" v-if="note.cw != ''">{{ note.cw }}</span>
				<span class="toggle" @click="showContent = !showContent">{{ showContent ? '%i18n:@hide%' : '%i18n:@see-more%' }}</span>
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
		mini: {
			type: Boolean,
			required: false,
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
root(isDark)
	display flex
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
				color isDark ? #fff : #717171

				> .text
					margin-right 8px

				> .toggle
					display inline-block
					padding 4px 8px
					font-size 0.7em
					color isDark ? #393f4f : #fff
					background isDark ? #687390 : #b1b9c1
					border-radius 2px
					cursor pointer
					user-select none

					&:hover
						background isDark ? #707b97 : #bbc4ce

			> .content
				> .text
					cursor default
					margin 0
					padding 0
					color isDark ? #959ba7 : #717171

.qiziqtywpuaucsgarwajitwaakggnisj[data-darkmode]
	root(true)

.qiziqtywpuaucsgarwajitwaakggnisj:not([data-darkmode])
	root(false)

</style>
