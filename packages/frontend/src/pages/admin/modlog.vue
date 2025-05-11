<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 900px;">
		<div class="_gaps">
			<div style="display: flex; gap: var(--MI-margin); flex-wrap: wrap;">
				<MkSelect v-model="type" style="margin: 0; flex: 1;">
					<template #label>{{ i18n.ts.type }}</template>
					<option :value="null">{{ i18n.ts.all }}</option>
					<option v-for="t in Misskey.moderationLogTypes" :key="t" :value="t">{{ i18n.ts._moderationLogTypes[t] ?? t }}</option>
				</MkSelect>
				<MkInput v-model="moderatorId" style="margin: 0; flex: 1;">
					<template #label>{{ i18n.ts.moderator }}(ID)</template>
				</MkInput>
			</div>

			<MkTl :events="timeline">
				<template #left="{ event }">
					<div>
						<MkAvatar :user="event.user" style="width: 26px; height: 26px;"/>
					</div>
				</template>
				<template #right="{ event, timestamp, delta }">
					<div style="margin: 4px 0;">
						<XModLog :key="event.id" :log="event"/>
					</div>
				</template>
			</MkTl>

			<MkButton primary rounded style="margin: 0 auto;" @click="fetchMore">{{ i18n.ts.loadMore }}</MkButton>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, useTemplateRef, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import XModLog from './modlog.ModLog.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkInput from '@/components/MkInput.vue';
import MkTl from '@/components/MkTl.vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import MkButton from '@/components/MkButton.vue';

const type = ref<string | null>(null);
const moderatorId = ref('');

const timeline = ref([]);

watch([type, moderatorId], async () => {
	const res = await misskeyApi('admin/show-moderation-logs', {
		type: type.value,
		userId: moderatorId.value === '' ? null : moderatorId.value,
	});
	timeline.value = res.map(x => ({
		id: x.id,
		timestamp: x.createdAt,
		data: x,
	}));
}, { immediate: true });

function fetchMore() {
	const last = timeline.value[timeline.value.length - 1];
	misskeyApi('admin/show-moderation-logs', {
		type: type.value,
		userId: moderatorId.value === '' ? null : moderatorId.value,
		untilId: last.id,
	}).then(res => {
		timeline.value.push(...res.map(x => ({
			id: x.id,
			timestamp: x.createdAt,
			data: x,
		})));
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.moderationLogs,
	icon: 'ti ti-list-search',
}));
</script>
