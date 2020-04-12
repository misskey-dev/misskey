<template>
<x-modal ref="modal" @closed="() => { $emit('closed'); destroyDom(); }">
	<div class="vrcsvlkm">
		<div class="header">
			<span class="title">
				<mk-avatar class="avatar" :user="user"/>
				<mk-user-name class="name" :user="user"/>
				<span class="acct">@{{ user | acct }}</span>
				<span class="staff" v-if="user.isAdmin"><fa :icon="faBookmark"/></span>
				<span class="staff" v-if="user.isModerator"><fa :icon="farBookmark"/></span>
				<span class="punished" v-if="user.isSilenced"><fa :icon="faMicrophoneSlash"/></span>
				<span class="punished" v-if="user.isSuspended"><fa :icon="faSnowflake"/></span>
			</span>
			<button class="_button" @click="close()"><fa :icon="faTimes"/></button>
		</div>
		<div class="actions">
			<div style="flex: 1; padding-left: 1em;">
				<mk-switch v-if="user.host == null && $store.state.i.isAdmin && (this.moderator || !user.isAdmin)" @change="toggleModerator()" v-model="moderator">{{ $t('moderator') }}</mk-switch>
				<mk-switch @change="toggleSilence()" v-model="silenced">{{ $t('silence') }}</mk-switch>
				<mk-switch @change="toggleSuspend()" v-model="suspended">{{ $t('suspend') }}</mk-switch>
			</div>
			<div style="flex: 1; padding-left: 1em;">
				<mk-button @click="openProfile"><fa :icon="faExternalLinkSquareAlt"/> {{ $t('profile')}}</mk-button>
				<mk-button v-if="user.host != null" @click="updateRemoteUser"><fa :icon="faSync"/> {{ $t('updateRemoteUser') }}</mk-button>
				<mk-button @click="resetPassword"><fa :icon="faKey"/> {{ $t('resetPassword') }}</mk-button>
				<mk-button @click="deleteAllFiles"><fa :icon="faTrashAlt"/> {{ $t('deleteAllFiles') }}</mk-button>
			</div>
		</div>
		<div class="rawdata" v-if="info">
			<pre><code>{{ JSON.stringify(info, null, 2) }}</code></pre>
		</div>
	</div>
</x-modal>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../i18n';
import { faTimes, faBookmark, faKey, faSync, faMicrophoneSlash, faExternalLinkSquareAlt } from '@fortawesome/free-solid-svg-icons';
import { faSnowflake, faTrashAlt, faBookmark as farBookmark  } from '@fortawesome/free-regular-svg-icons';
import MkButton from './ui/button.vue';
import MkSwitch from './ui/switch.vue';
import XModal from './modal.vue';

export default Vue.extend({
	i18n,

	components: {
		MkButton,
		MkSwitch,
		XModal,
	},

	props: {
		user: {
			type: Object,
			required: true
		},
		info: {
			type: Object,
			required: true
		}
	},

	data() {
		return {
			moderator: this.info.isModerator,
			silenced: this.info.isSilenced,
			suspended: this.info.isSuspended,
			faTimes, faBookmark, farBookmark, faKey, faSync, faMicrophoneSlash, faSnowflake, faTrashAlt, faExternalLinkSquareAlt
		};
	},

	methods: {
		close() {
			this.$refs.modal.close();
		},

		/** 処理対象ユーザーの情報を更新する */
		async refreshUser() {
			this.user = await this.$root.api('users/show', { userId: this.user.id });
			this.info = await this.$root.api('admin/show-user', { userId: this.user.id });
		},

		openProfile() {
			window.open(Vue.filter('userPage')(this.user, null, true), '_blank');
		},

		async updateRemoteUser() {
			await this.$root.api('admin/update-remote-user', { userId: this.user.id }).then(res => {
				this.$root.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			});
			await this.refreshUser();
		},

		async resetPassword() {
			const dialog = this.$root.dialog({
				type: 'waiting',
				iconOnly: true
			});

			this.$root.api('admin/reset-password', {
				userId: this.user.id,
			}).then(({ password }) => {
				this.$root.dialog({
					type: 'success',
					text: this.$t('newPasswordIs', { password })
				});
			}).catch(e => {
				this.$root.dialog({
					type: 'error',
					text: e
				});
			}).finally(() => {
				dialog.close();
			});
		},

		async toggleSilence() {
			const confirm = await this.$root.dialog({
				type: 'warning',
				showCancelButton: true,
				text: this.silenced ? this.$t('silenceConfirm') : this.$t('unsilenceConfirm'),
			});
			if (confirm.canceled) {
				this.silenced = !this.silenced;
			} else {
				await this.$root.api(this.silenced ? 'admin/silence-user' : 'admin/unsilence-user', { userId: this.user.id });
				await this.refreshUser();
			}
		},

		async toggleSuspend() {
			const confirm = await this.$root.dialog({
				type: 'warning',
				showCancelButton: true,
				text: this.suspended ? this.$t('suspendConfirm') : this.$t('unsuspendConfirm'),
			});
			if (confirm.canceled) {
				this.suspended = !this.suspended;
			} else {
				await this.$root.api(this.suspended ? 'admin/suspend-user' : 'admin/unsuspend-user', { userId: this.user.id });
				await this.refreshUser();
			}
		},

		async toggleModerator() {
			await this.$root.api(this.moderator ? 'admin/moderators/add' : 'admin/moderators/remove', { userId: this.user.id });
			await this.refreshUser();
		},

		async deleteAllFiles() {
			const confirm = await this.$root.dialog({
				type: 'warning',
				showCancelButton: true,
				text: this.$t('deleteAllFilesConfirm'),
			});
			if (confirm.canceled) return;
			const process = async () => {
				await this.$root.api('admin/delete-all-files-of-a-user', { userId: this.user.id });
				this.$root.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			};
			await process().catch(e => {
				this.$root.dialog({
					type: 'error',
					text: e.toString()
				});
			});
			await this.refreshUser();
		},
	}
});
</script>

<style lang="scss" scoped>
.vrcsvlkm {
	width: 700px;
	height: 80%;
	background: var(--panel);
	border-radius: var(--radius);
	overflow: hidden;
	display: flex;
	flex-direction: column;

	@media (max-width: 500px) {
		width: 350px;
		height: 350px;
	}

	> .header {
		$height: 58px;
		$height-narrow: 42px;
		display: flex;
		flex-shrink: 0;

		> button {
			height: $height;
			width: $height;

			@media (max-width: 500px) {
				height: $height-narrow;
				width: $height-narrow;
			}
		}

		> .title {
			flex: 1;
			line-height: $height;
			padding-left: 32px;
			font-weight: bold;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			pointer-events: none;

			@media (max-width: 500px) {
				line-height: $height-narrow;
				padding-left: 16px;
			}

			> .avatar {
				$size: 32px;
				height: $size;
				width: $size;
				margin: (($height - $size) / 2) 8px (($height - $size) / 2) 0;

				@media (max-width: 500px) {
					$size: 24px;
					height: $size;
					width: $size;
					margin: (($height-narrow - $size) / 2) 8px (($height-narrow - $size) / 2) 0;
				}
			}

			> .name {
				font-weight: bold;
			}

			> .acct {
				margin-left: 8px;
				opacity: 0.7;
			}

			> .staff {
				margin-left: 0.5em;
				color: var(--badge);
			}

			> .punished {
				margin-left: 0.5em;
				color: #4dabf7;
			}
		}

		> button + .title {
			padding-left: 0;
		}
	}

	> .actions {
		display: flex;
		box-sizing: border-box;
		text-align: left;
		align-items: center;
		margin-top: 16px;
		margin-bottom: 16px;
	}

	> .rawdata {
		padding: 16px 32px 16px 32px;
		border-top: solid 1px var(--divider);
		display: block;
		overflow: scroll;

		@media (max-width: 500px) {
			padding: 8px 16px 8px 16px;
		}

		> pre > code {
			display: block;
			width: 100%;
			height: 100%;
		}
	}
}
</style>
