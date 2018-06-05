<template>
<div class="mk-note-menu" style="position:initial">
	<mk-menu ref="menu" :source="source" :compact="compact" :items="items" @closed="$destroy"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['note', 'source', 'compact'],
	computed: {
		items() {
			const items = [];
			items.push({
				content: '%i18n:@favorite%',
				onClick: this.favorite
			});
			if (this.note.userId == this.$store.state.i.id) {
				items.push({
					content: '%i18n:@pin%',
					onClick: this.pin
				});
				items.push({
					content: '%i18n:@delete%',
					onClick: this.del
				});
			}
			if (this.note.uri) {
				items.push({
					content: '%i18n:@remote%',
					onClick: () => {
						window.open(this.note.uri, '_blank');
					}
				});
			}
			return items;
		}
	},
	methods: {
		pin() {
			(this as any).api('i/pin', {
				noteId: this.note.id
			}).then(() => {
				this.$destroy();
			});
		},

		del() {
			if (!window.confirm('%i18n:@delete-confirm%')) return;
			(this as any).api('notes/delete', {
				noteId: this.note.id
			}).then(() => {
				this.$destroy();
			});
		},

		favorite() {
			(this as any).api('notes/favorites/create', {
				noteId: this.note.id
			}).then(() => {
				this.$destroy();
			});
		},

		close() {
			this.$refs.menu.close();
		}
	}
});
</script>
