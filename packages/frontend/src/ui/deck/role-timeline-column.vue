<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :menu="menu" :column="column" :isStacked="isStacked" :refresher="() => timeline.reloadTimeline()">
	<template #header>
		<i class="ti ti-badge"></i><span style="margin-left: 8px;">{{ column.name }}</span>
	</template>

	<MkTimeline v-if="column.roleId" ref="timeline" src="role" :role="column.roleId" :sound="sound"/>
</XColumn>
</template>

<script lang="ts" setup>
import { onMounted, ref, shallowRef, watch } from 'vue';
import XColumn from './column.vue';
import { updateColumn, Column } from './deck-store.js';
import MkTimeline from '@/components/MkTimeline.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { MenuItem } from '@/types/menu.js';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const timeline = shallowRef<InstanceType<typeof MkTimeline>>();
const sound = ref(props.column.sound ?? false);

onMounted(() => {
	if (props.column.roleId == null) {
		setRole();
	}
});

watch(sound, v => {
	updateColumn(props.column.id, { sound: v });
});

async function setRole() {
	const roles = (await misskeyApi('roles/list')).filter(x => x.isExplorable);
	const { canceled, result: role } = await os.select({
		title: i18n.ts.role,
		items: roles.map(x => ({
			value: x, text: x.name,
		})),
		default: props.column.roleId,
	});
	if (canceled) return;
	updateColumn(props.column.id, {
		roleId: role.id,
	});
}

const menu: MenuItem[] = [{
	icon: 'ti ti-pencil',
	text: i18n.ts.role,
	action: setRole,
}, {
	type: 'switch',
	icon: 'ti ti-bell',
	ref: sound,
	text: i18n.ts._deck.notifyNotes,
}];

/*
function focus() {
	timeline.focus();
}

defineExpose({
	focus,
});
*/
</script>
