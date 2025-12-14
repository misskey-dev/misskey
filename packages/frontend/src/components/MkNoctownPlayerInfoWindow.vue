<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.overlay" @click.self="handleClose" @keydown.escape="handleClose" tabindex="-1" ref="overlayRef">
	<div :class="$style.window">
		<button :class="$style.closeButton" @click="handleClose">
			<i class="ti ti-x"></i>
		</button>

		<div :class="$style.content">
			<!-- Avatar (clickable to navigate to profile) -->
			<!-- 仕様: アバターをクリックするとそのユーザーのプロフィールページに遷移する -->
			<a :href="profileUrl" :class="$style.avatarWrapper" @click="handleAvatarClick">
				<img :src="avatarUrl || defaultAvatar" :class="$style.avatar" alt="avatar" />
			</a>

			<!-- Name (shown if not empty, MFM rendered) -->
			<!-- 仕様: nameにはMFMを適用してカスタム絵文字などを表示可能にする -->
			<div v-if="name" :class="$style.name">
				<Mfm :text="name" :plain="true" :nowrap="true"/>
			</div>

			<!-- Username (always shown) -->
			<!-- nameが空の場合は通常サイズ、nameがある場合は小さめフォント -->
			<div :class="name ? $style.username : $style.usernameOnly">@{{ username }}</div>

			<!-- Follow button (shown only when not following) -->
			<!-- 仕様: まだフォローしていない場合のみフォローボタンを表示 -->
			<button
				v-if="showFollowButton"
				:class="[$style.followButton, { [$style.followButtonWait]: isFollowLoading }]"
				:disabled="isFollowLoading"
				@click="handleFollow"
			>
				<i v-if="isFollowLoading" class="ti ti-loader-2" :class="$style.spinner"></i>
				<i v-else class="ti ti-user-plus"></i>
				<span>{{ followButtonText }}</span>
			</button>

			<!-- Ping info -->
			<div :class="$style.pingInfo">
				<span :class="$style.pingLabel">Ping:</span>
				<span :class="[$style.pingValue, pingColorClass]">
					{{ pingTime !== null ? `${pingTime}ms` : 'Measuring...' }}
				</span>
			</div>

			<!-- Manual ping button -->
			<button :class="$style.pingButton" @click="handlePing" :disabled="isPinging">
				<i v-if="isPinging" class="ti ti-loader-2" :class="$style.spinner"></i>
				<i v-else class="ti ti-radar-2"></i>
				<span>Ping</span>
			</button>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
import { userPage } from '@/filters/user.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/i.js';
import { prefer } from '@/preferences.js';
import * as os from '@/os.js';

const props = defineProps<{
	playerId: string;
	name: string | null;
	username: string;
	avatarUrl: string | null;
	pingTime: number | null;
	isPinging: boolean;
	userId?: string; // MisskeyユーザーID（フォロー機能で使用）
}>();

const emit = defineEmits<{
	(e: 'close'): void;
	(e: 'ping'): void;
}>();

const overlayRef = ref<HTMLElement | null>(null);

// フォロー関連の状態
// 仕様: ユーザー情報を取得してフォロー状態を判定
const isFollowing = ref<boolean | null>(null);
const hasPendingFollowRequest = ref(false);
const isFollowLoading = ref(false);
const userInfo = ref<{ id: string; isLocked: boolean } | null>(null);

const defaultAvatar = computed(() => {
	const host = location.host;
	return `https://${host}/identicon/${props.username}@${host}`;
});

// 仕様: プロフィールページへのURL（ローカルユーザーを想定）
const profileUrl = computed(() => {
	return userPage({ username: props.username, host: null });
});

// 仕様: フォローボタンを表示するかどうか
// - ログイン済み（$iが存在）
// - 自分自身ではない
// - フォロー状態の取得が完了している（isFollowing !== null）
// - まだフォローしていない、かつフォローリクエスト中でもない
const showFollowButton = computed(() => {
	if (!$i) return false;
	if (userInfo.value && userInfo.value.id === $i.id) return false;
	if (isFollowing.value === null) return false;
	return !isFollowing.value && !hasPendingFollowRequest.value;
});

// 仕様: フォローボタンのテキスト（鍵アカウントの場合はフォローリクエスト）
const followButtonText = computed(() => {
	if (userInfo.value?.isLocked) {
		return i18n.ts.followRequest;
	}
	return i18n.ts.follow;
});

const pingColorClass = computed(() => {
	if (props.pingTime === null) return '';
	if (props.pingTime < 100) return 'pingGood';
	if (props.pingTime < 300) return 'pingMedium';
	return 'pingBad';
});

function handleClose() {
	emit('close');
}

function handlePing() {
	emit('ping');
}

// 仕様: アバタークリック時にプロフィールページに遷移
// ウィンドウを閉じてから遷移する
function handleAvatarClick(event: MouseEvent) {
	// デフォルトのリンク動作は維持するが、ウィンドウは閉じる
	emit('close');
}

// 仕様: フォローボタンクリック時の処理
async function handleFollow() {
	if (!userInfo.value || isFollowLoading.value) return;

	// フォロー確認ダイアログ（設定による）
	if (prefer.s.alwaysConfirmFollow) {
		const { canceled } = await os.confirm({
			type: 'question',
			text: i18n.tsx.followConfirm({ name: props.name || props.username }),
		});
		if (canceled) return;
	}

	isFollowLoading.value = true;

	try {
		await misskeyApi('following/create', {
			userId: userInfo.value.id,
			withReplies: prefer.s.defaultFollowWithReplies,
		});

		// 鍵アカウントの場合はフォローリクエスト中になる
		if (userInfo.value.isLocked) {
			hasPendingFollowRequest.value = true;
		} else {
			isFollowing.value = true;
		}
	} catch (err) {
		console.error('Failed to follow:', err);
		os.alert({
			type: 'error',
			text: String(err),
		});
	} finally {
		isFollowLoading.value = false;
	}
}

// 仕様: ユーザー情報を取得してフォロー状態を判定
async function fetchUserInfo() {
	if (!$i) return;

	try {
		// usernameからユーザー情報を取得
		const user = await misskeyApi('users/show', {
			username: props.username,
			host: null, // ローカルユーザー
		});

		userInfo.value = {
			id: user.id,
			isLocked: user.isLocked ?? false,
		};
		isFollowing.value = user.isFollowing ?? false;
		hasPendingFollowRequest.value = user.hasPendingFollowRequestFromYou ?? false;
	} catch (err) {
		console.error('Failed to fetch user info:', err);
		// エラー時はフォローボタンを表示しない
		isFollowing.value = null;
	}
}

onMounted(() => {
	overlayRef.value?.focus();
	fetchUserInfo();
});

// usernameが変更された場合は再取得
watch(() => props.username, () => {
	isFollowing.value = null;
	hasPendingFollowRequest.value = false;
	userInfo.value = null;
	fetchUserInfo();
});
</script>

<style lang="scss" module>
.overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10000;
	outline: none;
}

.window {
	background: var(--MI_THEME-panel);
	border-radius: 12px;
	padding: 24px;
	min-width: 280px;
	max-width: 90vw;
	position: relative;
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

.closeButton {
	position: absolute;
	top: 8px;
	right: 8px;
	background: none;
	border: none;
	cursor: pointer;
	padding: 8px;
	color: var(--MI_THEME-fg);
	opacity: 0.7;
	border-radius: 50%;
	transition: background 0.15s, opacity 0.15s;

	&:hover {
		opacity: 1;
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.content {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
}

// 仕様: アバターをクリックするとプロフィールに遷移（リンクとして機能）
.avatarWrapper {
	width: 80px;
	height: 80px;
	border-radius: 50%;
	overflow: hidden;
	background: var(--MI_THEME-bg);
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: transform 0.15s, box-shadow 0.15s;
	text-decoration: none;

	&:hover {
		transform: scale(1.05);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}
}

.avatar {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.name {
	font-size: 18px;
	font-weight: bold;
	color: var(--MI_THEME-fg);
}

.username {
	font-size: 14px;
	color: var(--MI_THEME-fg);
	opacity: 0.7;
}

.usernameOnly {
	font-size: 18px;
	font-weight: bold;
	color: var(--MI_THEME-fg);
}

// 仕様: フォローボタン（未フォロー時のみ表示）
.followButton {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 20px;
	background: var(--MI_THEME-accent);
	color: #fff;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	font-size: 14px;
	font-weight: bold;
	transition: opacity 0.15s, transform 0.15s;

	&:hover:not(:disabled) {
		opacity: 0.9;
		transform: scale(1.02);
	}

	&:active:not(:disabled) {
		transform: scale(0.98);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
}

.followButtonWait {
	cursor: wait !important;
}

.pingInfo {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-top: 8px;
}

.pingLabel {
	color: var(--MI_THEME-fg);
	opacity: 0.7;
}

.pingValue {
	font-weight: bold;
	color: var(--MI_THEME-fg);
}

.pingValue:global(.pingGood) {
	color: #00ff00;
}

.pingValue:global(.pingMedium) {
	color: #ffff00;
}

.pingValue:global(.pingBad) {
	color: #ff4444;
}

.pingButton {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 20px;
	background: var(--MI_THEME-accent);
	color: #fff;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	font-size: 14px;
	margin-top: 8px;
	transition: opacity 0.15s;

	&:hover:not(:disabled) {
		opacity: 0.9;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
}

.spinner {
	animation: spin 1s linear infinite;
}

@keyframes spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}
</style>
