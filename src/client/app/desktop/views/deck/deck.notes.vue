<template>
<div class="eamppglmnmimdhrlzhplwpvyeaqmmhxu">
	<slot name="empty" v-if="notes.length == 0 && !fetching && requestInitPromise == null"></slot>

	<div class="placeholder" v-if="fetching">
		<template v-for="i in 10">
			<mk-note-skeleton :key="i"/>
		</template>
	</div>

	<mk-error v-if="!fetching && requestInitPromise != null" @retry="resolveInitPromise"/>

	<!-- トランジションを有効にするとなぜかメモリリークする -->
	<component :is="!$store.state.device.reduceMotion ? 'transition-group' : 'div'" name="mk-notes" class="transition notes" ref="notes" tag="div">
		<template v-for="(note, i) in _notes">
			<x-note
				:note="note"
				:key="note.id"
				@update:note="onNoteUpdated(i, $event)"
				:media-view="mediaView"
				:compact="true"
				:mini="true"/>
			<p class="date" :key="note.id + '_date'" v-if="i != notes.length - 1 && note._date != _notes[i + 1]._date">
				<span><fa icon="angle-up"/>{{ note._datetext }}</span>
				<span><fa icon="angle-down"/>{{ _notes[i + 1]._datetext }}</span>
			</p>
		</template>
	</component>

	<footer v-if="more">
		<button @click="loadMore" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }">
			<template v-if="!moreFetching">{{ $t('@.load-more') }}</template>
			<template v-if="moreFetching"><fa icon="spinner" pulse fixed-width/></template>
		</button>
	</footer>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import shouldMuteNote from '../../../common/scripts/should-mute-note';

import XNote from '../components/note.vue';

const displayLimit = 20;

export default Vue.extend({
	i18n: i18n(),
	components: {
		XNote
	},

	inject: ['column', 'isScrollTop', 'count'],

	props: {
		more: {
			type: Function,
			required: false
		},
		mediaView: {
			type: Boolean,
			required: false,
			default: false
		}
	},

	data() {
		return {
			rootEl: null,
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
				note._datetext = this.$t('@.month-and-day').replace('{month}', month.toString()).replace('{day}', date.toString());
				return note;
			});
		}
	},

	watch: {
		queue(q) {
			this.count(q.length);
		}
	},

	created() {
		this.column.$on('top', this.onTop);
		this.column.$on('bottom', this.onBottom);
	},

	beforeDestroy() {
		this.column.$off('top', this.onTop);
		this.column.$off('bottom', this.onBottom);
	},

	methods: {
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
			// 弾く
			if (shouldMuteNote(this.$store.state.i, this.$store.state.settings, note)) return;

			// タブが非表示ならタイトルで通知
			if (document.hidden) {
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
			for (const n of this.queue) {
				this.prepend(n, true);
			}
			this.queue = [];
		},

		async loadMore() {
			if (this.more == null) return;
			if (this.moreFetching) return;

			this.moreFetching = true;
			await this.more();
			this.moreFetching = false;
		},

		onTop() {
			this.releaseQueue();
		},

		onBottom() {
			this.loadMore();
		}
	}
});
</script>

<style lang="stylus" scoped>
.eamppglmnmimdhrlzhplwpvyeaqmmhxu
	.transition
		.mk-notes-enter
		.mk-notes-leave-to
			opacity 0
			transform translateY(-30px)

		> *
			transition transform .3s ease, opacity .3s ease

	> .placeholder
		padding 16px
		opacity 0.3

	> .notes
		> .date
			display block
			margin 0
			line-height 28px
			font-size 12px
			text-align center
			color var(--dateDividerFg)
			background var(--dateDividerBg)
			border-bottom solid var(--lineWidth) var(--faceDivider)

			span
				margin 0 16px

			[data-icon]
				margin-right 8px

	> footer
		> button
			display block
			margin 0
			padding 16px
			width 100%
			text-align center
			color #ccc
			background var(--face)
			border-top solid var(--lineWidth) var(--faceDivider)
			border-bottom-left-radius 6px
			border-bottom-right-radius 6px

			&:hover
				box-shadow 0 0 0 100px inset rgba(0, 0, 0, 0.05)

			&:active
				box-shadow 0 0 0 100px inset rgba(0, 0, 0, 0.1)

</style>
