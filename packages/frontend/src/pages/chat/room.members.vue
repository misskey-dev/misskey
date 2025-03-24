<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div v-for="membership in memberships" :key="membership.id" :class="$style.membership">
		<MkA :class="$style.membershipBody" :to="`${userPage(membership.user)}`">
			<MkUserCardMini :user="membership.user"/>
		</MkA>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import * as os from '@/os.js';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import { userPage } from '@/filters/user.js';

const props = defineProps<{
	roomId?: string;
}>();

const memberships = ref<Misskey.entities.ChatRoomMembership[]>([]);

onMounted(async () => {
	memberships.value = await misskeyApi('chat/rooms/members', {
		roomId: props.roomId,
		limit: 50,
	});
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

	&:hover {
		text-decoration: none;
	}
}
</style>
