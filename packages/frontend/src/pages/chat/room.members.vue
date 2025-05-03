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
</style>
