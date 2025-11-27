<!--
SPDX-FileCopyrightText: lqvp
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" class="mkw-listenBrainz">
	<template #icon><i class="ti ti-music"></i></template>
	<template #header>{{ i18n.ts._widgets.listenBrainz }}</template>
	<template #func="{ buttonStyleClass }">
		<button class="_button" :class="buttonStyleClass" @click="fetchPlayingNow()"><i class="ti ti-refresh"></i></button>
		<button class="_button" :class="buttonStyleClass" @click="configure()"><i class="ti ti-settings"></i></button>
	</template>

	<div :class="$style.root">
		<MkLoading v-if="fetching"/>
		<MkResult v-else-if="!playingNow" type="empty" :text="i18n.ts.noListeningMusic" :class="$style.result"/>
		<div v-else class="_gaps_s" style="display: flex; flex-direction: column; justify-content: center; align-items: center">
			<MkMfm :text="formattedNote"/>
			<MkButton primary @click="postNote">{{ i18n.ts.note }}</MkButton>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { GetFormResultType } from '@/utility/form.js';
import { $i } from '@/i.js';
import MkContainer from '@/components/MkContainer.vue';
import MkButton from '@/components/MkButton.vue';
import MkLoading from '@/components/global/MkLoading.vue';
import MkResult from '@/components/global/MkResult.vue';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import MkMfm from '@/components/global/MkMfm.js';

const name = i18n.ts._widgets.listenBrainz;

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
	userId: {
		type: 'string' as const,
		default: '',
	},
	noteFormat: {
		type: 'string' as const,
		multiline: true,
		default: '{artist_name} - {track_name} ({media_player}/{music_service_name}/{client}) {url} #nowplaying',
	},
	visibility: {
		type: 'enum' as const,
		default: 'home' as const,
		enum: [
			{ label: 'Public', value: 'public' },
			{ label: 'Home', value: 'home' },
			{ label: 'Followers', value: 'followers' },
		],
	},
	localOnly: {
		type: 'boolean' as const,
		default: false,
	},
	refreshIntervalSec: {
		type: 'number' as const,
		default: 60,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

// ListenBrainzのトラックメタデータ型定義
type TrackMetadata = {
	artist_name?: string;
	track_name?: string;
	additional_info?: {
		media_player?: string;
		music_service_name?: string;
		origin_url?: string;
		submission_client?: string;
		[key: string]: unknown;
	};
	[key: string]: unknown;
};

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure, save } = useWidgetPropsManager(name, widgetPropsDef, props, emit);

// ウィジット初期化時にユーザープロフィールのListenBrainzIDを設定
onMounted(() => {
	if (!widgetProps.userId && $i && $i.listenbrainz) {
		widgetProps.userId = $i.listenbrainz;
		save();
	}

	if (widgetProps.refreshIntervalSec > 0) {
		intervalId = window.setInterval(fetchPlayingNow, widgetProps.refreshIntervalSec * 1000);
	}
});

const playingNow = ref(false);
const trackMetadata = ref<TrackMetadata | null>(null);
const fetching = ref(true);
let intervalId: number | null = null;

const formattedNote = computed(() => {
	if (!trackMetadata.value) return '';
	return widgetProps.noteFormat
		.replace('{artist_name}', trackMetadata.value.artist_name ?? '')
		.replace('{track_name}', trackMetadata.value.track_name ?? '')
		.replace('{media_player}', trackMetadata.value.additional_info?.media_player ?? '')
		.replace('{music_service_name}', trackMetadata.value.additional_info?.music_service_name ?? '')
		.replace('{url}', trackMetadata.value.additional_info?.origin_url ?? '')
		.replace('{client}', trackMetadata.value.additional_info?.submission_client ?? '');
});

const fetchPlayingNow = async () => {
	fetching.value = true;
	if (!widgetProps.userId) return;

	const url = `https://api.listenbrainz.org/1/user/${widgetProps.userId}/playing-now`;
	const response = await window.fetch(url);
	const data = await response.json();

	if (data.payload.count > 0) {
		playingNow.value = true;
		trackMetadata.value = data.payload.listens[0].track_metadata;
	} else {
		playingNow.value = false;
		trackMetadata.value = null;
	}

	fetching.value = false;
};

const postNote = async () => {
	if (!trackMetadata.value) return;

	const note = formattedNote.value;
	misskeyApi('notes/create', {
		text: note,
		visibility: widgetProps.visibility as 'public' | 'home' | 'followers' | 'specified',
		localOnly: widgetProps.localOnly,
	});
};

watch(() => widgetProps.userId, fetchPlayingNow, { immediate: true });

watch(
	() => widgetProps.refreshIntervalSec,
	(newInterval) => {
		if (intervalId) window.clearInterval(intervalId);
		if (newInterval > 0) {
			intervalId = window.setInterval(fetchPlayingNow, newInterval * 1000);
		}
	},
	{ immediate: true },
);

onMounted(() => {
	if (widgetProps.refreshIntervalSec > 0) {
		intervalId = window.setInterval(fetchPlayingNow, widgetProps.refreshIntervalSec * 1000);
	}
});

onUnmounted(() => {
	if (intervalId) window.clearInterval(intervalId);
});

// 反応性を保持するため、computedを使用
const widgetId = computed(() => (props.widget ? props.widget.id : null));

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	get id() {
		return widgetId.value;
	},
});
</script>

<style lang="scss" module>
.root {
  padding: 16px;
}

.result {
  text-align: center;
}
</style>
