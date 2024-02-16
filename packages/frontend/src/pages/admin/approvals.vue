<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkStickyContainer>
		<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
		<MkSpacer :contentMax="900">
			<div class="_gaps_m">
				<MkPagination ref="paginationComponent" :pagination="pagination">
					<template #default="{ items }">
						<div class="_gaps_s">
							<MkApprovalUser v-for="item in items" :key="item.id" :user="(item as any)" :onDeleted="deleted"/>
						</div>
					</template>
				</MkPagination>
			</div>
		</MkSpacer>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
import { computed, shallowRef } from 'vue';
import XHeader from './_header_.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkApprovalUser from '@/components/MkApprovalUser.vue';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';

let paginationComponent = shallowRef<InstanceType<typeof MkPagination>>();

const pagination = {
	endpoint: 'admin/show-users' as const,
	limit: 10,
	params: computed(() => ({
		sort: '+createdAt',
		state: 'approved',
		origin: 'local',
	})),
	offsetMode: true,
};

function deleted(id: string) {
	if (paginationComponent.value) {
		paginationComponent.value.items.delete(id);
	}
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(computed(() => ({
	title: i18n.ts.signupPendingApprovals,
	icon: 'ti ti-user-check',
})));
</script>

<style lang="scss" module>
.inputs {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
}

.input {
	flex: 1;
}
</style>
