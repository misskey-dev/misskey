<template>
<div class="mk-notes">
	<div class="newer-indicator" :style="{ top: $store.state.uiHeaderHeight + 'px' }" v-show="queue.length > 0"></div>

	<slot name="empty" v-if="notes.length == 0 && !fetching && requestInitPromise == null"></slot>

	<div v-if="!fetching && requestInitPromise != null" class="error">
		<p>%fa:exclamation-triangle% %i18n:common.error.title%</p>
		<ui-button @click="resolveInitPromise">%i18n:common.error.retry%</ui-button>
	</div>

	<div class="placeholder" v-if="fetching">
		<template v-for="i in 10">
			<mk-note-skeleton :key="i"/>
		</template>
	</div>

	<!-- トランジションを有効にするとなぜかメモリリークする -->
	<component :is="!$store.state.device.reduceMotion ? 'transition-group' : 'div'" name="mk-notes" class="notes transition" tag="div" ref="notes">
		<template v-for="(note, i) in _notes">
			<x-note :note="note" :key="note.id" @update:note="onNoteUpdated(i, $event)" ref="note"/>
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
import * as config from '../../../config';

import XNote from './note.vue';

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

		focus() {
			(this.$refs.notes as any).children[0].focus ? (this.$refs.notes as any).children[0].focus() : (this.$refs.notes as any).$el.children[0].focus();
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

				// サウンドを再生する
				if (this.$store.state.device.enableSounds && !silent) {
					const sound = new Audio(`${config.url}/assets/post.mp3`);
					sound.volume = this.$store.state.device.soundVolume;
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

		onScroll() {
			if (this.isScrollTop()) {
				this.releaseQueue();
			}

			if (this.$store.state.settings.fetchOnScroll !== false) {
				const current = window.scrollY + window.innerHeight;
				if (current > document.body.offsetHeight - 8) this.loadMore();
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-notes
	.transition
		.mk-notes-enter
		.mk-notes-leave-to
			opacity 0
			transform translateY(-30px)

		> *
			transition transform .3s ease, opacity .3s ease

	> .error
		max-width 300px
		margin 0 auto
		padding 32px
		text-align center
		color var(--text)

		> p
			margin 0 0 8px 0

	> .placeholder
		padding 32px
		opacity 0.3

	> .notes
		> .date
			display block
			margin 0
			line-height 32px
			font-size 14px
			text-align center
			color var(--dateDividerFg)
			background var(--dateDividerBg)
			border-bottom solid 1px var(--faceDivider)

			span
				margin 0 16px

			[data-fa]
				margin-right 8px

	> .newer-indicator
		position -webkit-sticky
		position sticky
		z-index 100
		height 3px
		background var(--primary)

	> footer
		> button
			display block
			margin 0
			padding 16px
			width 100%
			text-align center
			color #ccc
			background var(--face)
			border-top solid 1px var(--faceDivider)
			border-bottom-left-radius 6px
			border-bottom-right-radius 6px

			&:hover
				box-shadow 0 0 0 100px inset rgba(0, 0, 0, 0.05)

			&:active
				box-shadow 0 0 0 100px inset rgba(0, 0, 0, 0.1)

</style>
