<template>
<div class="vrcsvlkm" v-if="user && info">
	<section class="_section">
		<div class="_title">
			<MkAvatar class="avatar" :user="user"/>
			<MkUserName class="name" :user="user"/>
			<span class="acct">@{{ acct(user) }}</span>
			<span class="staff" v-if="user.isAdmin"><Fa :icon="faBookmark"/></span>
			<span class="staff" v-if="user.isModerator"><Fa :icon="farBookmark"/></span>
			<span class="punished" v-if="user.isSilenced"><Fa :icon="faMicrophoneSlash"/></span>
			<span class="punished" v-if="user.isSuspended"><Fa :icon="faSnowflake"/></span>
		</div>
		<div class="_content actions">
			<div style="flex: 1; padding-left: 1em;">
				<MkSwitch v-if="user.host == null && $store.state.i.isAdmin && (this.moderator || !user.isAdmin)" @update:value="toggleModerator()" v-model:value="moderator">{{ $t('moderator') }}</MkSwitch>
				<MkSwitch @update:value="toggleSilence()" v-model:value="silenced">{{ $t('silence') }}</MkSwitch>
				<MkSwitch @update:value="toggleSuspend()" v-model:value="suspended">{{ $t('suspend') }}</MkSwitch>
			</div>
			<div style="flex: 1; padding-left: 1em;">
				<MkButton @click="openProfile"><Fa :icon="faExternalLinkSquareAlt"/> {{ $t('profile')}}</MkButton>
				<MkButton v-if="user.host != null" @click="updateRemoteUser"><Fa :icon="faSync"/> {{ $t('updateRemoteUser') }}</MkButton>
				<MkButton @click="resetPassword"><Fa :icon="faKey"/> {{ $t('resetPassword') }}</MkButton>
				<MkButton @click="deleteAllFiles"><Fa :icon="faTrashAlt"/> {{ $t('deleteAllFiles') }}</MkButton>
			</div>
		</div>
		<div class="_content rawdata">
			<pre><code>{{ JSON.stringify(info, null, 2) }}</code></pre>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { faTimes, faBookmark, faKey, faSync, faMicrophoneSlash, faExternalLinkSquareAlt } from '@fortawesome/free-solid-svg-icons';
import { faSnowflake, faTrashAlt, faBookmark as farBookmark  } from '@fortawesome/free-regular-svg-icons';
import MkButton from '@/components/ui/button.vue';
import MkSwitch from '@/components/ui/switch.vue';
import Progress from '@/scripts/loading';
import { acct, userPage } from '../../filters/user';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkButton,
		MkSwitch,
	},

	data() {
		return {
			INFO: computed(() => this.user ? {
				header: [{
					userName: this.user,
					avatar: this.user,
				}],
			} : null),
			user: null,
			info: null,
			moderator: false,
			silenced: false,
			suspended: false,
			faTimes, faBookmark, farBookmark, faKey, faSync, faMicrophoneSlash, faSnowflake, faTrashAlt, faExternalLinkSquareAlt
		};
	},

	watch: {
		$route: 'fetch'
	},

	created() {
		this.fetch();
	},

	methods: {
		async fetch() {
			Progress.start();
			this.user = await os.api('users/show', { userId: this.$route.params.user });
			this.info = await os.api('admin/show-user', { userId: this.$route.params.user });
			this.moderator = this.info.isModerator;
			this.silenced = this.info.isSilenced;
			this.suspended = this.info.isSuspended;
			Progress.done();
		},

		/** 処理対象ユーザーの情報を更新する */
		async refreshUser() {
			this.user = await os.api('users/show', { userId: this.user.id });
			this.info = await os.api('admin/show-user', { userId: this.user.id });
		},

		openProfile() {
			window.open(userPage(this.user, null, true), '_blank');
		},

		async updateRemoteUser() {
			await os.api('admin/update-remote-user', { userId: this.user.id }).then(res => {
				os.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			});
			await this.refreshUser();
		},

		async resetPassword() {
			const dialog = os.dialog({
				type: 'waiting',
				iconOnly: true
			});

			os.api('admin/reset-password', {
				userId: this.user.id,
			}).then(({ password }) => {
				os.dialog({
					type: 'success',
					text: this.$t('newPasswordIs', { password })
				});
			}).catch(e => {
				os.dialog({
					type: 'error',
					text: e
				});
			}).finally(() => {
				dialog.close();
			});
		},

		async toggleSilence() {
			const confirm = await os.dialog({
				type: 'warning',
				showCancelButton: true,
				text: this.silenced ? this.$t('silenceConfirm') : this.$t('unsilenceConfirm'),
			});
			if (confirm.canceled) {
				this.silenced = !this.silenced;
			} else {
				await os.api(this.silenced ? 'admin/silence-user' : 'admin/unsilence-user', { userId: this.user.id });
				await this.refreshUser();
			}
		},

		async toggleSuspend() {
			const confirm = await os.dialog({
				type: 'warning',
				showCancelButton: true,
				text: this.suspended ? this.$t('suspendConfirm') : this.$t('unsuspendConfirm'),
			});
			if (confirm.canceled) {
				this.suspended = !this.suspended;
			} else {
				await os.api(this.suspended ? 'admin/suspend-user' : 'admin/unsuspend-user', { userId: this.user.id });
				await this.refreshUser();
			}
		},

		async toggleModerator() {
			await os.api(this.moderator ? 'admin/moderators/add' : 'admin/moderators/remove', { userId: this.user.id });
			await this.refreshUser();
		},

		async deleteAllFiles() {
			const confirm = await os.dialog({
				type: 'warning',
				showCancelButton: true,
				text: this.$t('deleteAllFilesConfirm'),
			});
			if (confirm.canceled) return;
			const process = async () => {
				await os.api('admin/delete-all-files-of-a-user', { userId: this.user.id });
				os.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			};
			await process().catch(e => {
				os.dialog({
					type: 'error',
					text: e.toString()
				});
			});
			await this.refreshUser();
		},

		acct
	}
});
</script>

<style lang="scss" scoped>
.vrcsvlkm {
	display: flex;
	flex-direction: column;

	> ._section {
		> .actions {
			display: flex;
			box-sizing: border-box;
			text-align: left;
			align-items: center;
			margin-top: 16px;
			margin-bottom: 16px;
		}

		> .rawdata {
			> pre > code {
				display: block;
				width: 100%;
				height: 100%;
			}
		}
	}
}
</style>
