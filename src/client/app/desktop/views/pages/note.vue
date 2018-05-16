<template>
<mk-ui>
	<main v-if="!fetching">
		<mk-note-detail :note="note"/>
		<footer>
			<router-link v-if="note.next" :to="note.next">%fa:angle-left% %i18n:@next%</router-link>
			<router-link v-if="note.prev" :to="note.prev">%i18n:@prev% %fa:angle-right%</router-link>
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
	padding 16px
	text-align center

	> footer
		margin-top 16px

		> a
			display inline-block
			margin 0 16px

	> .mk-note-detail
		margin 0 auto
		width 640px

</style>
