<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :menu="menu" :column="column" :isStacked="isStacked" :refresher="async () => { await timeline?.reloadTimeline() }">
	<template #header>
		<i class="ti ti-badge"></i><span style="margin-left: 8px;">{{ column.name || column.timelineNameCache || i18n.ts._deck._columns.roleTimeline }}</span>
	</template>

	<MkStreamingNotesTimeline v-if="column.roleId" ref="timeline" src="role" :role="column.roleId"/>
</XColumn>
</template>

<script lang="ts" setup>
import { onMounted, ref, useTemplateRef, watch } from 'vue';
import XColumn from './column.vue';
import type { Column } from '@/deck.js';
import type { MenuItem } from '@/types/menu.js';
import type { SoundStore } from '@/preferences/def.js';
import { updateColumn } from '@/deck.js';
import MkStreamingNotesTimeline from '@/components/MkStreamingNotesTimeline.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { soundSettingsButton } from '@/ui/deck/tl-note-notification.js';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const timeline = useTemplateRef('timeline');
const soundSetting = ref<SoundStore>(props.column.soundSetting ?? { type: null, volume: 1 });

onMounted(() => {
	if (props.column.roleId == null) {
		setRole();
	} else if (props.column.timelineNameCache == null) {
		misskeyApi('roles/show', { roleId: props.column.roleId })
			.then(value => updateColumn(props.column.id, { timelineNameCache: value.name }));
	}
});

watch(soundSetting, v => {
	updateColumn(props.column.id, { soundSetting: v });
});

async function setRole() {
	const roles = (await misskeyApi('roles/list')).filter(x => x.isExplorable);
	const { canceled, result: roleId } = await os.select({
		title: i18n.ts.role,
		items: roles.map(x => ({
			value: x.id, label: x.name,
		})),
		default: roles.find(x => x.id === props.column.roleId)?.id,
	});
	if (canceled || roleId == null) return;
	const role = roles.find(x => x.id === roleId)!;
	updateColumn(props.column.id, {
		roleId: role.id,
		timelineNameCache: role.name,
	});
}

const menu: MenuItem[] = [{
	icon: 'ti ti-pencil',
	text: i18n.ts.role,
	action: setRole,
}, {
	icon: 'ti ti-bell',
	text: i18n.ts._deck.newNoteNotificationSettings,
	action: () => soundSettingsButton(soundSetting),
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
