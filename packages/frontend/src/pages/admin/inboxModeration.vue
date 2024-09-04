<!--
SPDX-FileCopyrightText: Type4ny-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkStickyContainer>
		<template #header><XHeader/></template>
		<MkSpacer :contentMax="900">
			<div class="_gaps">
				<MkButton rounded primary @click="addRule">{{ i18n.ts._inboxRule.add }}</MkButton>
				<div v-for="(rule,i) in rules">
					<MkFolder>
						<template #label>{{ rule.name ?? '無名のルール' }}</template>
						<div class="_gaps">
							<MkInput v-model="rule.name">
								<template #label>{{ i18n.ts._inboxRule.name }}</template>
							</MkInput>
							<MkInput v-model="rule.description">
								<template #label>{{ i18n.ts._inboxRule.description }}</template>
							</MkInput>
							<InboxModerationEditorFormula v-model="rule.condFormula"/>
							{{ i18n.ts._inboxRule.then }}
							<MkSelect v-model="rule.action.type">
								<template #label>{{ i18n.ts._inboxRule.action }}</template>
								<option value="reject">{{ i18n.ts._inboxRule.reject }}</option>
							</MkSelect>
							<MkButton rounded @click="remove(i)">{{ i18n.ts.remove }}</MkButton>
							<MkButton rounded primary @click="save(i)">{{ i18n.ts.save }}</MkButton>
						</div>
					</MkFolder>
				</div>
			</div>
		</MkSpacer>
	</MkStickyContainer>
</div>
</template>

<script setup lang="ts">

import { ref } from 'vue';
import { v4 as uuid } from 'uuid';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import XHeader from '@/pages/admin/_header_.vue';
import InboxModerationEditorFormula from '@/pages/admin/InboxModerationEditorFormula.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkInput from '@/components/MkInput.vue';
import MkSelect from '@/components/MkSelect.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';

type Rule = {
	id?:string;
	name:string|null;
	condFormula:object;
	description: string|null;
	action:{
		type: 'reject' ;
		rewrite?: string | null | undefined;
	};
}

const rules = ref<Rule[]>([]);

(async () => {
	const res = await misskeyApi('admin/inbox-rule/list');
	rules.value = res;
})();

function addRule() {
	rules.value.push({
		name: null,
		condFormula: { id: uuid(), type: 'isLocked' },
		action: { type: 'reject' },
		description: null,
	});
}

function save(index:number) {
	if (rules.value[index].id) {
		misskeyApi('admin/inbox-rule/edit', {
			id: rules.value[index].id,
			name: rules.value[index].name ?? null,
			condFormula: rules.value[index].condFormula ?? null,
			action: rules.value[index].action ?? null,
			description: rules.value[index].description ?? null,
		});
	} else {
		misskeyApi('admin/inbox-rule/set', {
			name: rules.value[index].name,
			condFormula: rules.value[index].condFormula,
			action: rules.value[index].action,
			description: rules.value[index].description ?? '説明のないルール',
		});
	}
}

function remove(index:number) {
	misskeyApi('admin/inbox-rule/delete', { id: rules.value[index].id });
	rules.value.splice(index, 1);
}

</script>

<style module lang="scss">

</style>
