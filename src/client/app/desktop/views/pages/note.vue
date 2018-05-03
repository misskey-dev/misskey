<template>
<mk-ui>
	<main v-if="!fetching">
		<a v-if="note.next" :href="note.next">%fa:angle-up%%i18n:@next%</a>
		<mk-note-detail :note="note"/>
		<a v-if="note.prev" :href="note.prev">%fa:angle-down%%i18n:@prev%</a>
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

	> a
		display inline-block

		&:first-child
			margin-bottom 4px

		&:last-child
			margin-top 4px

		> [data-fa]
			margin-right 4px

	> .mk-note-detail
		margin 0 auto
		width 640px

</style>
