<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs">
	<div v-if="file" class="_spacer" style="--MI_SPACER-w: 600px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<div v-if="tab === 'overview'" class="cxqhhsmd _gaps_m">
			<a class="thumbnail" :href="file.url" target="_blank">
				<MkDriveFileThumbnail class="thumbnail" :file="file" fit="contain"/>
			</a>
			<div>
				<MkKeyValue :copy="file.type" oneline style="margin: 1em 0;">
					<template #key>MIME Type</template>
					<template #value><span class="_monospace">{{ file.type }}</span></template>
				</MkKeyValue>
				<MkKeyValue oneline style="margin: 1em 0;">
					<template #key>Size</template>
					<template #value><span class="_monospace">{{ bytes(file.size) }}</span></template>
				</MkKeyValue>
				<MkKeyValue :copy="file.id" oneline style="margin: 1em 0;">
					<template #key>ID</template>
					<template #value><span class="_monospace">{{ file.id }}</span></template>
				</MkKeyValue>
				<MkKeyValue :copy="file.md5" oneline style="margin: 1em 0;">
					<template #key>MD5</template>
					<template #value><span class="_monospace">{{ file.md5 }}</span></template>
				</MkKeyValue>
				<MkKeyValue oneline style="margin: 1em 0;">
					<template #key>{{ i18n.ts.createdAt }}</template>
					<template #value><span class="_monospace"><MkTime :time="file.createdAt" mode="detail" style="display: block;"/></span></template>
				</MkKeyValue>
			</div>
			<MkA v-if="file.user" class="user" :to="`/admin/user/${file.user.id}`">
				<MkUserCardMini :user="file.user"/>
			</MkA>

			<div>
				<MkSwitch :modelValue="isSensitive" @update:modelValue="toggleSensitive">{{ i18n.ts.sensitive }}</MkSwitch>
			</div>

			<div>
				<MkButton danger @click="del"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
			</div>
		</div>
		<div v-else-if="tab === 'usage' && info" class="_gaps_m">
			<MkTabs
				v-model:tab="usageTab"
				:tabs="[{
					key: 'note',
					title: 'Note',
				}, {
					key: 'chat',
					title: 'Chat',
				}]"
			/>
			<XNotes v-if="usageTab === 'note'" :fileId="props.file.id"/>
			<XChat v-else-if="usageTab === 'chat'" :fileId="props.file.id"/>
		</div>
		<div v-else-if="tab === 'ip' && info" class="_gaps_m">
			<MkInfo v-if="!iAmAdmin" warn>{{ i18n.ts.requireAdminForView }}</MkInfo>
			<MkKeyValue v-if="info.requestIp" class="_monospace" :copy="info.requestIp" oneline>
				<template #key>IP</template>
				<template #value>{{ info.requestIp }}</template>
			</MkKeyValue>
			<FormSection v-if="info.requestHeaders">
				<template #label>Headers</template>
				<MkKeyValue v-for="(v, k) in info.requestHeaders" :key="k" class="_monospace">
					<template #key>{{ k }}</template>
					<template #value>{{ v }}</template>
				</MkKeyValue>
			</FormSection>
		</div>
		<div v-else-if="tab === 'raw'" class="_gaps_m">
			<MkObjectView v-if="info" tall :value="info">
			</MkObjectView>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkObjectView from '@/components/MkObjectView.vue';
import MkDriveFileThumbnail from '@/components/MkDriveFileThumbnail.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import FormSection from '@/components/form/section.vue';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import MkInfo from '@/components/MkInfo.vue';
import bytes from '@/filters/bytes.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { iAmAdmin, iAmModerator } from '@/i.js';
import MkTabs from '@/components/MkTabs.vue';

const props = defineProps<{
	file: Misskey.entities.DriveFile,
	info: Misskey.entities.AdminDriveShowFileResponse,
}>();

const tab = ref('overview');
const isSensitive = ref(props.file.isSensitive);
const usageTab = ref<'note' | 'chat'>('note');
const XNotes = defineAsyncComponent(() => import('./drive.file.notes.vue'));
const XChat = defineAsyncComponent(() => import('./admin-file.chat.vue'));

async function del() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.tsx.removeAreYouSure({ x: props.file.name }),
	});
	if (canceled) return;

	os.apiWithDialog('drive/files/delete', {
		fileId: props.file.id,
	});
}

async function toggleSensitive() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: isSensitive.value ? i18n.ts.unmarkAsSensitiveConfirm : i18n.ts.markAsSensitiveConfirm,
	});

	if (canceled) return;
	isSensitive.value = !isSensitive.value;

	os.apiWithDialog('drive/files/update', {
		fileId: props.file.id,
		isSensitive: !props.file.isSensitive,
	});
}

const headerActions = computed(() => [{
	text: i18n.ts.openInNewTab,
	icon: 'ti ti-external-link',
	handler: () => {
		window.open(props.file.url, '_blank', 'noopener');
	},
}]);

const headerTabs = computed(() => [{
	key: 'overview',
	title: i18n.ts.overview,
	icon: 'ti ti-info-circle',
}, iAmModerator ? {
	key: 'usage',
	title: i18n.ts._fileViewer.usage,
	icon: 'ti ti-plus',
} : null, iAmModerator ? {
	key: 'ip',
	title: 'IP',
	icon: 'ti ti-password',
} : null, {
	key: 'raw',
	title: 'Raw data',
	icon: 'ti ti-code',
}].filter(x => x != null));
</script>

<style lang="scss" scoped>
.cxqhhsmd {
	> .thumbnail {
		display: block;

		> .thumbnail {
			height: 300px;
			max-width: 100%;
		}
	}

	> .user {
		&:hover {
			text-decoration: none;
		}
	}
}
</style>
