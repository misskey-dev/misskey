<template>
<div v-if="!fetching" class="kcthdwmv">
	<mk-note-detail :note="note"/>
	<footer>
		<router-link v-if="note.next" :to="note.next"><fa icon="angle-left"/> {{ $t('next') }}</router-link>
		<router-link v-if="note.prev" :to="note.prev">{{ $t('prev') }} <fa icon="angle-right"/></router-link>
	</footer>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import Progress from '../../../common/scripts/loading';

export default Vue.extend({
	i18n: i18n('desktop/views/pages/note.vue'),
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
.kcthdwmv
	text-align center

	> footer
		margin-top 16px

		> a
			display inline-block
			margin 0 16px

</style>
