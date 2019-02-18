<template>
<mk-ui>
	<template #header><span style="margin-right:4px;"><fa :icon="faNewspaper"/></span>{{ $t('@.featured-notes') }}</template>

	<main>
		<sequential-entrance animation="entranceFromTop" delay="25">
			<template v-for="note in notes">
				<mk-note-detail class="post" :note="note" :key="note.id"/>
			</template>
		</sequential-entrance>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import Progress from '../../../common/scripts/loading';
import { faNewspaper } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
	i18n: i18n(''),
	data() {
		return {
			fetching: true,
			notes: [],
			faNewspaper
		};
	},
	created() {
		this.fetch();
	},
	methods: {
		fetch() {
			Progress.start();
			this.fetching = true;

			this.$root.api('notes/featured', {
				limit: 20
			}).then(notes => {
				notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
				this.notes = notes;
				this.fetching = false;

				Progress.done();
			});
		},
	}
});
</script>

<style lang="stylus" scoped>
main
	> * > .post
		margin-bottom 8px

	@media (min-width 500px)
		> * > .post
			margin-bottom 16px

</style>
