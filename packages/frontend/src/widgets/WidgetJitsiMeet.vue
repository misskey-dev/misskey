<!--
SPDX-FileCopyrightText: hitalin
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" class="mkw-jitsiMeet">
	<template #icon><i class="ti ti-video"></i></template>
	<template #header>{{ i18n.ts._widgets.jitsiMeet }}</template>
	<template #func="{ buttonStyleClass }">
		<button class="_button" :class="buttonStyleClass" @click="toggleMeeting()">
			<i :class="meetingStarted ? 'ti ti-video-off' : 'ti ti-video'"></i>
		</button>
		<button class="_button" :class="buttonStyleClass" @click="configure()"><i class="ti ti-settings"></i></button>
	</template>

	<div :class="$style.root">
		<!-- ルーム情報を常に表示 -->
		<div :class="$style.roomInfo">
			<div :class="$style.roomHeader">
				<div :class="[$style.statusIndicator, { [$style.statusActive]: meetingStarted }]"></div>
				<a :href="roomUrl" target="_blank" rel="noopener noreferrer" :class="$style.roomLink" @click.stop>
					{{ widgetProps.domain }}/{{ widgetProps.roomName }}
					<i class="ti ti-external-link" :class="$style.externalIcon"></i>
				</a>
			</div>
		</div>

		<MkLoading v-if="loading"/>

		<!-- 会議未開始時の表示 -->
		<div v-else-if="!meetingStarted" :class="$style.roomStatus">
			<MkResult type="empty" :text="i18n.ts.noActiveMeeting" :class="$style.result">
				<div
					class="_gaps_s"
					style="display: flex; flex-direction: column; justify-content: center; align-items: center"
				>
					<MkButton primary @click="startMeeting">
						<i class="ti ti-video"></i>
						{{ i18n.ts.startMeeting }}
					</MkButton>
				</div>
			</MkResult>
		</div>

		<!-- 会議中の表示 -->
		<div
			v-else class="_gaps_s"
			style="display: flex; flex-direction: column; justify-content: center; align-items: center"
		>
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

// ルームURLを生成するcomputed
const roomUrl = computed(() => {
	return `https://${widgetProps.domain}/${widgetProps.roomName}`;
});

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
				const email = $i?.email || null;

				console.log('Misskey user info:', {
					displayName,
					email,
				});

				await jitsiApi.startMeeting(
					widgetProps.roomName,
					containerId.value,
					displayName,
					email,
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
    padding: 12px;
}

.result {
	text-align: center;
}

.roomStatus {
    margin-bottom: 12px;
}

.roomInfo {
    padding: 6px;
    margin-bottom: 8px;
}

.roomHeader {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--MI_THEME-fg);
}

.statusIndicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--MI_THEME-fgTransparentWeak);
    transition: all 0.3s ease;
    flex-shrink: 0;

    /* 非アクティブ時は薄いグレー */
    &:not(.statusActive) {
        background: var(--MI_THEME-divider);
        opacity: 0.5;
    }
}

.statusActive {
    /* アクティブ時は緑色で光る効果 */
    background: #4CAF50;
    box-shadow: 0 0 6px rgba(76, 175, 80, 0.4);
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% {
        box-shadow: 0 0 6px rgba(76, 175, 80, 0.4);
    }
    50% {
        box-shadow: 0 0 12px rgba(76, 175, 80, 0.8);
    }
}

.roomLink {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--MI_THEME-accent);
    text-decoration: none;
    font-weight: 500;
    padding: 4px 8px;
    border-radius: 6px;
    transition: all 0.2s ease;
    background: var(--MI_THEME-panel);
    border: 1px solid var(--MI_THEME-divider);

    &:hover {
        text-decoration: none;
        background: var(--MI_THEME-buttonHoverBg);
    }

    &:active {
        background: var(--MI_THEME-buttonHoverBg);
    }
}

.externalIcon {
    font-size: 0.75em;
    opacity: 0.8;
    transition: opacity 0.2s ease;
}

.roomLink:hover .externalIcon {
    opacity: 1;
}

.jitsiContainer {
    width: 100%;
    aspect-ratio: 4 / 3;
    height: auto;
    min-height: 450px;
    max-height: 650px;
    border-radius: 8px;
    overflow: hidden;
    background: var(--MI_THEME-panel);
    border: 1px solid var(--MI_THEME-divider);
    margin-bottom: 8px;
}

/* デスクトップ向けサイズ調整 */
@media (min-width: 768px) {
	.jitsiContainer {
		min-height: 500px;
		max-height: 750px;
		aspect-ratio: 4 / 3;
	}
}

/* タブレット向けサイズ調整 */
@media (max-width: 767px) and (min-width: 501px) {
	.jitsiContainer {
		min-height: 420px;
		max-height: 550px;
		aspect-ratio: 4 / 3;
	}
}

/* スマホ向けサイズ調整 */
@media (max-width: 500px) {
    .jitsiContainer {
        aspect-ratio: 4 / 3;
        min-height: 360px;
        max-height: 450px;
    }

    .root {
        padding: 8px;
    }
}

/* 小さなスマホ向け */
@media (max-width: 350px) {
	.jitsiContainer {
		min-height: 320px;
		max-height: 400px;
		aspect-ratio: 4 / 3;
	}
}
</style>
