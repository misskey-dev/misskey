<template>
<div class="_formRoot">
	<MkTab v-model="tab" style="margin-bottom: var(--margin);">
		<option value="mute">{{ $ts.mutedUsers }}</option>
		<option value="block">{{ $ts.blockedUsers }}</option>
	</MkTab>
	<div v-if="tab === 'mute'">
		<MkPagination :pagination="mutingPagination" class="muting">
			<template #empty><FormInfo>{{ $ts.noUsers }}</FormInfo></template>
			<template v-slot="{items}">
				<FormLink v-for="mute in items" :key="mute.id" :to="userPage(mute.mutee)">
					<MkAcct :user="mute.mutee"/>
				</FormLink>
			</template>
		</MkPagination>
	</div>
	<div v-if="tab === 'block'">
		<MkPagination :pagination="blockingPagination" class="blocking">
			<template #empty><FormInfo>{{ $ts.noUsers }}</FormInfo></template>
			<template v-slot="{items}">
				<FormLink v-for="block in items" :key="block.id" :to="userPage(block.blockee)">
					<MkAcct :user="block.blockee"/>
				</FormLink>
			</template>
		</MkPagination>
	</div>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkPagination from '@/components/ui/pagination.vue';
import MkTab from '@/components/tab.vue';
import FormInfo from '@/components/ui/info.vue';
import FormLink from '@/components/form/link.vue';
import { userPage } from '@/filters/user';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';

let tab = $ref('mute');

const mutingPagination = {
	endpoint: 'mute/list' as const,
	limit: 10,
};

const blockingPagination = {
	endpoint: 'blocking/list' as const,
	limit: 10,
};

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.muteAndBlock,
		icon: 'fas fa-ban',
		bg: 'var(--bg)',
	},
});
</script>
