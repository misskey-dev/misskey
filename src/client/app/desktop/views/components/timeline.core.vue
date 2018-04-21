<template>
<div class="mk-home-timeline">
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

export default Vue.extend({
	props: {
		src: {
			type: String,
			required: true
		}
	},

	data() {
		return {
			prevFetching: false,
			fetching: true,
			moreFetching: false,
			existMore: false,
			prevNotes: [],
			notes: [],
			moreNotes: [],
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

		this.fetch();
	},

	beforeDestroy() {
		this.connection.off('note', this.onNote);
		if (this.src == 'home') {
			this.connection.off('follow', this.onChangeFollowing);
			this.connection.off('unfollow', this.onChangeFollowing);
		}

		this.stream.dispose(this.connectionId);
	},

	methods: {
		fetch(cb?) {
			this.fetching = true;
			this.prevNotes = [];
			this.moreNotes = [];
			(this as any).api(this.endpoint, {
				limit: 11,
				untilDate: this.date ? this.date.getTime() : undefined
			}).then(notes => {
				if (notes.length == 11) {
					notes.pop();
					this.existMore = true;
				}
				this.notes = notes;
				this.fetching = false;
				this.$emit('loaded');
				if (cb) cb();
			});
		},

		prev() {
			if (this.moreFetching || this.prevFetching || this.fetching || this.notes.length == 0 || this.prevNotes.length == 0) return;
			this.prevFetching = true;
			const heightBefore = document.body.offsetHeight;

			this.notes = this.prevNotes.slice(-20).concat(this.notes);
			this.prevNotes = this.prevNotes.slice(0, -20);
			
			this.$nextTick(() => {
				// スクロールしてあげる
				window.scrollTo(0, window.scrollY + document.body.offsetHeight - heightBefore);

				// もし50投稿より多くタイムラインに表示されていたら
				if (this.notes.length > 50) {
					// 30個残してキャッシュする
					this.moreNotes = this.notes.slice(30).concat(this.moreNotes);
					this.notes = this.notes.slice(0, 30);
					this.existMore = true;
				}
				this.prevFetching = false;
			});
		},

		more() {
			if (this.moreFetching || this.prevFetching || this.fetching || this.notes.length == 0 || !this.existMore) return;
			this.moreFetching = true;
			if (this.moreNotes.length > 0) {
				this.notes = this.notes.concat(this.moreNotes.slice(0, 10));
				this.moreNotes = this.moreNotes.slice(10);
				this.moreFetching = false;
			} else {
				(this as any).api(this.endpoint, {
					limit: 11,
					untilId: this.notes[this.notes.length - 1].id
				}).then(notes => {
					if (notes.length == 11) {
						notes.pop();
					} else {
						this.existMore = false;
					}
					this.notes = this.notes.concat(notes);
					this.moreFetching = false;
				});
			}
		},

		onNote(note) {
			// サウンドを再生する
			if ((this as any).os.isEnableSounds) {
				const sound = new Audio(`${url}/assets/post.mp3`);
				sound.volume = localStorage.getItem('soundVolume') ? parseInt(localStorage.getItem('soundVolume'), 10) / 100 : 0.5;
				sound.play();
			}
			if (!this.date) {
				if (window.scrollY < 100 && this.prevNotes.length == 0) {
					this.notes.unshift(note);
					this.moreNotes.unshift(this.notes[this.notes.length - 1]);
					this.notes.pop();
				} else {
					this.prevNotes.unshift(note);
				}
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
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-home-timeline
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
