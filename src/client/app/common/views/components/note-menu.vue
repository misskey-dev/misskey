<template>
<div style="position:initial">
	<mk-menu :source="source" :compact="compact" :items="items" @closed="closed"/>
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
				text: '%i18n:@favorite%',
				action: this.favorite
			});
			if (this.note.userId == this.$store.state.i.id) {
				items.push({
					text: '%i18n:@pin%',
					action: this.pin
				});
				items.push({
					text: '%i18n:@delete%',
					action: this.del
				});
			}
			if (this.note.uri) {
				items.push({
					text: '%i18n:@remote%',
					action: () => {
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

		closed() {
			this.$nextTick(() => {
				this.$destroy();
			});
		}
	}
});
</script>
