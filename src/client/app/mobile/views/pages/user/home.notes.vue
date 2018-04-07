<template>
<div class="root notes">
	<p class="fetching" v-if="fetching">%fa:spinner .pulse .fw%%i18n:mobile.tags.mk-user-overview-notes.loading%<mk-ellipsis/></p>
	<div v-if="!fetching && notes.length > 0">
		<mk-note-card v-for="note in notes" :key="note.id" :note="note"/>
	</div>
	<p class="empty" v-if="!fetching && notes.length == 0">%i18n:mobile.tags.mk-user-overview-notes.no-notes%</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['user'],
	data() {
		return {
			fetching: true,
			notes: []
		};
	},
	mounted() {
		(this as any).api('users/notes', {
			userId: this.user.id
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
		color #aaa

		> i
			margin-right 4px

</style>
