<template>
<div style="position:initial">
	<mk-menu :source="source" :items="items" @closed="closed"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import copyToClipboard from '../../../common/scripts/copy-to-clipboard';
import { faExclamationCircle, faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons';
import { faSnowflake } from '@fortawesome/free-regular-svg-icons';

export default Vue.extend({
	i18n: i18n('common/views/components/user-menu.vue'),

	props: ['user', 'source'],

	data() {
		let menu = [{
			icon: ['fas', 'at'],
			text: this.$t('mention'),
			action: () => {
				this.$post({ mention: this.user });
			}
		}, null, {
			icon: ['fas', 'list'],
			text: this.$t('push-to-list'),
			action: this.pushList
		}, null, {
			icon: this.user.isMuted ? ['fas', 'eye'] : ['far', 'eye-slash'],
			text: this.user.isMuted ? this.$t('unmute') : this.$t('mute'),
			action: this.toggleMute
		}, {
			icon: 'ban',
			text: this.user.isBlocking ? this.$t('unblock') : this.$t('block'),
			action: this.toggleBlock
		}, null, {
			icon: faExclamationCircle,
			text: this.$t('report-abuse'),
			action: this.reportAbuse
		}];

		if (this.$store.getters.isSignedIn && (this.$store.state.i.isAdmin || this.$store.state.i.isModerator)) {
			menu = menu.concat([null, {
				icon: faMicrophoneSlash,
				text: this.user.isSilenced ? this.$t('unsilence') : this.$t('silence'),
				action: this.toggleSilence
			}, {
				icon: faSnowflake,
				text: this.user.isSuspended ? this.$t('unsuspend') : this.$t('suspend'),
				action: this.toggleSuspend
			}]);
		}

		return {
			items: menu
		};
	},

	methods: {
		closed() {
			this.$nextTick(() => {
				this.destroyDom();
			});
		},

		async pushList() {
			const t = this.$t('select-list'); // なぜか後で参照すると null になるので最初にメモリに確保しておく
			const lists = await this.$root.api('users/lists/list');
			const { canceled, result: listId } = await this.$root.dialog({
				type: null,
				title: t,
				select: {
					items: lists.map(list => ({
						value: list.id, text: list.title
					}))
				},
				showCancelButton: true
			});
			if (canceled) return;
			await this.$root.api('users/lists/push', {
				listId: listId,
				userId: this.user.id
			});
			this.$root.dialog({
				type: 'success',
				splash: true
			});
		},

		toggleMute() {
			if (this.user.isMuted) {
				this.$root.api('mute/delete', {
					userId: this.user.id
				}).then(() => {
					this.user.isMuted = false;
				}, () => {
					this.$root.dialog({
						type: 'error',
						text: e
					});
				});
			} else {
				this.$root.api('mute/create', {
					userId: this.user.id
				}).then(() => {
					this.user.isMuted = true;
				}, () => {
					this.$root.dialog({
						type: 'error',
						text: e
					});
				});
			}
		},

		toggleBlock() {
			if (this.user.isBlocking) {
				this.$root.api('blocking/delete', {
					userId: this.user.id
				}).then(() => {
					this.user.isBlocking = false;
				}, () => {
					this.$root.dialog({
						type: 'error',
						text: e
					});
				});
			} else {
				this.$root.api('blocking/create', {
					userId: this.user.id
				}).then(() => {
					this.user.isBlocking = true;
				}, () => {
					this.$root.dialog({
						type: 'error',
						text: e
					});
				});
			}
		},

		async reportAbuse() {
			const reported = this.$t('report-abuse-reported'); // なぜか後で参照すると null になるので最初にメモリに確保しておく
			const { canceled, result: comment } = await this.$root.dialog({
				title: this.$t('report-abuse-detail'),
				input: true
			});
			if (canceled) return;
			this.$root.api('users/report-abuse', {
				userId: this.user.id,
				comment: comment
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					text: reported
				});
			}, e => {
				this.$root.dialog({
					type: 'error',
					text: e
				});
			});
		},

		toggleSilence() {
			this.$root.api(this.user.isSilenced ? 'admin/unsilence-user' : 'admin/silence-user', {
				userId: this.user.id
			}).then(() => {
				this.user.isSilenced = !this.user.isSilenced;
				this.$root.dialog({
					type: 'success',
					splash: true
				});
			}, e => {
				this.$root.dialog({
					type: 'error',
					text: e
				});
			});
		},

		toggleSuspend() {
			this.$root.api(this.user.isSuspended ? 'admin/unsuspend-user' : 'admin/suspend-user', {
				userId: this.user.id
			}).then(() => {
				this.user.isSuspended = !this.user.isSuspended;
				this.$root.dialog({
					type: 'success',
					splash: true
				});
			}, e => {
				this.$root.dialog({
					type: 'error',
					text: e
				});
			});
		}
	}
});
</script>
