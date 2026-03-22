<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<!-- デバッグパネル -->
	<div v-if="showDebugPanel" :class="$style.debugPanel">
		<div :class="$style.debugHeader">
			<h4>デバッグ情報</h4>
			<button :class="$style.debugCloseButton" @click="$emit('close')">×</button>
		</div>
		<div :class="$style.debugContent">
			<div :class="$style.debugSection">
				<h5>📱 デバイス</h5>
				<p>DPR: {{ debugInfo.device.devicePixelRatio }}</p>
				<p>Type: {{ debugInfo.device.userAgent }}</p>
				<p>Touch: {{ debugInfo.device.touchDevice }}</p>
			</div>
			<div :class="$style.debugSection">
				<h5>📐 サイズ</h5>
				<p>物理: {{ debugInfo.sizes.physical }}</p>
				<p>CSS: {{ debugInfo.sizes.cssStyle }}</p>
				<p>表示: {{ debugInfo.sizes.actualDisplay }}</p>
				<p>論理: {{ debugInfo.sizes.logical }}</p>
				<p>描画サイズ: {{ debugInfo.sizes.displaySize }}</p>
			</div>
			<div :class="$style.debugSection">
				<h5>🎯 座標変換</h5>
				<p>スクリーン: {{ debugInfo.input.screen }}</p>
				<p>要素内: {{ debugInfo.input.element }}</p>
				<p>正規化: {{ debugInfo.input.normalized }}</p>
				<p>表示: {{ debugInfo.input.display }}</p>
				<p>最終: {{ debugInfo.final.coordinates }}</p>
			</div>
			<div :class="$style.debugSection">
				<h5>⚖️ スケール・比率</h5>
				<p>スケール: {{ debugInfo.scales.scale }}</p>
				<p>比率: {{ debugInfo.scales.aspectRatio }}</p>
				<p>変換サイズ: {{ debugInfo.scales.transformedSize }}</p>
			</div>
			<div :class="$style.debugSection">
				<h5>🔄 変換</h5>
				<p>パン: {{ debugInfo.transform.panOffset }}</p>
				<p>ズーム: {{ debugInfo.transform.zoomLevel }}</p>
				<p>中心: {{ debugInfo.transform.zoomCenter }}</p>
			</div>
			<div :class="$style.debugSection">
				<h5>👆 リアルタイム座標</h5>
				<p>状態: {{ realtimeCoords.isActive ? 'タッチ中' : '待機中' }}</p>
				<p>スクリーン: {{ realtimeCoords.screen }}</p>
				<p>キャンバス: {{ realtimeCoords.canvas }}</p>
			</div>
			<div :class="$style.debugSection">
				<h5>🕒 更新: {{ debugInfo.lastUpdate }}</h5>
			</div>
		</div>
	</div>

	<!-- 通信ログパネル -->
	<div v-if="showCommLogPanel" :class="$style.commLogPanel">
		<div :class="$style.commLogHeader">
			<h4>通信ログ</h4>
			<div :class="$style.commLogActions">
				<button :class="$style.commLogClearButton" @click="$emit('clearLog')">クリア</button>
				<button :class="$style.commLogCloseButton" @click="$emit('closeLog')">×</button>
			</div>
		</div>
		<div :class="$style.commLogContent">
			<div v-if="communicationLog.length === 0" :class="$style.commLogEmpty">
				通信ログがありません
			</div>
			<div
				v-for="(log, index) in communicationLog.slice().reverse()"
				:key="index"
				:class="[$style.commLogEntry, $style[`commLog${log.direction}`]]"
			>
				<div :class="$style.commLogTime">{{ formatTime(log.timestamp) }}</div>
				<div :class="$style.commLogType">
					<span :class="$style.commLogDirection">{{ log.direction === 'send' ? '送信' : '受信' }}</span>
					<span :class="$style.commLogEventType">{{ log.type }}</span>
				</div>
				<div :class="$style.commLogData">
					<pre>{{ formatLogData(log.data) }}</pre>
				</div>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import type { DebugInfo, RealtimeCoords, CommunicationLog } from './room.drawing.types.js';

const props = defineProps<{
	showDebugPanel: boolean;
	showCommLogPanel: boolean;
	debugInfo: DebugInfo;
	realtimeCoords: RealtimeCoords;
	communicationLog: CommunicationLog[];
}>();

defineEmits<{
	close: [];
	closeLog: [];
	clearLog: [];
}>();

function formatTime(timestamp: number): string {
	const date = new Date(timestamp);
	return date.toLocaleTimeString('ja-JP', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
}

function formatLogData(data: any): string {
	if (typeof data === 'object') {
		if (Array.isArray(data)) {
			return `Array(${data.length})`;
		} else {
			return JSON.stringify(data, null, 2);
		}
	}
	return String(data);
}
</script>

<style lang="scss" module>
.debugPanel,
.commLogPanel {
	position: fixed;
	top: 80px;
	right: 20px;
	width: 400px;
	max-height: calc(100vh - 120px);
	background: var(--MI_THEME-panel);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 8px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	z-index: 1000;
	overflow: hidden;
	display: flex;
	flex-direction: column;
}

.debugHeader,
.commLogHeader {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 16px;
	background: var(--MI_THEME-bg);
	border-bottom: 1px solid var(--MI_THEME-divider);

	h4 {
		margin: 0;
		font-size: 14px;
		font-weight: 600;
		color: var(--MI_THEME-fg);
	}
}

.debugCloseButton,
.commLogCloseButton {
	background: none;
	border: none;
	font-size: 20px;
	cursor: pointer;
	color: var(--MI_THEME-fg);
	padding: 0;
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 4px;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.debugContent,
.commLogContent {
	overflow-y: auto;
	padding: 12px;
	flex: 1;
}

.debugSection {
	margin-bottom: 16px;
	padding: 12px;
	background: var(--MI_THEME-bg);
	border-radius: 6px;

	h5 {
		margin: 0 0 8px 0;
		font-size: 13px;
		font-weight: 600;
		color: var(--MI_THEME-accent);
	}

	p {
		margin: 4px 0;
		font-size: 11px;
		font-family: monospace;
		color: var(--MI_THEME-fg);
		line-height: 1.6;
	}
}

.commLogActions {
	display: flex;
	gap: 8px;
}

.commLogClearButton {
	padding: 4px 12px;
	background: var(--MI_THEME-buttonBg);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 4px;
	cursor: pointer;
	font-size: 12px;
	color: var(--MI_THEME-fg);

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.commLogEmpty {
	text-align: center;
	padding: 20px;
	color: var(--MI_THEME-fgTransparentWeak);
	font-size: 13px;
}

.commLogEntry {
	margin-bottom: 8px;
	padding: 8px;
	background: var(--MI_THEME-bg);
	border-radius: 4px;
	border-left: 3px solid transparent;

	&.commLogsend {
		border-left-color: var(--MI_THEME-accent);
	}

	&.commLogreceive {
		border-left-color: #27ae60;
	}
}

.commLogTime {
	font-size: 10px;
	color: var(--MI_THEME-fgTransparentWeak);
	font-family: monospace;
	margin-bottom: 4px;
}

.commLogType {
	display: flex;
	gap: 8px;
	margin-bottom: 6px;
}

.commLogDirection {
	font-size: 11px;
	font-weight: 600;
	padding: 2px 6px;
	background: var(--MI_THEME-buttonBg);
	border-radius: 3px;
	color: var(--MI_THEME-fg);
}

.commLogEventType {
	font-size: 11px;
	font-weight: 600;
	color: var(--MI_THEME-accent);
	font-family: monospace;
}

.commLogData {
	pre {
		margin: 0;
		font-size: 10px;
		font-family: monospace;
		color: var(--MI_THEME-fg);
		white-space: pre-wrap;
		word-break: break-all;
		max-height: 100px;
		overflow-y: auto;
		padding: 6px;
		background: var(--MI_THEME-panel);
		border-radius: 3px;
	}
}
</style>
