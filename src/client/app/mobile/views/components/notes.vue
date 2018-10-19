<template>
<div class="mk-notes">
	<slot name="head"></slot>

	<slot name="empty" v-if="notes.length == 0 && !fetching && requestInitPromise == null"></slot>

	<div class="placeholder" v-if="fetching">
		<template v-for="i in 10">
			<mk-note-skeleton :key="i"/>
		</template>
	</div>

	<div v-if="!fetching && requestInitPromise != null">
		<p>%i18n:@failed%</p>
		<button @click="resolveInitPromise">%i18n:@retry%</button>
	</div>

	<!-- トランジションを有効にするとなぜかメモリリークする -->
	<component :is="!$store.state.device.reduceMotion ? 'transition-group' : 'div'" name="mk-notes" class="transition" tag="div">
		<template v-for="(note, i) in _notes">
			<mk-note :note="note" :key="note.id" @update:note="onNoteUpdated(i, $event)"/>
			<p class="date" :key="note.id + '_date'" v-if="i != notes.length - 1 && note._date != _notes[i + 1]._date">
				<span>%fa:angle-up%{{ note._datetext }}</span>
				<span>%fa:angle-down%{{ _notes[i + 1]._datetext }}</span>
			</p>
		</template>
	</component>

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
				note._datetext = '%i18n:common.month-and-day%'.replace('{month}', month.toString()).replace('{day}', date.toString());
				return note;
			});
		}
	},

	watch: {
		queue(x) {
			if (x.length > 0) {
				this.$store.commit('indicate', true);
			} else {
				this.$store.commit('indicate', false);
			}
		}
	},

	mounted() {
		window.addEventListener('scroll', this.onScroll, { passive: true });
	},

	beforeDestroy() {
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
			const isMyNote = note.userId == this.$store.state.i.id;
			const isPureRenote = note.renoteId != null && note.text == null && note.fileIds.length == 0 && note.poll == null;

			if (this.$store.state.settings.showMyRenotes === false) {
				if (isMyNote && isPureRenote) {
					return;
				}
			}

			if (this.$store.state.settings.showRenotedMyNotes === false) {
				if (isPureRenote && (note.renote.userId == this.$store.state.i.id)) {
					return;
				}
			}

			if (this.$store.state.settings.showLocalRenotes === false) {
				if (isPureRenote && (note.renote.user.host == null)) {
					return;
				}
			}
			//#endregion

			// タブが非表示またはスクロール位置が最上部ではないならタイトルで通知
			if (document.hidden || !this.isScrollTop()) {
				this.$store.commit('pushBehindNote', note);
			}

			if (this.isScrollTop()) {
				// Prepend the note
				this.notes.unshift(note);

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

		onScroll() {
			if (this.isScrollTop()) {
				this.releaseQueue();
			}

			if (this.$store.state.settings.fetchOnScroll !== false) {
				// 親要素が display none だったら弾く
				// https://github.com/syuilo/misskey/issues/1569
				// http://d.hatena.ne.jp/favril/20091105/1257403319
				if (this.$el.offsetHeight == 0) return;

				const current = window.scrollY + window.innerHeight;
				if (current > document.body.offsetHeight - 8) this.loadMore();
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-notes
	overflow hidden
	background var(--face)
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
			color var(--dateDividerFg)
			background var(--dateDividerBg)
			border-bottom solid 1px var(--faceDivider)

			span
				margin 0 16px

			[data-fa]
				margin-right 8px

	> .placeholder
		padding 16px
		opacity 0.3

		@media (min-width 500px)
			padding 32px

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
		border-top solid 1px var(--faceDivider)

		&:empty
			display none

		> button
			margin 0
			padding 16px
			width 100%
			color #ccc

			@media (min-width 500px)
				padding 20px

			&:disabled
				opacity 0.7

</style>
