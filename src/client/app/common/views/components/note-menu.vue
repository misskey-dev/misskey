<template>
<div style="position:initial">
	<mk-menu :source="source" :compact="compact" :items="items" @closed="closed"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { url } from '../../../config';
import copyToClipboard from '../../../common/scripts/copy-to-clipboard';
import Ok from './ok.vue';

export default Vue.extend({
	i18n: i18n('common/views/components/note-menu.vue'),
	props: ['note', 'source', 'compact'],
	computed: {
		items() {
			const items = [{
				icon: 'info-circle',
				text: this.$t('detail'),
				action: this.detail
			}, {
				icon: 'link',
				text: this.$t('copy-link'),
				action: this.copyLink
			}];

			if (this.note.uri) {
				items.push({
					icon: 'external-link-square-alt',
					text: this.$t('remote'),
					action: () => {
						window.open(this.note.uri, '_blank');
					}
				});
			}

			items.push(null);

			if (this.note.isFavorited) {
				items.push({
					icon: 'star',
					text: this.$t('unfavorite'),
					action: this.unfavorite
				});
			} else {
				items.push({
					icon: 'star',
					text: this.$t('favorite'),
					action: this.favorite
				});
			}

			if (this.note.userId == this.$store.state.i.id) {
				if ((this.$store.state.i.pinnedNoteIds || []).includes(this.note.id)) {
					items.push({
						icon: 'thumbtack',
						text: this.$t('unpin'),
						action: this.unpin
					});
				} else {
					items.push({
						icon: 'thumbtack',
						text: this.$t('pin'),
						action: this.pin
					});
				}
			}

			if (this.note.userId == this.$store.state.i.id || this.$store.state.i.isAdmin) {
				items.push(null);
				items.push({
					icon: ['far', 'trash-alt'],
					text: this.$t('delete'),
					action: this.del
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
				(this as any).os.new(Ok);
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
			if (!window.confirm(this.$t('delete-confirm'))) return;
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

		unfavorite() {
			(this as any).api('notes/favorites/delete', {
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
