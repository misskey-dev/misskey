<!--
SPDX-FileCopyrightText: lqvp
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" class="mkw-listenBrainz">
	<template #icon><i class="ti ti-music"></i></template>
	<template #header>{{ i18n.ts._widgets.listenBrainz }}</template>
	<template #func="{ buttonStyleClass }">
		<button class="_button" :class="buttonStyleClass" @click="configure()"><i class="ti ti-settings"></i></button>
		<button class="_button" :class="buttonStyleClass" @click="fetchPlayingNow()"><i class="ti ti-refresh"></i></button>
	</template>

	<div :class="$style.root">
		<MkLoading v-if="fetching"/>
		<div v-else-if="!playingNow" style="text-align: center;">
			<img :src="infoImageUrl" class="_ghost"/>
			<div>{{ i18n.ts.nothing }}</div>
		</div>
		<div v-else class="_gaps_s" style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
			<div>{{ formattedNote }}</div>
			<MkButton primary @click="postNote">{{ i18n.ts.note }}</MkButton>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useWidgetPropsManager, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import { GetFormResultType } from '@/scripts/form.js';
import MkContainer from '@/components/MkContainer.vue';
import MkButton from '@/components/MkButton.vue';
import MkLoading from '@/components/global/MkLoading.vue';
import { i18n } from '@/i18n.js';
import { infoImageUrl } from '@/instance.js';
import { misskeyApi } from '@/scripts/misskey-api.js';

const name = i18n.ts._widgets.listenBrainz;

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
	userId: {
		type: 'string' as const,
		default: null,
	},
	noteFormat: {
		type: 'string' as const,
		default: '{artist_name}{track_name}',
	},
};

		type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure, save } = useWidgetPropsManager(name, widgetPropsDef, props, emit);

const playingNow = ref(false);
const trackMetadata = ref<any>(null);
const fetching = ref(true);

const formattedNote = computed(() => {
	if (!trackMetadata.value) return '';
	return widgetProps.noteFormat
		.replace('{artist_name}', trackMetadata.value.artist_name)
		.replace('{track_name}', trackMetadata.value.track_name)
		.replace('{media_player}', trackMetadata.value.additional_info?.media_player)
		.replace('{music_service_name}', trackMetadata.value.additional_info?.music_service_name)
		.replace('{url}', trackMetadata.value.additional_info?.origin_url)
		.replace('{client}', trackMetadata.value.additional_info?.submission_client);
});

const fetchPlayingNow = async () => {
	fetching.value = true;
	if (!widgetProps.userId) return;

	const url = `https://api.listenbrainz.org/1/user/${widgetProps.userId}/playing-now`;
	const response = await fetch(url);
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
		visibility: 'public',
	});
};

watch(() => widgetProps.userId, fetchPlayingNow, { immediate: true });

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.root {
		padding: 16px;
}
</style>
