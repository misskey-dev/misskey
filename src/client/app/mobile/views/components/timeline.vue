<template>
<div class="mk-timeline">
	<mk-friends-maker v-if="alone"/>

	<mk-notes ref="timeline" :more="existMore ? more : null">
		<div slot="empty">
			%fa:R comments%
			%i18n:@empty%
		</div>
	</mk-notes>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

const fetchLimit = 10;

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
			existMore: false,
			connection: null,
			connectionId: null
		};
	},

	computed: {
		alone(): boolean {
			return (this as any).os.i.followingCount == 0;
		}
	},

	mounted() {
		this.connection = (this as any).os.stream.getConnection();
		this.connectionId = (this as any).os.stream.use();

		this.connection.on('note', this.onNote);
		this.connection.on('follow', this.onChangeFollowing);
		this.connection.on('unfollow', this.onChangeFollowing);

		this.fetch();
	},

	beforeDestroy() {
		this.connection.off('note', this.onNote);
		this.connection.off('follow', this.onChangeFollowing);
		this.connection.off('unfollow', this.onChangeFollowing);
		(this as any).os.stream.dispose(this.connectionId);
	},

	methods: {
		fetch(cb?) {
			this.fetching = true;
			(this.$refs.timeline as any).init(() => new Promise((res, rej) => {
				(this as any).api('notes/timeline', {
					limit: fetchLimit + 1,
					includeMyRenotes: (this as any).os.i.clientSettings.showMyRenotes,
					includeRenotedMyNotes: (this as any).os.i.clientSettings.showRenotedMyNotes
				}).then(notes => {
					if (notes.length == fetchLimit + 1) {
						notes.pop();
						this.existMore = true;
					}
					res(notes);
					this.fetching = false;
					this.$emit('loaded');
					if (cb) cb();
				}, rej);
			}));
		},

		more() {
			this.moreFetching = true;
			(this as any).api('notes/timeline', {
				limit: fetchLimit + 1,
				untilId: (this.$refs.timeline as any).tail().id,
				includeMyRenotes: (this as any).os.i.clientSettings.showMyRenotes,
				includeRenotedMyNotes: (this as any).os.i.clientSettings.showRenotedMyNotes
			}).then(notes => {
				if (notes.length == fetchLimit + 1) {
					notes.pop();
				} else {
					this.existMore = false;
				}
				notes.forEach(n => (this.$refs.timeline as any).append(n));
				this.moreFetching = false;
			});
		},

		onNote(note) {
			// Prepend a note
			(this.$refs.timeline as any).prepend(note);
		},

		onChangeFollowing() {
			this.fetch();
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.mk-timeline
	> .mk-friends-maker
		margin-bottom 8px
</style>
