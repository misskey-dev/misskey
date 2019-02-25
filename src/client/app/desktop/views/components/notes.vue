<template>
<div class="mk-notes">
	<slot name="header"></slot>

	<div class="newer-indicator" :style="{ top: $store.state.uiHeaderHeight + 'px' }" v-show="queue.length > 0"></div>

	<div class="empty" v-if="notes.length == 0 && !fetching && inited">{{ $t('@.no-notes') }}</div>

	<mk-error v-if="!fetching && !inited" @retry="init()"/>

	<div class="placeholder" v-if="fetching">
		<template v-for="i in 10">
			<mk-note-skeleton :key="i"/>
		</template>
	</div>

	<!-- トランジションを有効にするとなぜかメモリリークする -->
	<component :is="!$store.state.device.reduceMotion ? 'transition-group' : 'div'" name="mk-notes" class="notes transition" tag="div" ref="notes">
		<template v-for="(note, i) in _notes">
			<mk-note :note="note" :key="note.id" @update:note="onNoteUpdated(i, $event)" :compact="true" ref="note"/>
			<p class="date" :key="note.id + '_date'" v-if="i != notes.length - 1 && note._date != _notes[i + 1]._date">
				<span><fa icon="angle-up"/>{{ note._datetext }}</span>
				<span><fa icon="angle-down"/>{{ _notes[i + 1]._datetext }}</span>
			</p>
		</template>
	</component>

	<footer v-if="cursor != null">
		<button @click="more" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }">
			<template v-if="!moreFetching">{{ $t('@.load-more') }}</template>
			<template v-if="moreFetching"><fa icon="spinner" pulse fixed-width/></template>
		</button>
	</footer>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import * as config from '../../../config';
import shouldMuteNote from '../../../common/scripts/should-mute-note';

const displayLimit = 30;

export default Vue.extend({
	i18n: i18n(),

	props: {
		makePromise: {
			required: true
		}
	},

	data() {
		return {
			notes: [],
			queue: [],
			fetching: true,
			moreFetching: false,
			inited: false,
			cursor: null
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

	created() {
		this.init();
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

		reload() {
			this.queue = [];
			this.notes = [];
			this.init();
		},

		init() {
			this.fetching = true;
			this.makePromise().then(x => {
				if (Array.isArray(x)) {
					this.notes = x;
				} else {
					this.notes = x.notes;
					this.cursor = x.cursor;
				}
				this.inited = true;
				this.fetching = false;
				this.$emit('inited');
			}, e => {
				this.fetching = false;
			});
		},

		more() {
			if (this.cursor == null || this.moreFetching) return;
			this.moreFetching = true;
			this.makePromise(this.cursor).then(x => {
				this.notes = this.notes.concat(x.notes);
				this.cursor = x.cursor;
				this.moreFetching = false;
			}, e => {
				this.moreFetching = false;
			});
		},

		prepend(note, silent = false) {
			// 弾く
			if (shouldMuteNote(this.$store.state.i, this.$store.state.settings, note)) return;

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

		releaseQueue() {
			for (const n of this.queue) {
				this.prepend(n, true);
			}
			this.queue = [];
		},

		onScroll() {
			if (this.isScrollTop()) {
				this.releaseQueue();
			}

			if (this.$store.state.settings.fetchOnScroll !== false) {
				const current = window.scrollY + window.innerHeight;
				if (current > document.body.offsetHeight - 8) this.more();
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-notes
	background var(--face)
	box-shadow var(--shadow)
	border-radius var(--round)
	overflow hidden

	.transition
		.mk-notes-enter
		.mk-notes-leave-to
			opacity 0
			transform translateY(-30px)

		> *
			transition transform .3s ease, opacity .3s ease

	> .empty
		padding 16px
		text-align center
		color var(--text)

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
			border-bottom solid var(--lineWidth) var(--faceDivider)

			span
				margin 0 16px

			[data-icon]
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
			border-top solid var(--lineWidth) var(--faceDivider)
			border-bottom-left-radius 6px
			border-bottom-right-radius 6px

			&:hover
				box-shadow 0 0 0 100px inset rgba(0, 0, 0, 0.05)

			&:active
				box-shadow 0 0 0 100px inset rgba(0, 0, 0, 0.1)

</style>
