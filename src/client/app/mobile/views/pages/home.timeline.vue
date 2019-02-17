<template>
<div>
	<mk-friends-maker v-if="src == 'home' && alone" style="margin-bottom:8px"/>

	<mk-notes ref="timeline" :more="existMore ? more : null">
		<div slot="empty">
			<fa :icon="['far', 'comments']"/>{{ $t('empty') }}
		</div>
	</mk-notes>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

const fetchLimit = 10;

export default Vue.extend({
	i18n: i18n('mobile/views/pages/home.timeline.vue'),
	
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
			unreadCount: 0,
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
			this.connection = this.$root.stream.connectToChannel('hashtag', { q: this.tagTl.query });
			this.connection.on('note', prepend);
		} else if (this.src == 'home') {
			this.endpoint = 'notes/timeline';
			const onChangeFollowing = () => {
				this.fetch();
			};
			this.connection = this.$root.stream.useSharedConnection('homeTimeline');
			this.connection.on('note', prepend);
			this.connection.on('follow', onChangeFollowing);
			this.connection.on('unfollow', onChangeFollowing);
		} else if (this.src == 'local') {
			this.endpoint = 'notes/local-timeline';
			this.connection = this.$root.stream.useSharedConnection('localTimeline');
			this.connection.on('note', prepend);
		} else if (this.src == 'hybrid') {
			this.endpoint = 'notes/hybrid-timeline';
			this.connection = this.$root.stream.useSharedConnection('hybridTimeline');
			this.connection.on('note', prepend);
		} else if (this.src == 'global') {
			this.endpoint = 'notes/global-timeline';
			this.connection = this.$root.stream.useSharedConnection('globalTimeline');
			this.connection.on('note', prepend);
		} else if (this.src == 'mentions') {
			this.endpoint = 'notes/mentions';
			this.connection = this.$root.stream.useSharedConnection('main');
			this.connection.on('mention', prepend);
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
			this.connection = this.$root.stream.useSharedConnection('main');
			this.connection.on('mention', onNote);
		}

		this.fetch();
	},

	beforeDestroy() {
		this.connection.dispose();
	},

	methods: {
		fetch() {
			this.fetching = true;

			(this.$refs.timeline as any).init(() => new Promise((res, rej) => {
				this.$root.api(this.endpoint, Object.assign({
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

			const promise = this.$root.api(this.endpoint, Object.assign({
				limit: fetchLimit + 1,
				untilId: (this.$refs.timeline as any).tail().id
			}, this.baseQuery, this.query));

			promise.then(notes => {
				if (notes.length == fetchLimit + 1) {
					notes.pop();
				} else {
					this.existMore = false;
				}
				for (const n of notes) {
					(this.$refs.timeline as any).append(n);
				}
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
