<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :menu="menu" :column="column" :isStacked="isStacked" :refresher="async () => { await timeline?.reloadTimeline() }">
	<template #header>
		<i class="ti ti-device-tv"></i><span style="margin-left: 8px;">{{ column.name || column.timelineNameCache || i18n.ts._deck._columns.channel }}</span>
	</template>

	<div v-if="column.channelId" class="_gaps_s">
		<MkPostForm v-if="$i && channel != null && channel.id === column.channelId && prefer.r.showFixedPostFormInChannel.value" :key="channel.id" :channel="channel" :class="$style.postForm" fixed :autofocus="false"/>
		<div v-else style="padding: 10px 8px 0; text-align: center;">
			<MkButton primary gradate rounded inline small @click="post"><i class="ti ti-pencil"></i></MkButton>
		</div>
		<MkStreamingNotesTimeline ref="timeline" src="channel" :channel="column.channelId"/>
	</div>
</XColumn>
</template>

<script lang="ts" setup>
import { onMounted, ref, shallowRef, watch, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import XColumn from './column.vue';
import type { Column } from '@/deck.js';
import type { MenuItem } from '@/types/menu.js';
import type { SoundStore } from '@/preferences/def.js';
import { updateColumn } from '@/deck.js';
import MkStreamingNotesTimeline from '@/components/MkStreamingNotesTimeline.vue';
import MkPostForm from '@/components/MkPostForm.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { favoritedChannelsCache } from '@/cache.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { prefer } from '@/preferences.js';
import { $i } from '@/i.js';
import { i18n } from '@/i18n.js';
import { soundSettingsButton } from '@/ui/deck/tl-note-notification.js';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const timeline = useTemplateRef('timeline');
const channel = shallowRef<Misskey.entities.Channel>();
const soundSetting = ref<SoundStore>(props.column.soundSetting ?? { type: null, volume: 1 });

watch([() => props.column.channelId, () => prefer.r.showFixedPostFormInChannel.value], ([newChannelId, showFixedPostForm], oldValue, onCleanup) => {
	if (newChannelId == null) {
		// 設定値の変更だけで選択ダイアログを開かないよう、初回実行時か channelId が変わったときのみ
		// (複数ソースの immediate watcher では初回の oldValue が空配列になる)
		if (oldValue == null || !(0 in oldValue) || oldValue[0] !== newChannelId) setChannel();
		return;
	}
	if (!showFixedPostForm && props.column.name) return;
	if (channel.value != null && channel.value.id === newChannelId) return;

	let invalidated = false;
	onCleanup(() => {
		invalidated = true;
	});
	misskeyApi('channels/show', { channelId: newChannelId })
		.then(value => {
			if (invalidated || props.column.channelId !== newChannelId) return;
			if (value.name !== props.column.timelineNameCache) {
				updateColumn(props.column.id, { timelineNameCache: value.name });
			}
			channel.value = value;
		})
		.catch(err => {
			if (invalidated || props.column.channelId !== newChannelId) return;
			console.error('Failed to fetch channel:', err);
		});
}, { immediate: true });

watch(soundSetting, v => {
	updateColumn(props.column.id, { soundSetting: v });
});

async function setChannel() {
	const channels = await favoritedChannelsCache.fetch();
	const { canceled, result: chosenChannelId } = await os.select({
		title: i18n.ts.selectChannel,
		items: channels.map(x => ({
			value: x.id, label: x.name,
		})),
		default: channels.find(x => x.id === props.column.channelId)?.id,
	});
	if (canceled || chosenChannelId == null) return;
	const chosenChannel = channels.find(x => x.id === chosenChannelId)!;
	updateColumn(props.column.id, {
		channelId: chosenChannel.id,
		timelineNameCache: chosenChannel.name,
	});
}

async function post() {
	if (props.column.channelId == null) return;
	if (!channel.value || channel.value.id !== props.column.channelId) {
		channel.value = await misskeyApi('channels/show', {
			channelId: props.column.channelId,
		});
	}

	os.post({
		channel: channel.value,
	});
}

const menu: MenuItem[] = [{
	icon: 'ti ti-pencil',
	text: i18n.ts.selectChannel,
	action: setChannel,
}, {
	icon: 'ti ti-bell',
	text: i18n.ts._deck.newNoteNotificationSettings,
	action: () => soundSettingsButton(soundSetting),
}];
</script>

<style module>
.postForm {
	background: var(--MI_THEME-panel);
	overflow: clip;
}
</style>
