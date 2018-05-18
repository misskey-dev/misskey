<template>
<div class="mk-notes">
	<div class="newer-indicator" :style="{ top: $store.state.uiHeaderHeight + 'px' }" v-show="queue.length > 0"></div>

	<slot name="empty" v-if="notes.length == 0 && !fetching && requestInitPromise == null"></slot>

	<div v-if="!fetching && requestInitPromise != null">
		<p>%i18n:@error%</p>
		<button @click="resolveInitPromise">%i18n:@retry%</button>
	</div>

	<transition-group name="mk-notes" class="transition">
		<template v-for="(note, i) in _notes">
			<x-note :note="note" :key="note.id" @update:note="onNoteUpdated(i, $event)"/>
			<p class="date" :key="note.id + '_date'" v-if="i != notes.length - 1 && note._date != _notes[i + 1]._date">
				<span>%fa:angle-up%{{ note._datetext }}</span>
				<span>%fa:angle-down%{{ _notes[i + 1]._datetext }}</span>
			</p>
		</template>
	</transition-group>

	<footer v-if="more">
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
import getNoteSummary from '../../../../../renderers/get-note-summary';

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
			requestInitPromise: null as () => Promise<any[]>,
			notes: [],
			queue: [],
			unreadCount: 0,
			fetching: true,
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
		document.addEventListener('visibilitychange', this.onVisibilitychange, false);
		window.addEventListener('scroll', this.onScroll);
	},

	beforeDestroy() {
		document.removeEventListener('visibilitychange', this.onVisibilitychange);
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

		init(promiseGenerator: () => Promise<any[]>) {
			this.requestInitPromise = promiseGenerator;
			this.resolveInitPromise();
		},

		resolveInitPromise() {
			this.queue = [];
			this.notes = [];
			this.fetching = true;

			const promise = this.requestInitPromise();

			promise.then(notes => {
				this.notes = notes;
				this.requestInitPromise = null;
				this.fetching = false;
			}, e => {
				this.fetching = false;
			});
		},

		prepend(note, silent = false) {
			//#region 弾く
			const isMyNote = note.userId == (this as any).os.i.id;
			const isPureRenote = note.renoteId != null && note.text == null && note.mediaIds.length == 0 && note.poll == null;

			if ((this as any).clientSettings.showMyRenotes === false) {
				if (isMyNote && isPureRenote) {
					return;
				}
			}

			if ((this as any).clientSettings.showRenotedMyNotes === false) {
				if (isPureRenote && (note.renote.userId == (this as any).os.i.id)) {
					return;
				}
			}
			//#endregion

			// 投稿が自分のものではないかつ、タブが非表示またはスクロール位置が最上部ではないならタイトルで通知
			if ((document.hidden || !this.isScrollTop()) && note.userId !== (this as any).os.i.id) {
				this.unreadCount++;
				document.title = `(${this.unreadCount}) ${getNoteSummary(note)}`;
			}

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
				this.queue.push(note);
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
			if (this.more == null) return;
			if (this.moreFetching) return;

			this.moreFetching = true;
			await this.more();
			this.moreFetching = false;
		},

		clearNotification() {
			this.unreadCount = 0;
			document.title = 'Misskey';
		},

		onVisibilitychange() {
			if (!document.hidden) {
				this.clearNotification();
			}
		},

		onScroll() {
			if (this.isScrollTop()) {
				this.releaseQueue();
				this.clearNotification();
			}

			if ((this as any).clientSettings.fetchOnScroll !== false) {
				const current = window.scrollY + window.innerHeight;
				if (current > document.body.offsetHeight - 8) this.loadMore();
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

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

	> .newer-indicator
		position -webkit-sticky
		position sticky
		z-index 100
		height 3px
		background $theme-color

	> footer
		> button
			display block
			margin 0
			padding 16px
			width 100%
			text-align center
			color #ccc
			background isDark ? #282C37 : #fff
			border-top solid 1px isDark ? #1c2023 : #eaeaea
			border-bottom-left-radius 6px
			border-bottom-right-radius 6px

			&:hover
				background isDark ? #2e3440 : #f5f5f5

			&:active
				background isDark ? #21242b : #eee

.mk-notes[data-darkmode]
	root(true)

.mk-notes:not([data-darkmode])
	root(false)

</style>
