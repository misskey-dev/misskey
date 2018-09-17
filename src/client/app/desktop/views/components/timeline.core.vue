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
			date: null,
			baseQuery: {
				includeMyRenotes: this.$store.state.settings.showMyRenotes,
				includeRenotedMyNotes: this.$store.state.settings.showRenotedMyNotes,
				includeLocalRenotes: this.$store.state.settings.showLocalRenotes
			},
			query: {},
			endpoint: null
		};
	},

	computed: {
		alone(): boolean {
			return this.$store.state.i.followingCount == 0;
		},

		canFetchMore(): boolean {
			return !this.moreFetching && !this.fetching && this.existMore;
		}
	},

	mounted() {
		const prepend = note => {
			(this.$refs.timeline as any).prepend(note);
		};

		if (this.src == 'tag') {
			this.endpoint = 'notes/search_by_tag';
			this.query = {
				query: this.tagTl.query
			};
			this.connection = new HashtagStream((this as any).os, this.$store.state.i, this.tagTl.query);
			this.connection.on('note', prepend);
			this.$once('beforeDestroy', () => {
				this.connection.off('note', prepend);
				this.connection.close();
			});
		} else if (this.src == 'home') {
			this.endpoint = 'notes/timeline';
			const onChangeFollowing = () => {
				this.fetch();
			};
			this.streamManager = (this as any).os.stream;
			this.connection = this.streamManager.getConnection();
			this.connectionId = this.streamManager.use();
			this.connection.on('note', prepend);
			this.connection.on('follow', onChangeFollowing);
			this.connection.on('unfollow', onChangeFollowing);
			this.$once('beforeDestroy', () => {
				this.connection.off('note', prepend);
				this.connection.off('follow', onChangeFollowing);
				this.connection.off('unfollow', onChangeFollowing);
				this.streamManager.dispose(this.connectionId);
			});
		} else if (this.src == 'local') {
			this.endpoint = 'notes/local-timeline';
			this.streamManager = (this as any).os.streams.localTimelineStream;
			this.connection = this.streamManager.getConnection();
			this.connectionId = this.streamManager.use();
			this.connection.on('note', prepend);
			this.$once('beforeDestroy', () => {
				this.connection.off('note', prepend);
				this.streamManager.dispose(this.connectionId);
			});
		} else if (this.src == 'hybrid') {
			this.endpoint = 'notes/hybrid-timeline';
			this.streamManager = (this as any).os.streams.hybridTimelineStream;
			this.connection = this.streamManager.getConnection();
			this.connectionId = this.streamManager.use();
			this.connection.on('note', prepend);
			this.$once('beforeDestroy', () => {
				this.connection.off('note', prepend);
				this.streamManager.dispose(this.connectionId);
			});
		} else if (this.src == 'global') {
			this.endpoint = 'notes/global-timeline';
			this.streamManager = (this as any).os.streams.globalTimelineStream;
			this.connection = this.streamManager.getConnection();
			this.connectionId = this.streamManager.use();
			this.connection.on('note', prepend);
			this.$once('beforeDestroy', () => {
				this.connection.off('note', prepend);
				this.streamManager.dispose(this.connectionId);
			});
		} else if (this.src == 'mentions') {
			this.endpoint = 'notes/mentions';
			this.streamManager = (this as any).os.stream;
			this.connection = this.streamManager.getConnection();
			this.connectionId = this.streamManager.use();
			this.connection.on('mention', prepend);
			this.$once('beforeDestroy', () => {
				this.connection.off('mention', prepend);
				this.streamManager.dispose(this.connectionId);
			});
		} else if (this.src == 'messages') {
			this.endpoint = 'notes/mentions';
			this.query = {
				visibility: 'specified'
			};
			const onNote = note => {
				if (note.visibility == 'specified') {
					prepend(note);
				}
			};
			this.streamManager = (this as any).os.stream;
			this.connection = this.streamManager.getConnection();
			this.connectionId = this.streamManager.use();
			this.connection.on('mention', onNote);
			this.$once('beforeDestroy', () => {
				this.connection.off('mention', onNote);
				this.streamManager.dispose(this.connectionId);
			});
		}

		this.fetch();
	},

	beforeDestroy() {
		this.$emit('beforeDestroy');
	},

	methods: {
		fetch() {
			this.fetching = true;

			(this.$refs.timeline as any).init(() => new Promise((res, rej) => {
				(this as any).api(this.endpoint, Object.assign({
					limit: fetchLimit + 1,
					untilDate: this.date ? this.date.getTime() : undefined
				}, this.baseQuery, this.query)).then(notes => {
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

			const promise = (this as any).api(this.endpoint, Object.assign({
				limit: fetchLimit + 1,
				untilId: (this.$refs.timeline as any).tail().id
			}, this.baseQuery, this.query));

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
