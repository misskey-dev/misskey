<template>
<div class="mk-user-timeline">
	<mk-notes :notes="notes">
		<div class="init" v-if="fetching">
			%fa:spinner .pulse%%i18n:common.loading%
		</div>
		<div class="empty" v-if="!fetching && notes.length == 0">
			%fa:R comments%
			{{ withMedia ? '%i18n:!@no-notes-with-media%' : '%i18n:!@no-notes%' }}
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
	props: ['user', 'withMedia'],
	data() {
		return {
			fetching: true,
			notes: [],
			existMore: false,
			moreFetching: false
		};
	},
	mounted() {
		(this as any).api('users/notes', {
			userId: this.user.id,
			withMedia: this.withMedia,
			limit: limit + 1
		}).then(notes => {
			if (notes.length == limit + 1) {
				notes.pop();
				this.existMore = true;
			}
			this.notes = notes;
			this.fetching = false;
			this.$emit('loaded');
		});
	},
	methods: {
		more() {
			this.moreFetching = true;
			(this as any).api('users/notes', {
				userId: this.user.id,
				withMedia: this.withMedia,
				limit: limit + 1,
				untilId: this.notes[this.notes.length - 1].id
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
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-user-timeline
	max-width 600px
	margin 0 auto
</style>
