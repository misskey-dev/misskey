<template>
<div class="root notes">
	<p class="fetching" v-if="fetching"><fa icon="spinner" pulse fixed-width/>{{ $t('@.loading') }}<mk-ellipsis/></p>
	<div v-if="!fetching && notes.length > 0">
		<mk-note-card v-for="note in notes" :key="note.id" :note="note"/>
	</div>
	<p class="empty" v-if="!fetching && notes.length == 0">{{ $t('@.no-notes') }}</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
export default Vue.extend({
	i18n: i18n('mobile/views/pages/user/home.notes.vue'),
	props: ['user'],
	data() {
		return {
			fetching: true,
			notes: []
		};
	},
	mounted() {
		this.$root.api('users/notes', {
			userId: this.user.id,
			untilDate: new Date().getTime() + 1000 * 86400 * 365
		}).then(notes => {
			this.notes = notes;
			this.fetching = false;
		});
	}
});
</script>

<style lang="stylus" scoped>
.root.notes

	> div
		overflow-x scroll
		-webkit-overflow-scrolling touch
		white-space nowrap
		padding 8px

		> *
			vertical-align top

			&:not(:last-child)
				margin-right 8px

	> .fetching
	> .empty
		margin 0
		padding 16px
		text-align center
		color var(--text)

		> i
			margin-right 4px

</style>
