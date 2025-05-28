<!--
SPDX-FileCopyrightText: hitalin
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" class="mkw-jitsiMeet">
	<template #icon><i class="ti ti-video"></i></template>
	<template #header>{{ i18n.ts._widgets.jitsiMeet }}: {{ widgetProps.roomName }}</template>
	<template #func="{ buttonStyleClass }">
		<button class="_button" :class="buttonStyleClass" @click="toggleMeeting()">
			<i :class="meetingStarted ? 'ti ti-video-off' : 'ti ti-video'"></i>
		</button>
		<button class="_button" :class="buttonStyleClass" @click="configure()"><i class="ti ti-settings"></i></button>
	</template>

	<div :class="$style.root">
		<MkLoading v-if="loading"/>
		<MkResult v-else-if="!meetingStarted" type="empty" :text="i18n.ts.noActiveMeeting" :class="$style.result">
			<div class="_gaps_s" style="display: flex; flex-direction: column; justify-content: center; align-items: center">
				<MkButton primary @click="startMeeting">
					<i class="ti ti-video"></i>
					{{ i18n.ts.startMeeting }}
				</MkButton>
			</div>
		</MkResult>
		<div v-else class="_gaps_s" style="display: flex; flex-direction: column; justify-content: center; align-items: center">
			<div :id="containerId" :class="$style.jitsiContainer"></div>
			<MkButton danger @click="endMeeting">
				<i class="ti ti-video-off"></i>
				{{ i18n.ts.endMeeting }}
			</MkButton>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { GetFormResultType } from '@/utility/form.js';
import MkContainer from '@/components/MkContainer.vue';
import MkButton from '@/components/MkButton.vue';
import MkLoading from '@/components/global/MkLoading.vue';
import MkResult from '@/components/global/MkResult.vue';
import { i18n } from '@/i18n.js';
import { jitsiApi } from '@/utility/jitsi-api.js';
import { $i } from '@/i.js';

const name = i18n.ts._widgets.jitsiMeet;

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
	roomName: {
		type: 'string' as const,
		default: 'default-room',
	},
	domain: {
		type: 'string' as const,
		default: 'call.yami.ski',
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(name, widgetPropsDef, props, emit);

const loading = ref(false);
const meetingStarted = ref(false);
const containerId = ref(`jitsi-container-${Math.random().toString(36).substr(2, 9)}`);

const startMeeting = async () => {
	if (!widgetProps.roomName) return;

	loading.value = true;
	try {
		// まずmeetingStartedをtrueにしてDOMをレンダリング
		meetingStarted.value = true;

		// nextTickでDOMの更新を待つ
		await nextTick();

		// 少し待ってからJitsi APIを呼び出す
		setTimeout(async () => {
			try {
				// $iから現在のユーザー情報を取得
				const displayName = $i?.name || $i?.username || 'Anonymous';
				const email = $i?.email || null; // メールアドレスのみ取得

				console.log('Misskey user info:', {
					displayName,
					email,
				});

				await jitsiApi.startMeeting(
					widgetProps.roomName,
					containerId.value,
					displayName,
					email, // メールアドレスのみを渡す
				);
			} catch (error) {
				console.error('Failed to start meeting:', error);
				meetingStarted.value = false;
			}
		}, 100);
	} catch (error) {
		console.error('Failed to start meeting:', error);
		meetingStarted.value = false;
	} finally {
		loading.value = false;
	}
};

const endMeeting = () => {
	jitsiApi.dispose();
	meetingStarted.value = false;
};

const toggleMeeting = () => {
	if (meetingStarted.value) {
		endMeeting();
	} else {
		startMeeting();
	}
};

watch(() => widgetProps.roomName, () => {
	if (meetingStarted.value) {
		endMeeting();
	}
});

onUnmounted(() => {
	jitsiApi.dispose();
});

onMounted(() => {
	console.log('JitsiMeet widget mounted:', {
		widgetProps: widgetProps,
		props: props,
		name: name,
	});
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

.roomInfo {
    font-size: 0.85em;
    color: var(--MI_THEME-fgTransparentWeak);
    margin-bottom: 8px;
}

.meetingHeader {
    width: 100%;
    padding: 8px 12px;
    background: var(--MI_THEME-accentedBg);
    border-radius: 6px;
    margin-bottom: 12px;
}

.meetingInfo {
    display: flex;
    flex-direction: column;
}

.meetingTitle {
    font-weight: bold;
    color: var(--MI_THEME-fg);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.meetingStatus {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 0.9em;
}

.statusText {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--MI_THEME-fgTransparentWeak);
    font-size: 0.85em;
}

.statusIcon {
    color: #00d400;
    font-size: 0.8em;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.jitsiContainer {
    width: 100%;
    aspect-ratio: 4 / 3;
    height: auto;
    min-height: 450px; /* 400px → 450px に増加 */
    max-height: 650px; /* 600px → 650px に増加 */
    border-radius: 8px;
    overflow: hidden;
    background: var(--MI_THEME-panel);
    border: 1px solid var(--MI_THEME-divider);
    margin-bottom: 12px;
}

/* デスクトップ向けサイズ調整 */
@media (min-width: 768px) {
    .jitsiContainer {
        min-height: 500px; /* 450px → 500px に増加 */
        max-height: 750px; /* 700px → 750px に増加 */
        aspect-ratio: 4 / 3;
    }
}

/* タブレット向けサイズ調整 */
@media (max-width: 767px) and (min-width: 501px) {
    .jitsiContainer {
        min-height: 420px; /* 380px → 420px に増加 */
        max-height: 550px; /* 500px → 550px に増加 */
        aspect-ratio: 4 / 3;
    }
}

/* スマホ向けサイズ調整 */
@media (max-width: 500px) {
    .jitsiContainer {
        aspect-ratio: 4 / 3;
        min-height: 360px; /* 320px → 360px に増加 */
        max-height: 450px; /* 400px → 450px に増加 */
    }

    .root {
        padding: 12px;
    }
}

/* 小さなスマホ向け */
@media (max-width: 350px) {
    .jitsiContainer {
        min-height: 320px; /* 280px → 320px に増加 */
        max-height: 400px; /* 350px → 400px に増加 */
        aspect-ratio: 4 / 3;
    }
}
</style>
