<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="900">
		<div>
			<div class="reports">
				<div class="">
					<div class="inputs" style="display: flex;">
						<MkSelect v-model="type" style="margin: 0; flex: 1;">
							<template #label>{{ i18n.ts.type }}</template>
							<option value="all">{{ i18n.ts.all }}</option>
							<option value="unresolved">{{ i18n.ts.unresolved }}</option>
							<option value="resolved">{{ i18n.ts.resolved }}</option>
						</MkSelect>
						<MkInput v-model="moderatorId" style="margin: 0; flex: 1;">
							<template #label>{{ i18n.ts.moderator }}(ID)</template>
						</MkInput>
					</div>

					<MkPagination v-slot="{items}" ref="logs" :pagination="pagination" style="margin-top: var(--margin);">
						<div class="_gaps_s">
							<XModLog v-for="item in items" :key="item.id" :log="item"/>
						</div>
					</MkPagination>
				</div>
			</div>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import XHeader from './_header_.vue';
import XModLog from './modlog.ModLog.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkInput from '@/components/MkInput.vue';
import MkPagination from '@/components/MkPagination.vue';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';

let logs = $shallowRef<InstanceType<typeof MkPagination>>();

let type = $ref(null);
let moderatorId = $ref('');

const pagination = {
	endpoint: 'admin/show-moderation-logs' as const,
	limit: 30,
	params: computed(() => ({
		type,
		userId: moderatorId === '' ? null : moderatorId,
	})),
};

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.moderationLogs,
	icon: 'ti ti-list-search',
});
</script>
