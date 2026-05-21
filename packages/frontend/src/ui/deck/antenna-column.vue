<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :menu="menu" :column="column" :isStacked="isStacked" :refresher="async () => { await timeline?.reloadTimeline() }">
	<template #header>
		<i class="ti ti-antenna"></i><span style="margin-left: 8px;">{{ column.name || column.timelineNameCache || i18n.ts._deck._columns.antenna }}</span>
	</template>

	<MkStreamingNotesTimeline v-if="column.antennaId" ref="timeline" src="antenna" :antenna="column.antennaId"/>
</XColumn>
</template>

<script lang="ts" setup>
import { onMounted, ref, useTemplateRef, watch, computed, defineAsyncComponent } from 'vue';
import XColumn from './column.vue';
import type { entities as MisskeyEntities } from 'misskey-js';
import type { Column } from '@/deck.js';
import type { MenuItem } from '@/types/menu.js';
import type { SoundStore } from '@/preferences/def.js';
import { updateColumn } from '@/deck.js';
import MkStreamingNotesTimeline from '@/components/MkStreamingNotesTimeline.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/i.js';
import { antennasCache } from '@/cache.js';
import { soundSettingsButton } from '@/ui/deck/tl-note-notification.js';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const timeline = useTemplateRef('timeline');
const soundSetting = ref<SoundStore>(props.column.soundSetting ?? { type: null, volume: 1 });
const currentAntenna = ref<MisskeyEntities.Antenna | null>(null);

const isOwned = computed(() => !!$i && !!currentAntenna.value && $i.id === currentAntenna.value.userId);

function fetchCurrentAntenna() {
	if (props.column.antennaId == null) return;
	misskeyApi('antennas/show', { antennaId: props.column.antennaId })
		.then(value => {
			currentAntenna.value = value;
			if (props.column.timelineNameCache !== value.name) {
				updateColumn(props.column.id, { timelineNameCache: value.name });
			}
		});
}

onMounted(() => {
	if (props.column.antennaId == null) {
		setAntenna();
	} else {
		fetchCurrentAntenna();
	}
});

watch(() => props.column.antennaId, () => {
	currentAntenna.value = null;
	fetchCurrentAntenna();
});

watch(soundSetting, v => {
	updateColumn(props.column.id, { soundSetting: v });
});

async function setAntenna() {
	const [antennas, favorited] = await Promise.all([
		misskeyApi('antennas/list'),
		misskeyApi('antennas/my-favorites'),
	]);
	const ownIds = new Set(antennas.map(a => a.id));
	const subscribed = favorited.filter(a => !ownIds.has(a.id));
	const { canceled, result: antennaIdOrOperation } = await os.select({
		title: i18n.ts.selectAntenna,
		items: [
			{ value: '_CREATE_', label: i18n.ts.createNew },
			(antennas.length > 0 ? {
				type: 'group' as const,
				label: i18n.ts.createdAntennas,
				items: antennas.map(x => ({
					value: x.id, label: x.name,
				})),
			} : undefined),
			(subscribed.length > 0 ? {
				type: 'group' as const,
				label: i18n.ts._antenna.favoritedPublicAntennas,
				items: subscribed.map(x => ({
					value: x.id, label: x.name,
				})),
			} : undefined),
		],
		default: props.column.antennaId,
	});

	if (canceled || antennaIdOrOperation == null) return;

	if (antennaIdOrOperation === '_CREATE_') {
		const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkAntennaEditorDialog.vue').then(x => x.default), {}, {
			created: (newAntenna: MisskeyEntities.Antenna) => {
				antennasCache.delete();
				updateColumn(props.column.id, {
					antennaId: newAntenna.id,
					timelineNameCache: newAntenna.name,
				});
			},
			closed: () => {
				dispose();
			},
		});
		return;
	}

	const antenna = antennas.find(x => x.id === antennaIdOrOperation) ?? subscribed.find(x => x.id === antennaIdOrOperation)!;

	updateColumn(props.column.id, {
		antennaId: antenna.id,
		timelineNameCache: antenna.name,
	});
}

function editAntenna() {
	os.pageWindow('/my/antennas/' + props.column.antennaId);
}

function openAntennaPage() {
	os.pageWindow('/timeline/antenna/' + props.column.antennaId);
}

const menu = computed<MenuItem[]>(() => [
	{
		icon: 'ti ti-pencil',
		text: i18n.ts.selectAntenna,
		action: setAntenna,
	},
	isOwned.value ? {
		icon: 'ti ti-settings',
		text: i18n.ts.editAntenna,
		action: editAntenna,
	} : {
		icon: 'ti ti-external-link',
		text: i18n.ts.openInWindow,
		action: openAntennaPage,
	},
	{
		icon: 'ti ti-bell',
		text: i18n.ts._deck.newNoteNotificationSettings,
		action: () => soundSettingsButton(soundSetting),
	},
]);

/*
function focus() {
	timeline.focus();
}

defineExpose({
	focus,
});
*/
</script>
