<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 900px;">
		<div class="_gaps">
			<MkPaginationControl v-model:order="order" v-model:date="date" canFilter @reload="paginator.reload()">
				<MkSelect v-model="type" style="margin: 0; flex: 1;">
					<template #label>{{ i18n.ts.type }}</template>
					<option :value="null">{{ i18n.ts.all }}</option>
					<option v-for="t in Misskey.moderationLogTypes" :key="t" :value="t">{{ i18n.ts._moderationLogTypes[t] ?? t }}</option>
				</MkSelect>

				<MkInput v-model="moderatorId" style="margin: 0; flex: 1;">
					<template #label>{{ i18n.ts.moderator }}(ID)</template>
				</MkInput>
			</MkPaginationControl>

			<component :is="prefer.s.enablePullToRefresh ? MkPullToRefresh : 'div'" :refresher="() => paginator.reload()">
				<MkTl :events="timeline" groupBy="d">
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
			</component>

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
import { prefer } from '@/preferences.js';
import { usePagination } from '@/composables/use-pagination.js';
import MkPullToRefresh from '@/components/MkPullToRefresh.vue';
import MkButton from '@/components/MkButton.vue';
import MkPaginationControl from '@/components/MkPaginationControl.vue';

const order = ref<'newest' | 'oldest'>('newest');
const date = ref<number | null>(null);
const type = ref<string | null>(null);
const moderatorId = ref('');

const paginator = usePagination({
	ctx: {
		endpoint: 'admin/show-moderation-logs',
		limit: 20,
		canFetchDetection: 'limit',
		params: computed(() => ({
			type: type.value,
			userId: moderatorId.value === '' ? null : moderatorId.value,
		})),
	},
});

watch([order, date], () => {
	paginator.updateCtxPartial({
		order: order.value,
		initialDirection: order.value === 'oldest' ? 'newer' : 'older',
		initialDate: date.value,
	});
}, { immediate: false });

const timeline = computed(() => {
	return paginator.items.value.map(x => ({
		id: x.id,
		timestamp: x.createdAt,
		data: x,
	}));
});

function fetchMore() {
	if (order.value === 'oldest') {
		paginator.fetchNewer();
	} else {
		paginator.fetchOlder();
	}
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.moderationLogs,
	icon: 'ti ti-list-search',
}));
</script>

