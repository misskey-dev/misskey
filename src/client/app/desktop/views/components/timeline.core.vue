<template>
<div class="mk-timeline-core">
	<mk-friends-maker v-if="src == 'home' && alone"/>
	<div class="fetching" v-if="fetching">
		<mk-ellipsis-icon/>
	</div>

	<mk-notes ref="timeline" :more="existMore ? more : null">
		<p :class="$style.empty" slot="empty">
			%fa:R comments%%i18n:@empty%
		</p>
	</mk-notes>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { HashtagStream } from '../../../common/scripts/streaming/hashtag';

const fetchLimit = 10;

export default Vue.extend({
	props: {
		src: {
			type: String,
			required: true
		},
		tagTl: {
			required: false
		}
	},

	data() {
		return {
			fetching: true,
			moreFetching: false,
			existMore: false,
			streamManager: null,
			connection: null,
			connectionId: null,
			date: null
		};
	},

	computed: {
		alone(): boolean {
			return this.$store.state.i.followingCount == 0;
		},

		endpoint(): string {
			switch (this.src) {
				case 'home': return 'notes/timeline';
				case 'local': return 'notes/local-timeline';
				case 'hybrid': return 'notes/hybrid-timeline';
				case 'global': return 'notes/global-timeline';
				case 'mentions': return 'notes/mentions';
				case 'tag': return 'notes/search_by_tag';
			}
		},

		canFetchMore(): boolean {
			return !this.moreFetching && !this.fetching && this.existMore;
		}
	},

	mounted() {
		if (this.src == 'tag') {
			this.connection = new HashtagStream((this as any).os, this.$store.state.i, this.tagTl.query);
			this.connection.on('note', this.onNote);
		} else if (this.src == 'home') {
			this.streamManager = (this as any).os.stream;
			this.connection = this.streamManager.getConnection();
			this.connectionId = this.streamManager.use();
			this.connection.on('note', this.onNote);
			this.connection.on('follow', this.onChangeFollowing);
			this.connection.on('unfollow', this.onChangeFollowing);
		} else if (this.src == 'local') {
			this.streamManager = (this as any).os.streams.localTimelineStream;
			this.connection = this.streamManager.getConnection();
			this.connectionId = this.streamManager.use();
			this.connection.on('note', this.onNote);
		} else if (this.src == 'hybrid') {
			this.streamManager = (this as any).os.streams.hybridTimelineStream;
			this.connection = this.streamManager.getConnection();
			this.connectionId = this.streamManager.use();
			this.connection.on('note', this.onNote);
		} else if (this.src == 'global') {
			this.streamManager = (this as any).os.streams.globalTimelineStream;
			this.connection = this.streamManager.getConnection();
			this.connectionId = this.streamManager.use();
			this.connection.on('note', this.onNote);
		} else if (this.src == 'mentions') {
			this.streamManager = (this as any).os.stream;
			this.connection = this.streamManager.getConnection();
			this.connectionId = this.streamManager.use();
			this.connection.on('mention', this.onNote);
		}

		document.addEventListener('keydown', this.onKeydown);

		this.fetch();
	},

	beforeDestroy() {
		if (this.src == 'tag') {
			this.connection.off('note', this.onNote);
			this.connection.close();
		} else if (this.src == 'home') {
			this.connection.off('note', this.onNote);
			this.connection.off('follow', this.onChangeFollowing);
			this.connection.off('unfollow', this.onChangeFollowing);
			this.streamManager.dispose(this.connectionId);
		} else if (this.src == 'local') {
			this.connection.off('note', this.onNote);
			this.streamManager.dispose(this.connectionId);
		} else if (this.src == 'hybrid') {
			this.connection.off('note', this.onNote);
			this.streamManager.dispose(this.connectionId);
		} else if (this.src == 'global') {
			this.connection.off('note', this.onNote);
			this.streamManager.dispose(this.connectionId);
		} else if (this.src == 'mentions') {
			this.connection.off('mention', this.onNote);
			this.streamManager.dispose(this.connectionId);
		}

		document.removeEventListener('keydown', this.onKeydown);
	},

	methods: {
		fetch() {
			this.fetching = true;

			(this.$refs.timeline as any).init(() => new Promise((res, rej) => {
				(this as any).api(this.endpoint, {
					limit: fetchLimit + 1,
					untilDate: this.date ? this.date.getTime() : undefined,
					includeMyRenotes: this.$store.state.settings.showMyRenotes,
					includeRenotedMyNotes: this.$store.state.settings.showRenotedMyNotes,
					includeLocalRenotes: this.$store.state.settings.showLocalRenotes,
					query: this.tagTl ? this.tagTl.query : undefined
				}).then(notes => {
					if (notes.length == fetchLimit + 1) {
						notes.pop();
						this.existMore = true;
					}
					res(notes);
					this.fetching = false;
					this.$emit('loaded');
				}, rej);
			}));
		},

		more() {
			if (!this.canFetchMore) return;

			this.moreFetching = true;

			const promise = (this as any).api(this.endpoint, {
				limit: fetchLimit + 1,
				untilId: (this.$refs.timeline as any).tail().id,
				includeMyRenotes: this.$store.state.settings.showMyRenotes,
				includeRenotedMyNotes: this.$store.state.settings.showRenotedMyNotes,
				includeLocalRenotes: this.$store.state.settings.showLocalRenotes,
				query: this.tagTl ? this.tagTl.query : undefined
			});

			promise.then(notes => {
				if (notes.length == fetchLimit + 1) {
					notes.pop();
				} else {
					this.existMore = false;
				}
				notes.forEach(n => (this.$refs.timeline as any).append(n));
				this.moreFetching = false;
			});

			return promise;
		},

		onNote(note) {
			// Prepend a note
			(this.$refs.timeline as any).prepend(note);
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

		onKeydown(e) {
			if (e.target.tagName != 'INPUT' && e.target.tagName != 'TEXTAREA') {
				if (e.which == 84) { // t
					this.focus();
				}
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.mk-timeline-core
	> .mk-friends-maker
		border-bottom solid 1px #eee

	> .fetching
		padding 64px 0

</style>

<style lang="stylus" module>
.empty
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
