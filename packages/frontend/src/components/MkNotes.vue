<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkPagination
	ref="pagingComponent"
	:pagination="pagination"
	:disableAutoLoad="disableAutoLoad"
	@addedQueue="onAddedQueue"
	@removedQueue="onRemovedQueue"
>
	<template #empty>
		<div class="_fullinfo">
			<img :src="infoImageUrl" class="_ghost"/>
			<div>{{ i18n.ts.noNotes }}</div>
		</div>
	</template>

	<template #default="{ items: notes }">
		<div :class="[$style.root, { [$style.noGap]: noGap }]">
			<MkDateSeparatedList
				ref="notes"
				v-slot="{ item: note }"
				:items="notes"
				:direction="pagination.reversed ? 'up' : 'down'"
				:reversed="pagination.reversed"
				:noGap="noGap"
				:ad="true"
				:class="$style.notes"
			>
				<MkNote :key="note._featuredId_ || note._prId_ || note.id" :class="$style.note" :note="note" :withHardMute="true"/>
			</MkDateSeparatedList>
		</div>
	</template>
</MkPagination>
</template>

<script lang="ts" setup>
import { shallowRef, onUnmounted } from 'vue';
import MkNote from '@/components/MkNote.vue';
import MkDateSeparatedList from '@/components/MkDateSeparatedList.vue';
import MkPagination, { Paging } from '@/components/MkPagination.vue';
import { i18n } from '@/i18n.js';
import { infoImageUrl } from '@/instance.js';
import { MisskeyEntity } from '@/types/date-separated-list.js';
import { $i } from '@/account.js';
import { useStream } from '@/stream.js';

defineProps<{
	pagination: Paging;
	noGap?: boolean;
	disableAutoLoad?: boolean;
}>();

const pagingComponent = shallowRef<InstanceType<typeof MkPagination>>();

// ノート削除イベントを監視するためのストリーム
// キューに溜まっている状態だとストリーミング経由のノート削除イベントを検知できず、リロードするまでローカルに残ってしまう（レンダリング時に削除イベントをsubするため）
// キューに積まれたものは個別にノート削除イベントを監視し、キューに溜まったものがレンダリングされる前に削除されたノートについては、前もってキューから消すようにする。
const stream = $i ? useStream() : null;
stream?.on('noteUpdated', onNoteUpdated);

function onAddedQueue(item: MisskeyEntity) {
	if (!stream) {
		return;
	}

	stream.send('s', { id: item.id });
}

function onRemovedQueue(items: MisskeyEntity[]) {
	if (!stream) {
		return;
	}

	for (const item of items) {
		stream.send('un', { id: item.id });
	}
}

function onNoteUpdated(event: { id: string, type: string }) {
	if (event.type === 'deleted') {
		pagingComponent.value?.removeItem(event.id);
		stream?.send('un', { id: event.id });
	}
}

onUnmounted(() => {
	stream?.off('noteUpdated', onNoteUpdated);
});

defineExpose({
	pagingComponent,
});
</script>

<style lang="scss" module>
.root {
	&.noGap {
		> .notes {
			background: var(--panel);
		}
	}

	&:not(.noGap) {
		> .notes {
			background: var(--bg);

			.note {
				background: var(--panel);
				border-radius: var(--radius);
			}
		}
	}
}
</style>
