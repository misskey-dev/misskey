<template>
<div class="mk-timeline">
	<div class="newer-indicator" :style="{ top: $store.state.uiHeaderHeight + 'px' }" v-show="queue.length > 0"></div>
	<mk-friends-maker v-if="alone"/>
	<mk-notes :notes="notes">
		<div class="init" v-if="fetching">
			%fa:spinner .pulse%%i18n:common.loading%
		</div>
		<div class="empty" v-if="!fetching && notes.length == 0">
			%fa:R comments%
			%i18n:@empty%
		</div>
		<button v-if="canFetchMore" @click="more" :disabled="moreFetching" slot="tail">
			<span v-if="!moreFetching">%i18n:@load-more%</span>
			<span v-if="moreFetching">%i18n:common.loading%<mk-ellipsis/></span>
		</button>
	</mk-notes>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

const fetchLimit = 10;
const displayLimit = 30;

export default Vue.extend({
	props: {
		date: {
			type: Date,
			required: false,
			default: null
		}
	},

	data() {
		return {
			fetching: true,
			moreFetching: false,
			notes: [],
			queue: [],
			existMore: false,
			connection: null,
			connectionId: null
		};
	},

	computed: {
		alone(): boolean {
			return (this as any).os.i.followingCount == 0;
		},

		canFetchMore(): boolean {
			return !this.moreFetching && !this.fetching && this.notes.length > 0 && this.existMore;
		}
	},

	mounted() {
		this.connection = (this as any).os.stream.getConnection();
		this.connectionId = (this as any).os.stream.use();

		this.connection.on('note', this.onNote);
		this.connection.on('follow', this.onChangeFollowing);
		this.connection.on('unfollow', this.onChangeFollowing);

		window.addEventListener('scroll', this.onScroll);

		this.fetch();
	},

	beforeDestroy() {
		this.connection.off('note', this.onNote);
		this.connection.off('follow', this.onChangeFollowing);
		this.connection.off('unfollow', this.onChangeFollowing);
		(this as any).os.stream.dispose(this.connectionId);

		window.removeEventListener('scroll', this.onScroll);
	},

	methods: {
		isScrollTop() {
			return window.scrollY <= 8;
		},

		fetch(cb?) {
			this.queue = [];
			this.fetching = true;
			(this as any).api('notes/timeline', {
				limit: fetchLimit + 1,
				untilDate: this.date ? (this.date as any).getTime() : undefined,
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
			this.moreFetching = true;
			(this as any).api('notes/timeline', {
				limit: fetchLimit + 1,
				untilId: this.notes[this.notes.length - 1].id,
				includeMyRenotes: (this as any).os.i.clientSettings.showMyRenotes,
				includeRenotedMyNotes: (this as any).os.i.clientSettings.showRenotedMyNotes
			}).then(notes => {
				if (notes.length == fetchLimit + 1) {
					notes.pop();
					this.existMore = true;
				} else {
					this.existMore = false;
				}
				this.notes = this.notes.concat(notes);
				this.moreFetching = false;
			});
		},

		prependNote(note) {
			// Prepent a note
			this.notes.unshift(note);

			// オーバーフローしたら古い投稿は捨てる
			if (this.notes.length >= displayLimit) {
				this.notes = this.notes.slice(0, displayLimit);
			}
		},

		releaseQueue() {
			this.queue.forEach(n => this.prependNote(n));
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

		onScroll() {
			if (this.isScrollTop()) {
				this.releaseQueue();
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.mk-timeline
	> .newer-indicator
		position -webkit-sticky
		position sticky
		z-index 100
		height 3px
		background $theme-color

	> .mk-friends-maker
		margin-bottom 8px
</style>
