<template>
<mk-ui>
	<span slot="header">%fa:R sticky-note%%i18n:@title%</span>
	<main v-if="!fetching">
		<div>
			<mk-note-detail :note="note"/>
		</div>
		<footer>
			<a v-if="note.prev" :href="note.prev">%fa:angle-left% %i18n:@prev%</a>
			<a v-if="note.next" :href="note.next">%i18n:@next% %fa:angle-right%</a>
		</footer>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import Progress from '../../../common/scripts/loading';

export default Vue.extend({
	data() {
		return {
			fetching: true,
			note: null
		};
	},
	watch: {
		$route: 'fetch'
	},
	created() {
		this.fetch();
	},
	mounted() {
		document.title = 'Misskey';
	},
	methods: {
		fetch() {
			Progress.start();
			this.fetching = true;

			(this as any).api('notes/show', {
				noteId: this.$route.params.note
			}).then(note => {
				this.note = note;
				this.fetching = false;

				Progress.done();
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
main
	text-align center
	padding 8px

	@media (min-width 500px)
		padding 16px

	@media (min-width 600px)
		padding 32px

	> div
		margin 0 auto
		padding 0
		max-width 600px

	> footer
		margin-top 16px

		> a
			display inline-block
			margin 0 16px

</style>
