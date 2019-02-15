<template>
<div class="glowckho" v-if="!fetching">
	<sequential-entrance animation="entranceFromTop" delay="25">
		<template v-for="note in notes">
			<mk-note-detail class="post" :note="note" :key="note.id"/>
		</template>
	</sequential-entrance>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import Progress from '../../../common/scripts/loading';

export default Vue.extend({
	data() {
		return {
			fetching: true,
			notes: [],
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
				this.notes = notes;
				this.fetching = false;

				Progress.done();
			});
		},
	}
});
</script>

<style lang="stylus" scoped>
.glowckho
	margin 0 auto

	> * > .post
		margin-bottom 16px

	> .more
		margin 32px 16px 16px 16px
		text-align center

</style>
