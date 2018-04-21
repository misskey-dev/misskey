<template>
<div class="mk-notes">
	<transition-group name="mk-notes" class="transition">
		<template v-for="(note, i) in _notes">
			<x-note :note="note" :key="note.id" @update:note="onNoteUpdated(i, $event)"/>
			<p class="date" :key="note.id + '_date'" v-if="i != notes.length - 1 && note._date != _notes[i + 1]._date">
				<span>%fa:angle-up%{{ note._datetext }}</span>
				<span>%fa:angle-down%{{ _notes[i + 1]._datetext }}</span>
			</p>
		</template>
	</transition-group>
	<footer>
		<slot name="footer"></slot>
	</footer>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XNote from './notes.note.vue';

export default Vue.extend({
	components: {
		XNote
	},
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
		focus() {
			(this.$el as any).children[0].focus();
		},
		onNoteUpdated(i, note) {
			Vue.set((this as any).notes, i, note);
		}
	}
});
</script>

<style lang="stylus" scoped>
root(isDark)
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
			font-size 14px
			text-align center
			color isDark ? #666b79 : #aaa
			background isDark ? #242731 : #fdfdfd
			border-bottom solid 1px isDark ? #1c2023 : #eaeaea

			span
				margin 0 16px

			[data-fa]
				margin-right 8px

	> footer
		> *
			display block
			margin 0
			padding 16px
			width 100%
			text-align center
			color #ccc
			border-top solid 1px #eaeaea
			border-bottom-left-radius 4px
			border-bottom-right-radius 4px

		> button
			&:hover
				background #f5f5f5

			&:active
				background #eee

.mk-notes[data-darkmode]
	root(true)

.mk-notes:not([data-darkmode])
	root(false)

</style>
