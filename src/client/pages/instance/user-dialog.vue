<template>
<XModalWindow ref="dialog"
	:width="370"
	@close="$refs.dialog.close()"
	@closed="$emit('closed')"
>
	<template #header v-if="user"><MkUserName class="name" :user="user"/></template>
	<div class="vrcsvlkm" v-if="user && info">
		<div class="_section">
			<div class="banner" :style="bannerStyle">
				<MkAvatar class="avatar" :user="user"/>
			</div>
		</div>
		<div class="_section">
			<div class="title">
				<span class="acct">@{{ acct(user) }}</span>
			</div>
			<div class="status">
				<span class="staff" v-if="user.isAdmin"><Fa :icon="faBookmark"/></span>
				<span class="staff" v-if="user.isModerator"><Fa :icon="farBookmark"/></span>
				<span class="punished" v-if="user.isSilenced"><Fa :icon="faMicrophoneSlash"/></span>
				<span class="punished" v-if="user.isSuspended"><Fa :icon="faSnowflake"/></span>
			</div>
		</div>
		<div class="_section">
			<div class="_content">
				<MkSwitch v-if="user.host == null && $store.state.i.isAdmin && (moderator || !user.isAdmin)" @update:value="toggleModerator" v-model:value="moderator">{{ $t('moderator') }}</MkSwitch>
				<MkSwitch @update:value="toggleSilence" v-model:value="silenced">{{ $t('silence') }}</MkSwitch>
				<MkSwitch @update:value="toggleSuspend" v-model:value="suspended">{{ $t('suspend') }}</MkSwitch>
			</div>
		</div>
		<div class="_section">
			<div class="_content">
				<MkButton full @click="openProfile"><Fa :icon="faExternalLinkSquareAlt"/> {{ $t('profile') }}</MkButton>
				<MkButton full v-if="user.host != null" @click="updateRemoteUser"><Fa :icon="faSync"/> {{ $t('updateRemoteUser') }}</MkButton>
				<MkButton full @click="resetPassword"><Fa :icon="faKey"/> {{ $t('resetPassword') }}</MkButton>
				<MkButton full @click="deleteAllFiles" danger><Fa :icon="faTrashAlt"/> {{ $t('deleteAllFiles') }}</MkButton>
			</div>
		</div>
		<div class="_section">
			<details class="_content rawdata">
				<pre><code>{{ JSON.stringify(info, null, 2) }}</code></pre>
			</details>
		</div>
	</div>
</XModalWindow>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { faTimes, faBookmark, faKey, faSync, faMicrophoneSlash, faExternalLinkSquareAlt } from '@fortawesome/free-solid-svg-icons';
import { faSnowflake, faTrashAlt, faBookmark as farBookmark  } from '@fortawesome/free-regular-svg-icons';
import MkButton from '@/components/ui/button.vue';
import MkSwitch from '@/components/ui/switch.vue';
import XModalWindow from '@/components/ui/modal-window.vue';
import Progress from '@/scripts/loading';
import { acct, userPage } from '../../filters/user';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkButton,
		MkSwitch,
		XModalWindow,
	},

	props: {
		userId: {
			required: true,
		}
	},

	emits: ['closed'],

	data() {
		return {
			user: null,
			info: null,
			moderator: false,
			silenced: false,
			suspended: false,
			faTimes, faBookmark, farBookmark, faKey, faSync, faMicrophoneSlash, faSnowflake, faTrashAlt, faExternalLinkSquareAlt
		};
	},

	computed: {
		bannerStyle(): any {
			if (this.user.bannerUrl == null) return {};
			return {
				backgroundImage: `url(${ this.user.bannerUrl })`
			};
		},
	},

	created() {
		this.fetch();
	},

	methods: {
		async fetch() {
			Progress.start();
			this.user = await os.api('users/show', { userId: this.userId });
			this.info = await os.api('admin/show-user', { userId: this.userId });
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
				os.success();
			});
			await this.refreshUser();
		},

		async resetPassword() {
			os.apiWithDialog('admin/reset-password', {
				userId: this.user.id,
			}, undefined, ({ password }) => {
				os.dialog({
					type: 'success',
					text: this.$t('newPasswordIs', { password })
				});
			});
		},

		async toggleSilence(v) {
			const confirm = await os.dialog({
				type: 'warning',
				showCancelButton: true,
				text: v ? this.$t('silenceConfirm') : this.$t('unsilenceConfirm'),
			});
			if (confirm.canceled) {
				this.silenced = !v;
			} else {
				await os.api(v ? 'admin/silence-user' : 'admin/unsilence-user', { userId: this.user.id });
				await this.refreshUser();
			}
		},

		async toggleSuspend(v) {
			const confirm = await os.dialog({
				type: 'warning',
				showCancelButton: true,
				text: v ? this.$t('suspendConfirm') : this.$t('unsuspendConfirm'),
			});
			if (confirm.canceled) {
				this.suspended = !v;
			} else {
				await os.api(v ? 'admin/suspend-user' : 'admin/unsuspend-user', { userId: this.user.id });
				await this.refreshUser();
			}
		},

		async toggleModerator(v) {
			await os.api(v ? 'admin/moderators/add' : 'admin/moderators/remove', { userId: this.user.id });
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
				os.success();
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
	> ._section {
		> .banner {
			position: relative;
			height: 100px;
			background-color: #4c5e6d;
			background-size: cover;
			background-position: center;
			border-radius: 8px;

			> .avatar {
				position: absolute;
				top: 60px;
				width: 64px;
				height: 64px;
				left: 0;
				right: 0;
				margin: 0 auto;
				border: solid 4px var(--panel);
			}
		}

		> .title {
			text-align: center;
		}

		> .status {
			text-align: center;
			margin-top: 8px;
		}

		> .rawdata {
			overflow: auto;
		}
	}
}
</style>
