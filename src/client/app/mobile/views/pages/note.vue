<template>
<mk-ui>
	<span slot="header">%fa:R sticky-note%%i18n:@title%</span>
	<main v-if="!fetching">
		<a v-if="note.next" :href="note.next">%fa:angle-up%%i18n:@next%</a>
		<div>
			<mk-note-detail :note="note"/>
		</div>
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
	mounted() {
		document.title = 'Misskey';
		document.documentElement.style.background = '#313a42';
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

	> div
		margin 8px auto
		padding 0
		max-width 500px
		width calc(100% - 16px)

		@media (min-width 500px)
			margin 16px auto
			width calc(100% - 32px)

	> a
		display inline-block

		&:first-child
			margin-top 8px

			@media (min-width 500px)
				margin-top 16px

		&:last-child
			margin-bottom 8px

			@media (min-width 500px)
				margin-bottom 16px

		> [data-fa]
			margin-right 4px

</style>
