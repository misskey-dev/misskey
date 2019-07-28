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
import { faCopy, faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';

export default Vue.extend({
	i18n: i18n('common/views/components/note-menu.vue'),
	props: ['note', 'source'],
	data() {
		return {
			isFavorited: false,
			isWatching: false
		};
	},
	computed: {
		items(): any[] {
			if (this.$store.getters.isSignedIn) {
				return [{
					icon: 'at',
					text: this.$t('mention'),
					action: this.mention
				}, null, {
					icon: 'info-circle',
					text: this.$t('detail'),
					action: this.detail
				}, {
					icon: faCopy,
					text: this.$t('copy-content'),
					action: this.copyContent
				}, {
					icon: 'link',
					text: this.$t('copy-link'),
					action: this.copyLink
				}, this.note.uri ? {
					icon: 'external-link-square-alt',
					text: this.$t('remote'),
					action: () => {
						window.open(this.note.uri, '_blank');
					}
				} : undefined,
				null,
				this.isFavorited ? {
					icon: 'star',
					text: this.$t('unfavorite'),
					action: () => this.toggleFavorite(false)
				} : {
					icon: 'star',
					text: this.$t('favorite'),
					action: () => this.toggleFavorite(true)
				},
				this.note.userId != this.$store.state.i.id ? this.isWatching ? {
					icon: faEyeSlash,
					text: this.$t('unwatch'),
					action: () => this.toggleWatch(false)
				} : {
					icon: faEye,
					text: this.$t('watch'),
					action: () => this.toggleWatch(true)
				} : undefined,
				this.note.userId == this.$store.state.i.id ? (this.$store.state.i.pinnedNoteIds || []).includes(this.note.id) ? {
					icon: 'thumbtack',
					text: this.$t('unpin'),
					action: () => this.togglePin(false)
				} : {
					icon: 'thumbtack',
					text: this.$t('pin'),
					action: () => this.togglePin(true)
				} : undefined,
				...(this.note.userId == this.$store.state.i.id || this.$store.state.i.isAdmin || this.$store.state.i.isModerator ? [
					null,
					this.note.userId == this.$store.state.i.id ? {
						icon: 'undo-alt',
						text: this.$t('delete-and-edit'),
						action: this.deleteAndEdit
					} : undefined,
					{
						icon: ['far', 'trash-alt'],
						text: this.$t('delete'),
						action: this.del
					}]
					: []
				)]
				.filter(x => x !== undefined);
			} else {
				return [{
					icon: 'info-circle',
					text: this.$t('detail'),
					action: this.detail
				}, {
					icon: faCopy,
					text: this.$t('copy-content'),
					action: this.copyContent
				}, {
					icon: 'link',
					text: this.$t('copy-link'),
					action: this.copyLink
				}, this.note.uri ? {
					icon: 'external-link-square-alt',
					text: this.$t('remote'),
					action: () => {
						window.open(this.note.uri, '_blank');
					}
				} : undefined]
				.filter(x => x !== undefined);
			}
		}
	},

	created() {
		this.$root.api('notes/state', {
			noteId: this.note.id
		}).then(state => {
			this.isFavorited = state.isFavorited;
			this.isWatching = state.isWatching;
		});
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

		togglePin(pin: boolean) {
			this.$root.api(pin ? 'i/pin' : 'i/unpin', {
				noteId: this.note.id
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					splash: true
				});
				this.destroyDom();
			}).catch(e => {
				if (e.id === '72dab508-c64d-498f-8740-a8eec1ba385a') {
					this.$root.dialog({
						type: 'error',
						text: this.$t('pin-limit-exceeded')
					});
				}
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

		deleteAndEdit() {
			this.$root.dialog({
				type: 'warning',
				text: this.$t('delete-and-edit-confirm'),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;
				this.$root.api('notes/delete', {
					noteId: this.note.id
				}).then(() => {
					this.destroyDom();
				});
				this.$post({
					initialNote: this.note,
					reply: this.note.reply,
				});
			});
		},

		toggleFavorite(favorite: boolean) {
			this.$root.api(favorite ? 'notes/favorites/create' : 'notes/favorites/delete', {
				noteId: this.note.id
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					splash: true
				});
				this.destroyDom();
			});
		},

		toggleWatch(watch: boolean) {
			this.$root.api(watch ? 'notes/watching/create' : 'notes/watching/delete', {
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
