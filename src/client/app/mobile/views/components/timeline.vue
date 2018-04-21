<template>
<div class="mk-timeline">
	<mk-friends-maker v-if="alone"/>
	<mk-notes :notes="notes">
		<div class="init" v-if="fetching">
			%fa:spinner .pulse%%i18n:common.loading%
		</div>
		<div class="empty" v-if="!fetching && notes.length == 0">
			%fa:R comments%
			%i18n:@empty%
		</div>
		<button v-if="!fetching && existMore" @click="more" :disabled="moreFetching" slot="tail">
			<span v-if="!moreFetching">%i18n:@load-more%</span>
			<span v-if="moreFetching">%i18n:common.loading%<mk-ellipsis/></span>
		</button>
	</mk-notes>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

const limit = 10;

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
			(this as any).api('notes/timeline', {
				limit: limit + 1,
				untilDate: this.date ? (this.date as any).getTime() : undefined,
				includeMyRenotes: (this as any).os.i.clientSettings.showMyRenotes,
				includeRenotedMyNotes: (this as any).os.i.clientSettings.showRenotedMyNotes
			}).then(notes => {
				if (notes.length == limit + 1) {
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
				limit: limit + 1,
				untilId: this.notes[this.notes.length - 1].id,
				includeMyRenotes: (this as any).os.i.clientSettings.showMyRenotes,
				includeRenotedMyNotes: (this as any).os.i.clientSettings.showRenotedMyNotes
			}).then(notes => {
				if (notes.length == limit + 1) {
					notes.pop();
					this.existMore = true;
				} else {
					this.existMore = false;
				}
				this.notes = this.notes.concat(notes);
				this.moreFetching = false;
			});
		},

		onNote(note) {
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

			this.notes.unshift(note);

			const isTop = window.scrollY > 8;
			if (isTop) this.notes.pop();
		},

		onChangeFollowing() {
			this.fetch();
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-friends-maker
	margin-bottom 8px
</style>
