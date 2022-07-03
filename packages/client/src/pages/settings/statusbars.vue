<template>
<div class="_formRoot">
	<FormFolder v-for="x in statusbars" :key="x.id" class="_formBlock">
		<template #label>{{ x.type ?? i18n.ts.notSet }}</template>
		<template #suffix>{{ x.name }}</template>
		<XStatusbar :_id="x.id" :user-lists="userLists"/>
	</FormFolder>
	<FormButton @click="add">add</FormButton>
	<FormRadios v-model="statusbarSize" class="_formBlock">
		<template #label>Size</template>
		<option value="verySmall">{{ i18n.ts.small }}+</option>
		<option value="small">{{ i18n.ts.small }}</option>
		<option value="medium">{{ i18n.ts.medium }}</option>
		<option value="large">{{ i18n.ts.large }}</option>
		<option value="veryLarge">{{ i18n.ts.large }}+</option>
	</FormRadios>
</div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { v4 as uuid } from 'uuid';
import XStatusbar from './statusbars.statusbar.vue';
import FormRadios from '@/components/form/radios.vue';
import FormFolder from '@/components/form/folder.vue';
import FormButton from '@/components/ui/button.vue';
import * as os from '@/os';
import { defaultStore } from '@/store';
import { unisonReload } from '@/scripts/unison-reload';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const statusbarSize = computed(defaultStore.makeGetterSetter('statusbarSize'));
const statusbars = defaultStore.reactiveState.statusbars;

let userLists = $ref();

onMounted(() => {
	os.api('users/lists/list').then(res => {
		userLists = res;
	});
});

async function add() {
	defaultStore.push('statusbars', {
		id: uuid(),
		type: null,
		black: false,
		props: {},
	});
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.statusbar,
	icon: 'fas fa-list-ul',
	bg: 'var(--bg)',
});
</script>
