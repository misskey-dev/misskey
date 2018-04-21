<template>
<div class="mk-home-timeline">
	<div class="newer-indicator" :style="{ top: $store.state.uiHeaderHeight + 'px' }" v-show="queue.length > 0"></div>
	<mk-friends-maker v-if="src == 'home' && alone"/>
	<div class="fetching" v-if="fetching">
		<mk-ellipsis-icon/>
	</div>
	<p class="empty" v-if="notes.length == 0 && !fetching">
		%fa:R comments%%i18n:@empty%
	</p>
	<mk-notes :notes="notes" ref="timeline">
		<button slot="footer" @click="more" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }">
			<template v-if="!moreFetching">%i18n:@load-more%</template>
			<template v-if="moreFetching">%fa:spinner .pulse .fw%</template>
		</button>
	</mk-notes>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { url } from '../../../config';

const fetchLimit = 10;
const displayLimit = 30;

export default Vue.extend({
	props: {
		src: {
			type: String,
			required: true
		}
	},

	data() {
		return {
			fetching: true,
			moreFetching: false,
			existMore: false,
			notes: [],
			queue: [],
			connection: null,
			connectionId: null,
			date: null
		};
	},

	computed: {
		alone(): boolean {
			return (this as any).os.i.followingCount == 0;
		},

		stream(): any {
			return this.src == 'home'
				? (this as any).os.stream
				: this.src == 'local'
					? (this as any).os.streams.localTimelineStream
					: (this as any).os.streams.globalTimelineStream;
		},

		endpoint(): string {
			return this.src == 'home'
				? 'notes/timeline'
				: this.src == 'local'
					? 'notes/local-timeline'
					: 'notes/global-timeline';
		},

		canFetchMore(): boolean {
			return !this.moreFetching && !this.fetching && this.notes.length > 0 && this.existMore;
		}
	},

	mounted() {
		this.connection = this.stream.getConnection();
		this.connectionId = this.stream.use();

		this.connection.on('note', this.onNote);
		if (this.src == 'home') {
			this.connection.on('follow', this.onChangeFollowing);
			this.connection.on('unfollow', this.onChangeFollowing);
		}

		document.addEventListener('keydown', this.onKeydown);
		window.addEventListener('scroll', this.onScroll);

		this.fetch();
	},

	beforeDestroy() {
		this.connection.off('note', this.onNote);
		if (this.src == 'home') {
			this.connection.off('follow', this.onChangeFollowing);
			this.connection.off('unfollow', this.onChangeFollowing);
		}
		this.stream.dispose(this.connectionId);

		document.removeEventListener('keydown', this.onKeydown);
		window.removeEventListener('scroll', this.onScroll);
	},

	methods: {
		isScrollTop() {
			return window.scrollY <= 8;
		},

		fetch(cb?) {
			this.queue = [];
			this.fetching = true;

			(this as any).api(this.endpoint, {
				limit: fetchLimit + 1,
				untilDate: this.date ? this.date.getTime() : undefined,
				includeMyRenotes: (this as any).os.i.clientSettings.showMyRenotes,
				includeRenotedMyNotes: (this as any).os.i.clientSettings.showRenotedMyNotes
			}).then(notes => {
				if (notes.length == fetchLimit + 1) {
					notes.pop();
					this.existMore = true;
				}
				this.notes = notes;
				this.fetching = false;
				this.$emit('loaded');
				if (cb) cb();
			});
		},

		more() {
			if (!this.canFetchMore) return;

			this.moreFetching = true;

			(this as any).api(this.endpoint, {
				limit: fetchLimit + 1,
				untilId: this.notes[this.notes.length - 1].id,
				includeMyRenotes: (this as any).os.i.clientSettings.showMyRenotes,
				includeRenotedMyNotes: (this as any).os.i.clientSettings.showRenotedMyNotes
			}).then(notes => {
				if (notes.length == fetchLimit + 1) {
					notes.pop();
				} else {
					this.existMore = false;
				}
				this.notes = this.notes.concat(notes);
				this.moreFetching = false;
			});
		},

		prependNote(note, silent = false) {
			// サウンドを再生する
			if ((this as any).os.isEnableSounds && !silent) {
				const sound = new Audio(`${url}/assets/post.mp3`);
				sound.volume = localStorage.getItem('soundVolume') ? parseInt(localStorage.getItem('soundVolume'), 10) / 100 : 0.5;
				sound.play();
			}

			// Prepent a note
			this.notes.unshift(note);

			// オーバーフローしたら古い投稿は捨てる
			if (this.notes.length >= displayLimit) {
				this.notes = this.notes.slice(0, displayLimit);
			}
		},

		releaseQueue() {
			this.queue.forEach(n => this.prependNote(n, true));
			this.queue = [];
		},

		onNote(note) {
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
				this.prependNote(note);
			} else {
				this.queue.unshift(note);
			}
		},

		onChangeFollowing() {
			this.fetch();
		},

		focus() {
			(this.$refs.timeline as any).focus();
		},

		warp(date) {
			this.date = date;
			this.fetch();
		},

		onScroll() {
			if ((this as any).os.i.clientSettings.fetchOnScroll !== false) {
				const current = window.scrollY + window.innerHeight;
				if (current > document.body.offsetHeight - 8) this.more();
			}

			if (this.isScrollTop()) {
				this.releaseQueue();
			}
		},

		onKeydown(e) {
			if (e.target.tagName != 'INPUT' && e.target.tagName != 'TEXTAREA') {
				if (e.which == 84) { // t
					this.focus();
				}
			}
		},
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.mk-home-timeline
	> .newer-indicator
		position -webkit-sticky
		position sticky
		z-index 100
		height 3px
		background $theme-color

	> .mk-friends-maker
		border-bottom solid 1px #eee

	> .fetching
		padding 64px 0

	> .empty
		display block
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

</style>
