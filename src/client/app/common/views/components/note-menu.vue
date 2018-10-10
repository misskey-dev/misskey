<template>
<div style="position:initial">
	<mk-menu :source="source" :compact="compact" :items="items" @closed="closed"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { url } from '../../../config';
import copyToClipboard from '../../../common/scripts/copy-to-clipboard';
import Ok from './ok.vue';

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
				if ((this.$store.state.i.pinnedNoteIds || []).includes(this.note.id)) {
					items.push({
						icon: '%fa:thumbtack%',
						text: '%i18n:@unpin%',
						action: this.unpin
					});
				} else {
					items.push({
						icon: '%fa:thumbtack%',
						text: '%i18n:@pin%',
						action: this.pin
					});
				}
			}

			if (this.note.userId == this.$store.state.i.id || this.$store.state.i.isAdmin) {
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
				this.destroyDom();
			});
		},

		unpin() {
			(this as any).api('i/unpin', {
				noteId: this.note.id
			}).then(() => {
				this.destroyDom();
			});
		},

		del() {
			if (!window.confirm('%i18n:@delete-confirm%')) return;
			(this as any).api('notes/delete', {
				noteId: this.note.id
			}).then(() => {
				this.destroyDom();
			});
		},

		favorite() {
			(this as any).api('notes/favorites/create', {
				noteId: this.note.id
			}).then(() => {
				(this as any).os.new(Ok);
				this.destroyDom();
			});
		},

		closed() {
			this.$nextTick(() => {
				this.destroyDom();
			});
		}
	}
});
</script>
