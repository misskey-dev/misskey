<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder>
	<template #label>{{ invite.code }}</template>
	<template #suffix>
		<span v-if="invite.used">{{ i18n.ts.used }}</span>
		<span v-else-if="isExpired" style="color: var(--error)">{{ i18n.ts.expired }}</span>
		<span v-else style="color: var(--success)">{{ i18n.ts.unused }}</span>
	</template>

	<div class="_gaps_s" :class="$style.root">
		<div :class="$style.items">
			<div>
				<div :class="$style.label">{{ i18n.ts.invitationCode }}</div>
				<div>{{ invite.code }}</div>
			</div>
			<div v-if="moderator">
				<div :class="$style.label">{{ i18n.ts.inviteCodeCreator }}</div>
				<div v-if="invite.createdBy" :class="$style.user">
					<MkAvatar :user="invite.createdBy" :class="$style.avatar" link preview/>
					<MkUserName :user="invite.createdBy" :nowrap="false"/>
					<div v-if="moderator">({{ invite.createdBy.id }})</div>
				</div>
				<div v-else>system</div>
			</div>
			<div v-if="invite.used">
				<div :class="$style.label">{{ i18n.ts.registeredUserUsingInviteCode }}</div>
				<div v-if="invite.usedBy" :class="$style.user">
					<MkAvatar :user="invite.usedBy" :class="$style.avatar" link preview/>
					<MkUserName :user="invite.usedBy" :nowrap="false"/>
					<div v-if="moderator">({{ invite.usedBy.id }})</div>
				</div>
				<div v-else>{{ i18n.ts.unknown }} ({{ i18n.ts.waitingForMailAuth }})</div>
			</div>
			<div v-if="invite.expiresAt && !invite.used">
				<div :class="$style.label">{{ i18n.ts.expirationDate }}</div>
				<div><MkTime :time="invite.expiresAt" mode="absolute"/></div>
			</div>
			<div v-if="invite.usedAt">
				<div :class="$style.label">{{ i18n.ts.inviteCodeUsedAt }}</div>
				<div><MkTime :time="invite.usedAt" mode="absolute"/></div>
			</div>
			<div v-if="moderator">
				<div :class="$style.label">{{ i18n.ts.createdAt }}</div>
				<div><MkTime :time="invite.createdAt" mode="absolute"/></div>
			</div>
		</div>
		<div :class="$style.buttons">
			<MkButton v-if="!invite.used && !isExpired" primary rounded @click="copyInviteCode()"><i class="ti ti-copy"></i> {{ i18n.ts.copy }}</MkButton>
			<MkButton v-if="!invite.used || moderator" danger rounded @click="deleteCode()"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
		</div>
	</div>
</MkFolder>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkFolder from '@/components/MkFolder.vue';
import MkButton from '@/components/MkButton.vue';
import copyToClipboard from '@/scripts/copy-to-clipboard.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';

const props = defineProps<{
	invite: Misskey.entities.InviteCode;
	moderator?: boolean;
}>();

const emits = defineEmits<{
	(event: 'deleted', value: string): void;
}>();

const isExpired = computed(() => {
	return props.invite.expiresAt && new Date(props.invite.expiresAt) < new Date();
});

function deleteCode() {
	os.apiWithDialog('invite/delete', {
		inviteId: props.invite.id,
	});
	emits('deleted', props.invite.id);
}

function copyInviteCode() {
	copyToClipboard(props.invite.code);
	os.success();
}
</script>

<style lang="scss" module>
.root {
	text-align: left;
}

.items {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	grid-gap: 12px;
}

.label {
	font-size: 0.85em;
	padding: 0 0 8px 0;
	user-select: none;
	opacity: 0.7;
}

.user {
	display: flex;
	align-items: center;
	gap: 8px;
}

.avatar {
	--height: 24px;
	width: var(--height);
	height: var(--height);
}

.buttons {
	display: flex;
	gap: 8px;
}
</style>
