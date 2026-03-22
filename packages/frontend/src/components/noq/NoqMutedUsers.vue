<script setup lang="ts">
/**
 * NoqMutedUsers.vue
 * 質問箱用ミュートユーザー一覧コンポーネント
 */
import { ref, onMounted } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import MkUserName from '@/components/global/MkUserName.vue';
import MkAvatar from '@/components/global/MkAvatar.vue';
import MkTime from '@/components/global/MkTime.vue';

interface MutedUser {
	id: string;
	mutedUser: Misskey.entities.UserLite;
	createdAt: string;
}

const mutedUsers = ref<MutedUser[]>([]);
const loading = ref(true);

async function load() {
	loading.value = true;
	try {
		mutedUsers.value = await misskeyApi('noq/mute/list', {}) as MutedUser[];
	} catch (err) {
		console.error(err);
	} finally {
		loading.value = false;
	}
}

async function unmute(userId: string) {
	try {
		await misskeyApi('noq/mute/delete', { userId });
		mutedUsers.value = mutedUsers.value.filter(m => m.mutedUser.id !== userId);
	} catch (err) {
		console.error(err);
	}
}

onMounted(() => {
	load();
});
</script>

<template>
<div class="noq-muted-users">
	<div v-if="loading" class="loading">
		Loading...
	</div>

	<div v-else-if="mutedUsers.length === 0" class="no-users">
		{{ i18n.ts._noq.noMutedUsers }}
	</div>

	<div v-else class="user-list">
		<div v-for="mute in mutedUsers" :key="mute.id" class="user-item">
			<div class="user-info">
				<MkAvatar :user="mute.mutedUser" class="avatar" />
				<div class="details">
					<MkUserName :user="mute.mutedUser" class="name" />
					<MkTime :time="mute.createdAt" class="time" />
				</div>
			</div>
			<MkButton danger @click="unmute(mute.mutedUser.id)">
				{{ i18n.ts._noq.unmuteUser }}
			</MkButton>
		</div>
	</div>
</div>
</template>

<style scoped lang="scss">
.noq-muted-users {
	padding: 16px;

	.loading, .no-users {
		padding: 24px;
		text-align: center;
		color: var(--fgTransparent);
	}

	.user-list {
		display: flex;
		flex-direction: column;
		gap: 12px;

		.user-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 12px;
			background: var(--panel);
			border-radius: 8px;

			.user-info {
				display: flex;
				align-items: center;
				gap: 12px;

				.avatar {
					width: 40px;
					height: 40px;
				}

				.details {
					.name {
						font-weight: bold;
					}

					.time {
						font-size: 0.85em;
						color: var(--fgTransparent);
					}
				}
			}
		}
	}
}
</style>
