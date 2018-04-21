<template>
<div class="mk-notes">
	<slot name="head"></slot>
	<slot></slot>
	<transition-group name="mk-notes" class="transition">
		<template v-for="(note, i) in _notes">
			<mk-note :note="note" :key="note.id" @update:note="onNoteUpdated(i, $event)"/>
			<p class="date" :key="note.id + '_date'" v-if="i != notes.length - 1 && note._date != _notes[i + 1]._date">
				<span>%fa:angle-up%{{ note._datetext }}</span>
				<span>%fa:angle-down%{{ _notes[i + 1]._datetext }}</span>
			</p>
		</template>
	</transition-group>
	<footer>
		<slot name="tail"></slot>
	</footer>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		notes: {
			type: Array,
			default: () => []
		}
	},
	computed: {
		_notes(): any[] {
			return (this.notes as any).map(note => {
				const date = new Date(note.createdAt).getDate();
				const month = new Date(note.createdAt).getMonth() + 1;
				note._date = date;
				note._datetext = `${month}月 ${date}日`;
				return note;
			});
		}
	},
	methods: {
		onNoteUpdated(i, note) {
			Vue.set((this as any).notes, i, note);
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.mk-notes
	background #fff
	border-radius 8px
	box-shadow 0 0 0 1px rgba(0, 0, 0, 0.2)

	.transition
		.mk-notes-enter
		.mk-notes-leave-to
			opacity 0
			transform translateY(-30px)

		> *
			transition transform .3s ease, opacity .3s ease

		> .date
			display block
			margin 0
			line-height 32px
			text-align center
			font-size 0.9em
			color #aaa
			background #fdfdfd
			border-bottom solid 1px #eaeaea

			span
				margin 0 16px

			[data-fa]
				margin-right 8px

	> .init
		padding 64px 0
		text-align center
		color #999

		> [data-fa]
			margin-right 4px

	> .empty
		margin 0 auto
		padding 32px
		max-width 400px
		text-align center
		color #999

		> [data-fa]
			display block
			margin-bottom 16px
			font-size 3em
			color #ccc

	> footer
		text-align center
		border-top solid 1px #eaeaea
		border-bottom-left-radius 4px
		border-bottom-right-radius 4px

		&:empty
			display none

		> button
			margin 0
			padding 16px
			width 100%
			color $theme-color
			border-radius 0 0 8px 8px

			&:disabled
				opacity 0.7

</style>
