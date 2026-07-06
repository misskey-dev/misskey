<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :menu="menu" :column="column" :isStacked="isStacked" :refresher="async () => { await paginator.reload() }">
	<template #header>
		<i class="ti ti-paperclip"></i><span style="margin-left: 8px;">{{ column.name || column.timelineNameCache || i18n.ts._deck._columns.clip }}</span>
	</template>

	<MkResult v-if="notFound" type="notFound"/>
	<MkNotesTimeline v-else-if="column.clipId" :paginator="paginator" :withControl="false" :noGap="true"/>
</XColumn>
</template>

<script lang="ts" setup>
import { computed, markRaw, onMounted, onUnmounted, provide, ref, shallowRef, watch } from 'vue';
import * as Misskey from 'misskey-js';
import XColumn from './column.vue';
import type { Column } from '@/deck.js';
import type { MenuItem } from '@/types/menu.js';
import { updateColumn } from '@/deck.js';
import MkNotesTimeline from '@/components/MkNotesTimeline.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { clipsCache, favoritedClipsCache } from '@/cache.js';
import { useStream } from '@/stream.js';
import { Paginator } from '@/utility/paginator.js';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const clip = shallowRef<Misskey.entities.Clip | null>(null);
const notFound = ref(false);

provide('currentClip', clip);

const paginator = markRaw(new Paginator('clips/notes', {
	limit: 10,
	canSearch: true,
	computedParams: computed(() => props.column.clipId ? { clipId: props.column.clipId } : null),
}));

let connection: Misskey.IChannelConnection<Misskey.Channels['clip']> | null = null;

// 同じクリップを大勢が購読していると、更新の度に全員が同時にreloadしリクエストがスパイクしうるため、
// 受信直後ではなくランダムな遅延を挟んでからreloadし、着火タイミングを分散させる
const RELOAD_JITTER_MAX_MS = 5000;
let reloadTimer: number | null = null;

function scheduleReload() {
	if (reloadTimer != null) return;
	reloadTimer = window.setTimeout(() => {
		reloadTimer = null;
		paginator.reload();
	}, Math.random() * RELOAD_JITTER_MAX_MS);
}

function cancelScheduledReload() {
	if (reloadTimer != null) {
		window.clearTimeout(reloadTimer);
		reloadTimer = null;
	}
}

function disconnectChannel() {
	cancelScheduledReload();
	if (connection) {
		connection.dispose();
		connection = null;
	}
}

function connectChannel() {
	disconnectChannel();
	if (props.column.clipId == null) return;
	connection = useStream().useChannel('clip', {
		clipId: props.column.clipId,
	});
	connection.on('updated', () => {
		scheduleReload();
	});
	connection.on('deleted', () => {
		cancelScheduledReload();
		clip.value = null;
		notFound.value = true;
	});
}

watch(() => props.column.clipId, async (clipId) => {
	connectChannel();

	if (clipId == null) {
		clip.value = null;
		notFound.value = false;
		return;
	}

	try {
		const fetchedClip = await misskeyApi('clips/show', { clipId });
		clip.value = fetchedClip;
		notFound.value = false;
		if (props.column.timelineNameCache == null) {
			updateColumn(props.column.id, { timelineNameCache: fetchedClip.name });
		}
	} catch {
		clip.value = null;
		notFound.value = true;
	}
}, { immediate: true });

onMounted(() => {
	if (props.column.clipId == null) {
		setClip();
	}
});

onUnmounted(() => {
	disconnectChannel();
});

async function setClip() {
	const [myClips, favoritedClips] = await Promise.all([
		clipsCache.fetch(),
		favoritedClipsCache.fetch(),
	]);
	const otherFavoritedClips = favoritedClips.filter(x => !myClips.some(y => y.id === x.id));

	const { canceled, result: chosenClipId } = await os.select({
		title: i18n.ts.selectClip,
		items: [
			(myClips.length > 0 ? {
				type: 'group' as const,
				label: i18n.ts.clips,
				items: myClips.map(x => ({ value: x.id, label: x.name })),
			} : undefined),
			(otherFavoritedClips.length > 0 ? {
				type: 'group' as const,
				label: i18n.ts.favorites,
				items: otherFavoritedClips.map(x => ({ value: x.id, label: x.name })),
			} : undefined),
		],
		default: props.column.clipId,
	});
	if (canceled || chosenClipId == null) return;

	const chosenClip = [...myClips, ...favoritedClips].find(x => x.id === chosenClipId)!;
	updateColumn(props.column.id, {
		clipId: chosenClip.id,
		timelineNameCache: chosenClip.name,
	});
}

function openClip() {
	if (props.column.clipId == null) return;
	os.pageWindow('/clips/' + props.column.clipId);
}

const menu: MenuItem[] = [
	{
		icon: 'ti ti-pencil',
		text: i18n.ts.selectClip,
		action: setClip,
	},
	{
		icon: 'ti ti-paperclip',
		text: i18n.ts.show,
		action: openClip,
	},
];
</script>
