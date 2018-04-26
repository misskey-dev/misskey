<template>
<div class="mk-user-timeline">
	<mk-notes ref="timeline" :more="existMore ? more : null">
		<div slot="empty">
			%fa:R comments%
			{{ withMedia ? '%i18n:!@no-notes-with-media%' : '%i18n:!@no-notes%' }}
		</div>
	</mk-notes>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

const fetchLimit = 10;

export default Vue.extend({
	props: ['user', 'withMedia'],
	data() {
		return {
			fetching: true,
			existMore: false,
			moreFetching: false
		};
	},
	mounted() {
		this.fetch();
	},
	methods: {
		fetch() {
			this.fetching = true;
			(this.$refs.timeline as any).init(() => new Promise((res, rej) => {
				(this as any).api('users/notes', {
					userId: this.user.id,
					withMedia: this.withMedia,
					limit: fetchLimit + 1
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
			this.moreFetching = true;
			(this as any).api('users/notes', {
				userId: this.user.id,
				withMedia: this.withMedia,
				limit: fetchLimit + 1,
				untilId: (this.$refs.timeline as any).tail().id
			}).then(notes => {
				if (notes.length == fetchLimit + 1) {
					notes.pop();
				} else {
					this.existMore = false;
				}
				notes.forEach(n => (this.$refs.timeline as any).append(n));
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
