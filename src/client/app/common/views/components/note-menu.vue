<template>
<div style="position:initial">
	<mk-menu :source="source" :compact="compact" :items="items" @closed="closed"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { url } from '../../../config';
import copyToClipboard from '../../../common/scripts/copy-to-clipboard';

export default Vue.extend({
	props: ['note', 'source', 'compact'],
	computed: {
		items() {
			const items = [{
				icon: '%fa:info-circle%',
				text: '%i18n:@detail%',
				action: this.detail
			}, {
				icon: '%fa:link%',
				text: '%i18n:@copy-link%',
				action: this.copyLink
			}, null, {
				icon: '%fa:star%',
				text: '%i18n:@favorite%',
				action: this.favorite
			}];

			if (this.note.userId == this.$store.state.i.id) {
				items.push({
					icon: '%fa:thumbtack%',
					text: '%i18n:@pin%',
					action: this.pin
				});
				items.push({
					icon: '%fa:trash-alt R%',
					text: '%i18n:@delete%',
					action: this.del
				});
			}
			if (this.note.uri) {
				items.push({
					icon: '%fa:external-link-square-alt%',
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
		detail() {
			this.$router.push(`/notes/${ this.note.id }`);
		},

		copyLink() {
			copyToClipboard(`${url}/notes/${ this.note.id }`);
		},

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
