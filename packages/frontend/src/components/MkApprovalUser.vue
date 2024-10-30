<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder :expanded="false" @click="getReason()">
	<template #icon><i class="ti ti-user-check"></i></template>
	<template #label>{{ i18n.ts.user }}: {{ user.username }}</template>

	<div class="_gaps_s" :class="$style.root">
		<div :class="$style.items">
			<div>
				<div :class="$style.label">{{ i18n.ts.createdAt }}</div>
				<div><MkTime :time="user.createdAt" mode="absolute"/></div>
			</div>
			<div v-if="info_loaded">
				<div v-if="email">
					<div :class="$style.label">{{ i18n.ts.emailAddress }}</div>
					<div>{{ email }}</div>
				</div>
				<div>
					<div :class="$style.label">{{ i18n.ts.registerReason }}</div>
					<div :class="$style.reason_box">{{ reason }}</div>
				</div>
			</div>
			<div v-else><MkLoading :inline="true"/></div>
		</div>
		<div :class="$style.buttons">
			<MkButton inline success @click="approveAccount()">{{ i18n.ts.approveAccount }}</MkButton>
			<MkButton inline danger @click="deleteAccount()">{{ i18n.ts.denyAccount }}</MkButton>
		</div>
	</div>
</MkFolder>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkFolder from '@/components/MkFolder.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';

const props = defineProps<{
	user: Misskey.entities.UserDetailed;
}>();

const reason = ref<string | null>('');
const email = ref('');
const info_loaded = ref(false);

async function getReason() {
	if (info_loaded.value) return;
	return await misskeyApi('admin/show-user', {
		userId: props.user.id,
	}).then(info => {
		info_loaded.value = true;
		reason.value = info.signupReason;
		email.value = info.email ?? '';
	}).catch((err) => console.warn(err));
}

const emits = defineEmits<{
	(event: 'deleted', value: string): void;
}>();

async function deleteAccount() {
	const confirm = await os.confirm({
		type: 'warning',
		text: i18n.ts.deleteAccountConfirm,
	});
	if (confirm.canceled) return;

	await os.apiWithDialog('admin/delete-account', {
		userId: props.user.id,
	});
	emits('deleted', props.user.id);
}

async function approveAccount() {
	const confirm = await os.confirm({
		type: 'warning',
		title: i18n.ts.registerApproveConfirm,
		text: i18n.ts.registerApproveConfirmDescription,
	});
	if (confirm.canceled) return;
	await misskeyApi('admin/approve-user', { userId: props.user.id });
	emits('deleted', props.user.id);
}
</script>

<style lang="scss" module>
.root {
	text-align: left;
}

.items {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
	grid-gap: 12px;
}

.reason_box {
	white-space: pre-line;
	padding: 5px;
	border: solid 1px var(--MI_THEME-accentDarken);
	border-radius: 5px;
}

.label {
	font-size: 0.85em;
	padding: 8px 0 4px 0;
	user-select: none;
	opacity: 0.7;
}
.buttons {
	display: flex;
	gap: 8px;
}
</style>
