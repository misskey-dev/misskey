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
	<footer v-if="loadMore">
		<button @click="loadMore" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }">
			<template v-if="!moreFetching">%i18n:@load-more%</template>
			<template v-if="moreFetching">%fa:spinner .pulse .fw%</template>
		</button>
	</footer>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { url } from '../../../config';

import XNote from './notes.note.vue';

const displayLimit = 30;

export default Vue.extend({
	components: {
		XNote
	},

	props: {
		more: {
			type: Function,
			required: false
		}
	},

	data() {
		return {
			notes: [],
			queue: [],
			fetching: false,
			moreFetching: false
		};
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

	mounted() {
		window.addEventListener('scroll', this.onScroll);
	},

	beforeDestroy() {
		window.removeEventListener('scroll', this.onScroll);
	},

	methods: {
		isScrollTop() {
			return window.scrollY <= 8;
		},

		focus() {
			(this.$el as any).children[0].focus();
		},

		onNoteUpdated(i, note) {
			Vue.set((this as any).notes, i, note);
		},

		init(notes) {
			this.queue = [];
			this.notes = notes;
		},

		prepend(note, silent = false) {
			//#region 弾く
			const isMyNote = note.userId == (this as any).os.i.id;
			const isPureRenote = note.renoteId != null && note.text == null && note.mediaIds.length == 0 && note.poll == null;

			if ((this as any).os.i.clientSettings.showMyRenotes === false) {
				if (isMyNote && isPureRenote) {
					return;
				}
			}

			if ((this as any).os.i.clientSettings.showRenotedMyNotes === false) {
				if (isPureRenote && (note.renote.userId == (this as any).os.i.id)) {
					return;
				}
			}
			//#endregion

			if (this.isScrollTop()) {
				// Prepend the note
				this.notes.unshift(note);

				// サウンドを再生する
				if ((this as any).os.isEnableSounds && !silent) {
					const sound = new Audio(`${url}/assets/post.mp3`);
					sound.volume = localStorage.getItem('soundVolume') ? parseInt(localStorage.getItem('soundVolume'), 10) / 100 : 0.5;
					sound.play();
				}

				// オーバーフローしたら古い投稿は捨てる
				if (this.notes.length >= displayLimit) {
					this.notes = this.notes.slice(0, displayLimit);
				}
			} else {
				this.queue.unshift(note);
			}
		},

		append(note) {
			this.notes.push(note);
		},

		tail() {
			return this.notes[this.notes.length - 1];
		},

		releaseQueue() {
			this.queue.forEach(n => this.prepend(n, true));
			this.queue = [];
		},

		async loadMore() {
			this.moreFetching = true;
			await this.more();
			this.moreFetching = false;
		},

		onScroll() {
			if (this.isScrollTop()) {
				this.releaseQueue();
			}

			if ((this as any).os.i.clientSettings.fetchOnScroll !== false) {
				const current = window.scrollY + window.innerHeight;
				if (current > document.body.offsetHeight - 8) this.loadMore();
			}
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
