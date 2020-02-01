<template>
<x-menu :source="source" :items="items" @closed="closed"/>
</template>

<script lang="ts">
import Vue from 'vue';
import { faStar, faLink, faThumbtack, faExternalLinkSquareAlt } from '@fortawesome/free-solid-svg-icons';
import { faCopy, faTrashAlt, faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';
import i18n from '../i18n';
import { url } from '../config';
import copyToClipboard from '../scripts/copy-to-clipboard';
import XMenu from './menu.vue';

export default Vue.extend({
	i18n,
	components: {
		XMenu
	},
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
					icon: faCopy,
					text: this.$t('copyContent'),
					action: this.copyContent
				}, {
					icon: faLink,
					text: this.$t('copyLink'),
					action: this.copyLink
				}, this.note.uri ? {
					icon: faExternalLinkSquareAlt,
					text: this.$t('showOnRemote'),
					action: () => {
						window.open(this.note.uri, '_blank');
					}
				} : undefined,
				null,
				this.isFavorited ? {
					icon: faStar,
					text: this.$t('unfavorite'),
					action: () => this.toggleFavorite(false)
				} : {
					icon: faStar,
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
					icon: faThumbtack,
					text: this.$t('unpin'),
					action: () => this.togglePin(false)
				} : {
					icon: faThumbtack,
					text: this.$t('pin'),
					action: () => this.togglePin(true)
				} : undefined,
				...(this.note.userId == this.$store.state.i.id ? [
					null,
					{
						icon: faTrashAlt,
						text: this.$t('delete'),
						action: this.del
					}]
					: []
				)]
				.filter(x => x !== undefined);
			} else {
				return [{
					icon: faCopy,
					text: this.$t('copyContent'),
					action: this.copyContent
				}, {
					icon: faLink,
					text: this.$t('copyLink'),
					action: this.copyLink
				}, this.note.uri ? {
					icon: faExternalLinkSquareAlt,
					text: this.$t('showOnRemote'),
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
		copyContent() {
			copyToClipboard(this.note.text);
			this.$root.dialog({
				type: 'success',
				iconOnly: true, autoClose: true
			});
		},

		copyLink() {
			copyToClipboard(`${url}/notes/${this.note.id}`);
			this.$root.dialog({
				type: 'success',
				iconOnly: true, autoClose: true
			});
		},

		togglePin(pin: boolean) {
			this.$root.api(pin ? 'i/pin' : 'i/unpin', {
				noteId: this.note.id
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
				this.$emit('closed');
				this.destroyDom();
			}).catch(e => {
				if (e.id === '72dab508-c64d-498f-8740-a8eec1ba385a') {
					this.$root.dialog({
						type: 'error',
						text: this.$t('pinLimitExceeded')
					});
				}
			});
		},

		del() {
			this.$root.dialog({
				type: 'warning',
				text: this.$t('noteDeleteConfirm'),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;

				this.$root.api('notes/delete', {
					noteId: this.note.id
				}).then(() => {
					this.$emit('closed');
					this.destroyDom();
				});
			});
		},

		toggleFavorite(favorite: boolean) {
			this.$root.api(favorite ? 'notes/favorites/create' : 'notes/favorites/delete', {
				noteId: this.note.id
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
				this.$emit('closed');
				this.destroyDom();
			});
		},

		toggleWatch(watch: boolean) {
			this.$root.api(watch ? 'notes/watching/create' : 'notes/watching/delete', {
				noteId: this.note.id
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
				this.$emit('closed');
				this.destroyDom();
			});
		},

		closed() {
			this.$emit('closed');
			this.$nextTick(() => {
				this.destroyDom();
			});
		}
	}
});
</script>
