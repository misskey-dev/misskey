<template>
<MkStickyContainer>
	<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="900">
		<div style="display: flex; flex-direction: column; gap: var(--margin); flex-wrap: wrap;">
			<div :class="$style.inputs">
				<MkSelect v-model="from" :class="$style.input">
					<template #label>{{ i18n.ts._accountMigration.movedFromServer }}</template>
					<option value="all">{{ i18n.ts.all }}</option>
					<option value="remote">{{ i18n.ts.remote }}</option>
					<option value="local">{{ i18n.ts.local }}</option>
				</MkSelect>
				<MkSelect v-model="to" :class="$style.input">
					<template #label>{{ i18n.ts._accountMigration.movedToServer }}</template>
					<option value="all">{{ i18n.ts.all }}</option>
					<option value="remote">{{ i18n.ts.remote }}</option>
					<option value="local">{{ i18n.ts.local }}</option>
				</MkSelect>
			</div>
			<div :class="$style.inputs">
				<MkInput v-model="movedFromId" :class="$style.input">
					<template #label> {{ i18n.ts.moveFromId }}</template>
				</MkInput>
				<MkInput v-model="movedToId" :class="$style.input">
					<template #label> {{ i18n.ts.movedToId }}</template>
				</MkInput>
			</div>
		</div>

		<MkPagination v-slot="{items}" ref="logs" :pagination="pagination" style="margin-top: var(--margin);">
			<div class="_gaps_s">
				<MkFolder v-for="item in items" :key="item.id">
					<template #label>
						{{ i18n.tsx.userAccountMoveLogsTitle({
							from: '@' + item.movedFrom.username + (item.movedFrom.host ? `@${item.movedFrom.host}` : ''),
							to: '@' + item.movedTo.username + (item.movedTo.host ? `@${item.movedTo.host}` : '')
						})
						}}
					</template>
					<div :class="$style.card">
						<MkA :to="userPage(item.movedFrom)" :class="$style.cardContent">
							<MkAvatar :user="item.movedFrom" :class="$style.avatar" link/>
							<MkAcct :user="item.movedFrom"/>
						</MkA>
						→
						<MkA :to="userPage(item.movedTo)" :class="$style.cardContent">
							<MkAvatar :user="item.movedTo" :class="$style.avatar"/>
							<MkAcct :user="item.movedTo"/>
						</MkA>
					</div>
				</MkFolder>
			</div>
		</MkPagination>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, shallowRef, ref } from 'vue';
import XHeader from './_header_.vue';
import MkInput from '@/components/MkInput.vue';
import MkPagination from '@/components/MkPagination.vue';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { userPage } from '@/filters/user.js';
import MkFolder from '@/components/MkFolder.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkSelect from '@/components/MkSelect.vue';

const logs = shallowRef<InstanceType<typeof MkPagination>>();

const movedToId = ref('');
const movedFromId = ref('');
const from = ref('all');
const to = ref('all');

const pagination = {
	endpoint: 'admin/show-user-account-move-logs' as const,
	limit: 30,
	params: computed(() => ({
		movedFromId: movedFromId.value === '' ? null : movedFromId.value,
		movedToId: movedToId.value === '' ? null : movedToId.value,
		from: from.value,
		to: to.value,
	})),
};

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.userAccountMoveLogs,
	icon: 'ti ti-list-search',
}));
</script>

<style lang="scss" module>
.card {
	display: flex;
	gap: var(--margin);
	border-radius: var(--radius);
	padding: var(--margin);
	align-items: center;
	justify-content: center;
	flex-wrap: wrap;
}
.avatar {
	width: 48px;
	height: 48px;
}

.cardContent{
	display: flex;
	gap: var(--margin);
	align-items: center;
	flex-direction: column;
}

.inputs {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
}

.input {
	margin: 0;
	flex: 1;
}
</style>
