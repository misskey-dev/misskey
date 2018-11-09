<template>
<mk-ui>
	<span slot="header"><span style="margin-right:4px;"><fa :icon="['far', 'sticky-note']"/></span>{{ $t('title') }}</span>
	<main v-if="!fetching">
		<div>
			<mk-note-detail :note="note"/>
		</div>
		<footer>
			<router-link v-if="note.prev" :to="note.prev"><fa icon="angle-left"/> {{ $t('prev') }}</router-link>
			<router-link v-if="note.next" :to="note.next">{{ $t('next') }} <fa icon="angle-right"/></router-link>
		</footer>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import Progress from '../../../common/scripts/loading';

export default Vue.extend({
	i18n: i18n('mobile/views/pages/note.vue'),
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
		document.title = this.$root.instanceName;
	},
	methods: {
		fetch() {
			Progress.start();
			this.fetching = true;

			this.$root.api('notes/show', {
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
