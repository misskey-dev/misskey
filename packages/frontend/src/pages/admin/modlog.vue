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
						<MkSelect v-model="state" style="margin: 0; flex: 1;">
							<template #label>{{ i18n.ts.state }}</template>
							<option value="all">{{ i18n.ts.all }}</option>
							<option value="unresolved">{{ i18n.ts.unresolved }}</option>
							<option value="resolved">{{ i18n.ts.resolved }}</option>
						</MkSelect>
						<MkSelect v-model="targetUserOrigin" style="margin: 0; flex: 1;">
							<template #label>{{ i18n.ts.reporteeOrigin }}</template>
							<option value="combined">{{ i18n.ts.all }}</option>
							<option value="local">{{ i18n.ts.local }}</option>
							<option value="remote">{{ i18n.ts.remote }}</option>
						</MkSelect>
						<MkSelect v-model="reporterOrigin" style="margin: 0; flex: 1;">
							<template #label>{{ i18n.ts.reporterOrigin }}</template>
							<option value="combined">{{ i18n.ts.all }}</option>
							<option value="local">{{ i18n.ts.local }}</option>
							<option value="remote">{{ i18n.ts.remote }}</option>
						</MkSelect>
					</div>
					<!-- TODO
			<div class="inputs" style="display: flex; padding-top: 1.2em;">
				<MkInput v-model="searchUsername" style="margin: 0; flex: 1;" type="text" :spellcheck="false">
					<span>{{ i18n.ts.username }}</span>
				</MkInput>
				<MkInput v-model="searchHost" style="margin: 0; flex: 1;" type="text" :spellcheck="false" :disabled="pagination.params().origin === 'local'">
					<span>{{ i18n.ts.host }}</span>
				</MkInput>
			</div>
			-->

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
import MkPagination from '@/components/MkPagination.vue';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';

let logs = $shallowRef<InstanceType<typeof MkPagination>>();

let state = $ref('unresolved');
let reporterOrigin = $ref('combined');
let targetUserOrigin = $ref('combined');
let searchUsername = $ref('');
let searchHost = $ref('');

const pagination = {
	endpoint: 'admin/show-moderation-logs' as const,
	limit: 30,
	params: computed(() => ({
		state,
		reporterOrigin,
		targetUserOrigin,
	})),
};

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.moderationLogs,
	icon: 'ti ti-list-search',
});
</script>
