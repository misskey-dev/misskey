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
			prevFetching: false,
			prevNotes: [],
			notes: [],
			moreNotes: [],
			existPrev: false,
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

		window.addEventListener('scroll', this.onScroll);
		this.fetch();
	},
	beforeDestroy() {
		this.connection.off('note', this.onNote);
		this.connection.off('follow', this.onChangeFollowing);
		this.connection.off('unfollow', this.onChangeFollowing);

		window.removeEventListener('scroll', this.onScroll);
		(this as any).os.stream.dispose(this.connectionId);
	},
	methods: {
		fetch(cb?) {
			this.fetching = true;
			this.prevNotes = [];
			this.moreNotes = [];
			(this as any).api('notes/timeline', {
				limit: limit + 1,
				untilDate: this.date ? (this.date as any).getTime() : undefined
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

		async prev() {
			if (this.moreFetching || this.prevFetching || this.fetching || this.notes.length == 0) return;
			this.prevFetching = true;

			if (this.prevNotes.length > 0) {
				this.notes = this.prevNotes.concat(this.notes);
				this.prevNotes = []
			} else {
				await (this as any).api(this.endpoint, {
					limit: 11,
					sinceId: this.notes[0].id
				}).then(notes => {
					if (notes.length == 0) {
						this.prevFetching = false;
						this.existPrev = false;
						return;
					} else if (notes.length == 11) {
						this.existPrev = true;
						notes.shift();
					} else {
						this.existPrev = false;
					}
					this.notes = notes.concat(this.notes);
				});
			}
			if (this.notes.length > 30) {
				this.moreNotes = this.notes.slice(-10).concat(this.moreNotes);
				this.existMore = true;
				// 200までたまったら150に減らす
				if (this.moreNotes.length > 200) this.moreNotes = this.moreNotes.slice(0,150);
				this.notes = this.notes.slice(0,-10);
			}
			this.prevFetching = false;
		},
	
		async more() {
			if (this.moreFetching || this.prevFetching || this.fetching || this.notes.length == 0 || !this.existMore) return;
			this.moreFetching = true;
			if (this.moreNotes.length > 0) {
				if (this.moreNotes.length < 10) {
					this.notes = this.notes.concat(this.moreNotes);
					this.moreNotes = [];
					this.existMore = true;
				} else {
					this.notes = this.notes.concat(this.moreNotes.slice(0,10));
					this.moreNotes = this.moreNotes.slice(10);
					this.existMore = true;
				}
			} else {
				await (this as any).api(this.endpoint, {
					limit: 11,
					untilId: this.notes[this.notes.length - 1].id
				}).then(notes => {
					if (notes.length == 11) {
						notes.pop();
					} else if (notes.length == 0) {
						return;
						this.existMore = false;
					} else {
						this.existMore = false;
					}
					this.notes = this.notes.concat(notes);
					this.moreFetching = false;
				});
			}
		},

		onNote(note) {
			if (!this.date) {
				if (window.scrollY < 100 && !this.existPrev) {
					this.notes.unshift(note);
					this.moreNotes.unshift(this.notes[this.notes.length - 1]);
					this.notes.pop();
				} else {
					this.prevNotes.unshift(note)
				}
			}
		},
		onChangeFollowing() {
			this.fetch();
		},
		onScroll() {
			if (window.scrollY < 100) {
				this.prev();
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-friends-maker
	margin-bottom 8px
</style>
