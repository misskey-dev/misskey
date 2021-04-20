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
				<MkAvatar class="avatar" :user="user" :show-indicator="true"/>
			</div>
		</div>
		<div class="_section">
			<div class="title">
				<span class="acct">@{{ acct(user) }}</span>
			</div>
			<div class="status">
				<span class="staff" v-if="user.isAdmin"><i class="fas fa-bookmark"></i></span>
				<span class="staff" v-if="user.isModerator"><i class="far fa-bookmark"></i></span>
				<span class="punished" v-if="user.isSilenced"><i class="fas fa-microphone-slash"></i></span>
				<span class="punished" v-if="user.isSuspended"><i class="fas fa-snowflake"></i></span>
			</div>
		</div>
		<div class="_section">
			<div class="_content">
				<MkSwitch v-if="user.host == null && $i.isAdmin && (moderator || !user.isAdmin)" @update:value="toggleModerator" v-model:value="moderator">{{ $ts.moderator }}</MkSwitch>
				<MkSwitch @update:value="toggleSilence" v-model:value="silenced">{{ $ts.silence }}</MkSwitch>
				<MkSwitch @update:value="toggleSuspend" v-model:value="suspended">{{ $ts.suspend }}</MkSwitch>
			</div>
		</div>
		<div class="_section">
			<div class="_content">
				<MkButton full @click="openProfile"><i class="fas fa-external-link-square-alt"></i> {{ $ts.profile }}</MkButton>
				<MkButton full v-if="user.host != null" @click="updateRemoteUser"><i class="fas fa-sync"></i> {{ $ts.updateRemoteUser }}</MkButton>
				<MkButton full @click="resetPassword"><i class="fas fa-key"></i> {{ $ts.resetPassword }}</MkButton>
				<MkButton full @click="deleteAllFiles" danger><i class="fas fa-trash-alt"></i> {{ $ts.deleteAllFiles }}</MkButton>
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
import MkButton from '@client/components/ui/button.vue';
import MkSwitch from '@client/components/ui/switch.vue';
import XModalWindow from '@client/components/ui/modal-window.vue';
import Progress from '@client/scripts/loading';
import { acct, userPage } from '../../filters/user';
import * as os from '@client/os';

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
				text: v ? this.$ts.silenceConfirm : this.$ts.unsilenceConfirm,
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
				text: v ? this.$ts.suspendConfirm : this.$ts.unsuspendConfirm,
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
				text: this.$ts.deleteAllFilesConfirm,
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
