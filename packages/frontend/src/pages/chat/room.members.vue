<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<MkButton v-if="isOwner" primary rounded style="margin: 0 auto;" @click="emit('inviteUser')"><i class="ti ti-plus"></i> {{ i18n.ts._chat.inviteUser }}</MkButton>

	<MkA :class="$style.membershipBody" :to="`${userPage(room.owner)}`">
		<MkUserCardMini :user="room.owner"/>
	</MkA>

	<hr v-if="memberships.length > 0">

	<div v-for="membership in memberships" :key="membership.id" :class="$style.membership">
		<MkA :class="$style.membershipBody" :to="`${userPage(membership.user!)}`">
			<MkUserCardMini :user="membership.user!"/>
		</MkA>
	</div>

	<div v-if="isOwner && memberships.length > 0" class="_panel" :class="$style.experimentalMemberTools">
		<div :class="$style.experimentalMemberToolsTitle">
			実験機能: メンバー管理
		</div>
		<div :class="$style.experimentalMemberToolsDescription">
			グループチャットからメンバーを外すための実験機能です。現在は確認ダイアログの表示だけを行います。
		</div>

		<div :class="$style.experimentalMemberList">
			<div v-for="membership in memberships" :key="membership.id" :class="$style.experimentalMemberRow">
				<MkA :class="$style.experimentalMemberBody" :to="`${userPage(membership.user!)}`">
					<MkUserCardMini :user="membership.user!"/>
				</MkA>

				<MkButton
					v-if="membership.user?.id !== $i.id"
					danger
					rounded
					@click="confirmRemoveMemberPreview(membership)"
				>
					<i class="ti ti-user-x"></i>
					外す
				</MkButton>

			</div>
		</div>
	</div>

	<template v-if="isOwner">
		<hr>

		<div>{{ i18n.ts._chat.sentInvitations }}</div>

		<div v-for="invitation in invitations" :key="invitation.id" :class="$style.invitation">
			<MkA :class="$style.invitationBody" :to="`${userPage(invitation.user)}`">
				<MkUserCardMini :user="invitation.user"/>
			</MkA>
		</div>
	</template>
</div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import { userPage } from '@/filters/user.js';
import { ensureSignin } from '@/i.js';
import * as os from '@/os.js';

const $i = ensureSignin();

const props = defineProps<{
	room: Misskey.entities.ChatRoom;
}>();

const emit = defineEmits<{
	(ev: 'inviteUser'): void,
}>();

const isOwner = computed(() => {
	return props.room.ownerId === $i.id;
});

const memberships = ref<Misskey.entities.ChatRoomMembership[]>([]);
const invitations = ref<Misskey.entities.ChatRoomInvitation[]>([]);

async function confirmRemoveMemberPreview(membership: Misskey.entities.ChatRoomMembership) {
	const user = membership.user;
	if (user == null) return;

	const firstConfirm = await os.confirm({
		type: 'warning',
		title: 'メンバーを外しますか？',
		text: `${user.name ?? user.username} さんをこのグループチャットから外します。\n\nこれはBANではないため、再招待すれば戻せます。`,
	});

	if (firstConfirm.canceled) return;

	const secondConfirm = await os.confirm({
		type: 'warning',
		title: '実験機能の確認',
		text: 'この機能は活動すきー独自の実験機能です。\n\n本当に実行しますか？',
	});

	if (secondConfirm.canceled) return;

	await os.apiWithDialog('chat/rooms/remove-member', {
		roomId: props.room.id,
		userId: user.id,
	});

	memberships.value = memberships.value.filter(x => x.id !== membership.id);

	await os.alert({
		type: 'success',
		title: 'メンバーを外しました',
		text: `${user.name ?? user.username} さんをこのグループチャットから外しました。`,
	});
}

onMounted(async () => {
	memberships.value = await misskeyApi('chat/rooms/members', {
		roomId: props.room.id,
		limit: 50,
	});

	if (isOwner.value) {
		invitations.value = await misskeyApi('chat/rooms/invitations/outbox', {
			roomId: props.room.id,
			limit: 50,
		});
	}
});
</script>

<style lang="scss" module>
.membership {
	display: flex;
}

.membershipBody {
	flex: 1;
	min-width: 0;
	margin-right: 8px;
}

.invitation {
	display: flex;
}

.invitationBody {
	flex: 1;
	min-width: 0;
	margin-right: 8px;
}

.experimentalMemberTools {
	padding: 16px;
}

.experimentalMemberToolsTitle {
	font-weight: 700;
}

.experimentalMemberToolsDescription {
	margin-top: 6px;
	font-size: 0.9em;
	color: var(--MI_THEME-fg);
	opacity: 0.75;
}

.experimentalMemberList {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-top: 12px;
}

.experimentalMemberRow {
	display: flex;
	align-items: center;
	gap: 8px;
}

.experimentalMemberBody {
	flex: 1;
	min-width: 0;
}
</style>
