<template>
<div class="mk-notes">
	<div class="newer-indicator" :style="{ top: $store.state.uiHeaderHeight + 'px' }" v-show="queue.length > 0"></div>

	<slot name="head"></slot>

	<slot name="empty" v-if="notes.length == 0 && !fetching && requestInitPromise == null"></slot>

	<div class="init" v-if="fetching">
		%fa:spinner .pulse%%i18n:common.loading%
	</div>

	<div v-if="!fetching && requestInitPromise != null">
		<p>読み込みに失敗しました。</p>
		<button @click="resolveInitPromise">リトライ</button>
	</div>

	<transition-group name="mk-notes" class="transition">
		<template v-for="(note, i) in _notes">
			<mk-note :note="note" :key="note.id" @update:note="onNoteUpdated(i, $event)"/>
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
import getNoteSummary from '../../../../../renderers/get-note-summary';

const displayLimit = 30;

export default Vue.extend({
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

			// 投稿が自分のものではないかつ、タブが非表示またはスクロール位置が最上部ではないならタイトルで通知
			if ((document.hidden || !this.isScrollTop()) && note.userId !== (this as any).os.i.id) {
				this.unreadCount++;
				document.title = `(${this.unreadCount}) ${getNoteSummary(note)}`;
			}

			if (this.isScrollTop()) {
				// Prepend the note
				this.notes.unshift(note);

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

			if ((this as any).os.i.clientSettings.fetchOnScroll !== false) {
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
	background isDark ? #282C37 : #fff
	border-radius 8px
	box-shadow 0 0 2px rgba(#000, 0.1)

	@media (min-width 500px)
		box-shadow 0 8px 32px rgba(#000, 0.1)

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
		border-bottom-left-radius 8px
		border-bottom-right-radius 8px

		&:empty
			display none

		> button
			margin 0
			padding 16px
			width 100%
			border-radius 0 0 8px 8px

			@media (min-width 500px)
				padding 20px

			&:disabled
				opacity 0.7

.mk-notes[data-darkmode]
	root(true)

.mk-notes:not([data-darkmode])
	root(false)

</style>
