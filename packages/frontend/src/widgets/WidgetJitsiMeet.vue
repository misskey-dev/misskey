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
				<a :href="optimizedUrl" target="_blank" rel="noopener noreferrer" :class="$style.roomLink">
					{{ widgetProps.roomName }}
					<i class="ti ti-external-link" :class="$style.externalIcon"></i>
				</a>
				<!-- ランダムルーム名生成ボタン - アイコンのみ -->
				<button
					class="_button" :class="$style.randomRoomButton" :disabled="meetingStarted"
					@click="generateRandomRoomName()"
				>
					<i class="ti ti-refresh"></i>
				</button>
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
			<div style="display: flex; justify-content: center; gap: 8px; margin-top: 8px; width: 100%;">
				<MkButton danger @click="endMeeting">
					<i class="ti ti-video-off"></i>
					{{ i18n.ts.endMeeting }}
				</MkButton>
				<MkButton primary @click="postNote">
					<i class="ti ti-share"></i>
					{{ i18n.ts.share }}
				</MkButton>
			</div>
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
import { misskeyApi } from '@/utility/misskey-api.js';

// ランダムルーム名生成のための単語リスト
const _ADJECTIVE_ = [
	'Thrilled', 'Amazing', 'Brilliant', 'Curious', 'Delightful', 'Exciting', 'Fantastic',
	'Gorgeous', 'Helpful', 'Incredible', 'Jolly', 'Kind', 'Lucky', 'Magnificent',
	'Notable', 'Optimistic', 'Peaceful', 'Quick', 'Remarkable', 'Stunning',
];

const _PLURALNOUN_ = [
	'Adventures', 'Blessings', 'Celebrations', 'Densities', 'Energies',
	'Festivities', 'Gatherings', 'Harmonies', 'Innovations', 'Journeys',
	'Kindnesses', 'Landscapes', 'Memories', 'Networks', 'Opportunities',
];

const _VERB_ = [
	'Achieve', 'Broadcast', 'Create', 'Discover', 'Embrace',
	'Flourish', 'Generate', 'Harmonize', 'Inspire', 'Journey',
	'Kindle', 'Launch', 'Motivate', 'Navigate', 'Observe',
];

const _ADVERB_ = [
	'Actively', 'Boldly', 'Clearly', 'Deeply', 'Efficiently',
	'Freely', 'Greatly', 'Happily', 'Instantly', 'Joyfully',
	'Kindly', 'Lively', 'Magically', 'Naturally', 'Openly',
	'Perfectly', 'Quickly', 'Remarkably', 'Seldom', 'Truly',
];

const name = i18n.ts._widgets.jitsiMeet;

const widgetPropsDef = {
	// 基本設定
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
	roomName: {
		type: 'string' as const,
		default: '', // 空文字に変更して、マウント時に自動生成できるようにする
	},
	domain: {
		type: 'string' as const,
		default: 'calls.disroot.org',
	},

	// 音声・ビデオ設定
	startWithAudioMuted: {
		type: 'boolean' as const,
		default: false, // 音声はデフォルトで有効
	},
	startWithVideoMuted: {
		type: 'boolean' as const,
		default: true, // ビデオはデフォルトで無効
	},
	startAudioOnly: {
		type: 'boolean' as const,
		default: false, // オーディオのみモード
	},

	// 表示設定
	skipPrejoinPage: {
		type: 'boolean' as const,
		default: true, // 参加前画面をスキップ
	},

	// 品質設定
	resolution: {
		type: 'enum' as const,
		default: '720' as const,
		enum: [
			{ value: '360', label: '低画質 (省データ通信)' },
			{ value: '540', label: '標準画質' },
			{ value: '720', label: '高画質' },
		],
	},

	// 共有設定
	autoShareOnStart: {
		type: 'boolean' as const,
		default: false,
	},
	noteFormat: {
		type: 'string' as const,
		multiline: true,
		default: '{startMeeting}\n\n会議ルーム: {roomName}\nリンク: {url}\n\n#JitsiMeet',
	},
	visibility: {
		type: 'enum' as const,
		default: 'followers' as const,
		enum: [
			{ label: 'Public', value: 'public' },
			{ label: 'Home', value: 'home' },
			{ label: 'Followers', value: 'followers' },
		],
	},
	localOnly: {
		type: 'boolean' as const,
		default: true,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure, save } = useWidgetPropsManager(name, widgetPropsDef, props, emit);

const loading = ref(false);
const meetingStarted = ref(false);
const containerId = ref(`jitsi-container-${Math.random().toString(36).substr(2, 9)}`);

// ランダムルーム名を生成する関数
const generateRandomRoomName = () => {
	// ランダム要素を選択するヘルパー関数
	const getRandomElement = (arr) => {
		const randomIndex = Math.floor(Math.random() * arr.length);
		return arr[randomIndex];
	};

	// 4つの単語カテゴリから単語を選び、結合してルーム名を作成
	const roomName =
		getRandomElement(_ADJECTIVE_) +
		getRandomElement(_PLURALNOUN_) +
		getRandomElement(_VERB_) +
		getRandomElement(_ADVERB_);

	// 生成したルーム名をウィジェットに設定して保存
	widgetProps.roomName = roomName;
	save();

	// 会議が進行中の場合は終了
	if (meetingStarted.value) {
		endMeeting();
	}

	return roomName;
};

// Room URL without parameters (for display only)
const roomUrl = computed(() => {
	return `https://${widgetProps.domain}/${widgetProps.roomName}`;
});

// Optimized URL with parameters (for actual linking)
const optimizedUrl = computed(() => {
	// Basic parameters
	const params = {};

	// 基本設定
	params['config.prejoinConfig.enabled'] = !widgetProps.skipPrejoinPage;
	params['config.startAudioOnly'] = widgetProps.startAudioOnly;

	// 音声・ビデオ設定
	params['config.startWithAudioMuted'] = widgetProps.startWithAudioMuted;
	params['config.startWithVideoMuted'] = widgetProps.startWithVideoMuted;

	// 品質設定
	if (widgetProps.resolution) {
		params['config.resolution'] = parseInt(widgetProps.resolution);
	}

	// Default basic functionality settings
	params['config.disableInitialGUM'] = false;
	params['config.notifications'] = [];
	params['config.disableTileEnlargement'] = true;

	// Flatten parameters and join
	const flattenedParams = Object.entries(params).map(([key, value]) => {
		let paramValue = typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
		return `${key}=${paramValue}`;
	}).join('&');

	// Return final URL with parameters
	return `${roomUrl.value}#${flattenedParams}`;
});

// Add the formattedNote computed property
const formattedNote = computed(() => {
	return widgetProps.noteFormat
		.replace('{startMeeting}', `📞 ${i18n.ts.startMeeting}`)
		.replace('{roomName}', widgetProps.roomName)
		.replace('{domain}', widgetProps.domain)
		.replace('{url}', optimizedUrl.value);
});

// Now postNote can reference formattedNote
const postNote = async () => {
	if (!meetingStarted.value) return;

	const note = formattedNote.value;
	await misskeyApi('notes/create', {
		text: note,
		visibility: widgetProps.visibility as 'public' | 'home' | 'followers' | 'specified',
		localOnly: widgetProps.localOnly,
	});
};

const startMeeting = async () => {
	if (!widgetProps.roomName) return;

	loading.value = true;
	try {
		meetingStarted.value = true;
		await nextTick();

		window.setTimeout(async () => {
			try {
				const displayName = $i?.name || $i?.username || 'Anonymous';
				const email = $i?.email || null;

				await jitsiApi.startMeeting(
					widgetProps.domain, // ← 1番目: ドメイン
					widgetProps.roomName, // ← 2番目: ルーム名
					containerId.value,
					displayName,
					email,
					{
						// 音声・ビデオ設定
						startWithAudioMuted: widgetProps.startWithAudioMuted,
						startWithVideoMuted: widgetProps.startWithVideoMuted,
						startAudioOnly: widgetProps.startAudioOnly,

						// 基本設定
						skipPrejoinPage: widgetProps.skipPrejoinPage,

						// 品質設定
						resolution: parseInt(widgetProps.resolution),

						// デフォルト値で固定する設定
						requestAudioPermission: true,
						requestVideoPermission: true,
						customBackgroundColor: '#966BFF',
						disableNotifications: true,
					},
				);

				if (widgetProps.autoShareOnStart) {
					await postNote();
				}
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

// 設定の変更を監視して保存する
watch(() => widgetProps.visibility, () => save());
watch(() => widgetProps.localOnly, () => save());
watch(() => widgetProps.noteFormat, () => save());
watch(() => widgetProps.autoShareOnStart, () => save());

// 残している設定の監視
watch(() => widgetProps.startAudioOnly, () => save());
watch(() => widgetProps.startWithAudioMuted, () => save());
watch(() => widgetProps.startWithVideoMuted, () => save());
watch(() => widgetProps.skipPrejoinPage, () => save());
watch(() => widgetProps.resolution, () => save());

onUnmounted(() => {
	jitsiApi.dispose();
});

onMounted(() => {
	// ルーム名が空または'default-room'の場合、初期ルーム名をランダム生成
	if (!widgetProps.roomName || widgetProps.roomName === 'default-room') {
		generateRandomRoomName();
	}
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

.roomInfo {
	margin-bottom: 16px;
	padding: 12px;
	background: var(--MI_THEME-panelHighlight);
	border-radius: 8px;
}

.roomHeader {
	display: flex;
	align-items: center;
}

.statusIndicator {
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background-color: var(--MI_THEME-fg);
	opacity: 0.3;
	margin-right: 8px;
	flex-shrink: 0;
	display: block;
	min-width: 12px;
	min-height: 12px;
	aspect-ratio: 1 / 1;
	line-height: 0;

	&.statusActive {
		background-color: rgb(46, 204, 113);
		opacity: 1;
		box-shadow: 0 0 8px rgb(46, 204, 113);
	}
}

.roomLink {
	display: flex;
	align-items: center;
	color: var(--MI_THEME-accent);
	text-decoration: none;
	font-weight: bold;
	word-break: break-all;

	&:hover {
		text-decoration: underline;
	}

	.externalIcon {
		margin-left: 4px;
		font-size: 0.9em;
	}
}

.randomRoomButton {
	display: flex;
	align-items: center;
	justify-content: center;
	margin-left: 8px;
	padding: 4px;
	background: var(--MI_THEME-buttonBg);
	color: var(--MI_THEME-accent);
	border-radius: 4px;
	border: none;
	cursor: pointer;
	transition: background 0.2s ease, opacity 0.2s ease;

	&:hover:not(:disabled) {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&:active:not(:disabled) {
		background: var(--MI_THEME-buttonHoverBg);
		transform: translateY(1px);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
}

.roomStatus {
	display: flex;
	justify-content: center;
	flex-direction: column;
	margin-top: 16px;
}

.result {
	padding: 24px;
}

.jitsiContainer {
	width: 100%;
	min-height: 400px;
	/* 最小高さを設定 */
	height: 60vh;
	/* ビューポート高さの60%を使用 */
	max-height: 600px;
	/* 大きすぎないように制限 */
	border-radius: 8px;
	overflow: hidden;

	/* スマホ向けの調整 */
	@media (max-width: 500px) {
		height: 70vh;
		/* モバイルではより大きな比率を使用 */
		min-height: 300px;
		/* モバイルでの最小高さ */
	}
}
</style>
