<template>
<div style="position:initial">
	<mk-menu :source="source" :items="items" @closed="closed"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { url } from '../../../config';
import copyToClipboard from '../../../common/scripts/copy-to-clipboard';
import { concat, intersperse } from '../../../../../prelude/array';
import { faCopy } from '@fortawesome/free-regular-svg-icons';

export default Vue.extend({
	i18n: i18n('common/views/components/note-menu.vue'),
	props: ['note', 'source'],
	computed: {
		items(): any[] {
			return concat(intersperse([null], [
				[
					[{
						icon: 'at',
						text: this.$t('mention'),
						action: this.mention
					}]
				],
				[
					[{
						icon: 'info-circle',
						text: this.$t('detail'),
						action: this.detail
					}], [{
						icon: faCopy,
						text: this.$t('copy-content'),
						action: this.copyContent
					}], [{
						icon: 'link',
						text: this.$t('copy-link'),
						action: this.copyLink
					}], this.note.uri ? [{
						icon: 'external-link-square-alt',
						text: this.$t('remote'),
						action: () => {
							window.open(this.note.uri, '_blank');
						}
					}] : []
				],
				[
					this.note.isFavorited ? [{
						icon: 'star',
						text: this.$t('unfavorite'),
						action: this.unfavorite
					}] : [{
						icon: 'star',
						text: this.$t('favorite'),
						action: this.favorite
					}], this.note.userId == this.$store.state.i.id ? [
						(this.$store.state.i.pinnedNoteIds || []).includes(this.note.id) ? {
							icon: 'thumbtack',
							text: this.$t('unpin'),
							action: this.unpin
						} : {
								icon: 'thumbtack',
								text: this.$t('pin'),
								action: this.pin
							}
					] : []
				], [
					this.note.userId == this.$store.state.i.id || this.$store.state.i.isAdmin || this.$store.state.i.isModerator ? [{
						icon: ['far', 'trash-alt'],
						text: this.$t('delete'),
						action: this.del
					}] : []
				]
			].map(concat).filter(x => x.length > 0)));
		}
	},

	methods: {
		mention() {
			this.$post({ mention: this.note.user });
		},

		detail() {
			this.$router.push(`/notes/${this.note.id}`);
		},

		copyContent() {
			copyToClipboard(this.note.text);
			this.$root.dialog({
				type: 'success',
				splash: true
			});
		},

		copyLink() {
			copyToClipboard(`${url}/notes/${this.note.id}`);
			this.$root.dialog({
				type: 'success',
				splash: true
			});
		},

		pin() {
			this.$root.api('i/pin', {
				noteId: this.note.id
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					splash: true
				});
				this.destroyDom();
			});
		},

		unpin() {
			this.$root.api('i/unpin', {
				noteId: this.note.id
			}).then(() => {
				this.destroyDom();
			});
		},

		del() {
			this.$root.dialog({
				type: 'warning',
				text: this.$t('delete-confirm'),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;

				this.$root.api('notes/delete', {
					noteId: this.note.id
				}).then(() => {
					this.destroyDom();
				});
			});
		},

		favorite() {
			this.$root.api('notes/favorites/create', {
				noteId: this.note.id
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					splash: true
				});
				this.destroyDom();
			});
		},

		unfavorite() {
			this.$root.api('notes/favorites/delete', {
				noteId: this.note.id
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					splash: true
				});
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
