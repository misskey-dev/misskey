<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<MkContainer :showHeader="widgetProps.showHeader" class="mkw-activeUsers">
	<template #icon><i class="ti ti-users"></i></template>
	<template #header>{{ i18n.ts._widgets.activeUsers }}</template>
	<template #func="{ buttonStyleClass }">
		<button class="_button" :class="buttonStyleClass" @click="tick()"><i class="ti ti-refresh"></i></button>
		<button class="_button" :class="buttonStyleClass" @click="configure()"><i class="ti ti-settings"></i></button>
	</template>

	<div :class="$style.content">
		<div v-if="filteredActiveUsers.length > 0" :class="$style.users">
			<div v-for="user in filteredActiveUsers" :key="user.id || user.username" :class="$style.row">
				<MkAvatar :user="user" :class="$style.avatar" indicator link preview/>
				<div :class="$style.userInfo">
					<div :class="$style.name">
						<MkA :to="'/@' + user.username">
							<MkUserName :user="user"/>
						</MkA>
					</div>
					<div v-if="user.name && user.name !== user.username" :class="$style.username">@{{ user.username }}</div>
				</div>

				<!-- ミュートボタン (自分以外の場合) または透明プレースホルダー (自分の場合) -->
				<button
					v-if="$i && user.id !== $i.id"
					v-tooltip="i18n.ts.mute"
					:class="$style.muteButton"
					@click.stop="muteMember(user)"
				>
					<i class="ti ti-eye-off"></i>
				</button>
				<div v-else :class="$style.buttonPlaceholder"></div>

				<div :class="$style.date">
					<template v-if="user.onlineStatus !== 'unknown' && user.onlineStatus !== 'offline'">
						<MkTime v-if="user.updatedAt" :time="user.updatedAt" small/>
					</template>
					<template v-else>
						<span>{{ i18n.ts.private }}</span>
					</template>
				</div>
			</div>
		</div>
		<MkResult v-else type="empty" :text="!$i ? i18n.ts.signinRequired : i18n.ts.noActiveUsers" :class="$style.result"/>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import * as Misskey from 'misskey-js';
import { useInterval } from '@@/js/use-interval.js';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentProps, WidgetComponentEmits, WidgetComponentExpose } from './widget.js';
import type { GetFormResultType } from '@/utility/form.js';
import MkContainer from '@/components/MkContainer.vue';
import MkAvatar from '@/components/global/MkAvatar.vue';
import MkA from '@/components/global/MkA.vue';
import MkResult from '@/components/global/MkResult.vue';
import MkTime from '@/components/global/MkTime.vue';
import MkUserName from '@/components/global/MkUserName.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { useStream } from '@/stream.js';
import { i18n } from '@/i18n';
import { $i } from '@/i.js';
import { playMisskeySfx } from '@/utility/sound.js';
import { getUserMenu } from '@/utility/get-user-menu.js';
import type { MenuButton } from '@/types/menu.js';

const name = i18n.ts._widgets.activeUsers;

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
	transparent: {
		type: 'boolean' as const,
		default: false,
	},
	sound: {
		type: 'boolean' as const,
		default: true,
	},
	place: {
		type: 'string' as const,
		default: 'right',
		hidden: true,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const activeUsers = ref<any[]>([]);
const prevUserIds = ref(new Set<string>());
const connection = ref<any>(null);
const isLoggedIn = computed(() => $i != null);
const userMutings = ref(new Set<string>()); // ミュートしているユーザーのIDを保持 (表示フィルタリング用に残す)

// ミュート情報を取得する関数を強化
async function fetchMutings() {
	if (!isLoggedIn.value) return;

	try {
		const mutings = await misskeyApi('mute/list');
		// 前回のミュートリストと比較
		const previousMutings = new Set(userMutings.value);
		const newMutings = new Set(mutings.map(m => m.muteeId));

		// 新しいミュートリストをセット
		userMutings.value = newMutings;

		// 解除されたミュートがあり、かつアクティブユーザーリストが空でなければ再取得
		const unmuteDetected = [...previousMutings].some(id => !newMutings.has(id));
		if (unmuteDetected && activeUsers.value.length > 0) {
			console.log('Detected unmute changes, refreshing active users list');
			// ミュート解除を検出したらアクティブユーザーリストを再取得
			refreshActiveUsers();
		}
	} catch (err) {
		console.error('Failed to fetch mutings:', err);
	}
}

// アクティブユーザーリストのみを更新する関数を追加
async function refreshActiveUsers() {
	if (!isLoggedIn.value) return;

	try {
		const res = await misskeyApi('get-online-users-count');
		checkForNewUsers(res.details);
		activeUsers.value = res.details;
	} catch (err) {
		console.error('Failed to refresh active users:', err);
	}
}

// ミュートユーザーを除外した表示用のユーザーリストを生成 (表示フィルタリング用に残す)
const filteredActiveUsers = computed(() => {
	if (!activeUsers.value) return [];

	return activeUsers.value.filter(user =>
		!userMutings.value.has(user.id),
	);
});

// 新しいユーザーが表示された時に通知音を鳴らす
const checkForNewUsers = (users) => {
	if (!widgetProps.sound) return;

	const currentUserIds = new Set<string>(users.map((user: any) => user.id as string));
	const newUserIds = Array.from(currentUserIds).filter((id: string) =>
		!prevUserIds.value.has(id) && !userMutings.value.has(id),
	);

	// 初回ロード時は通知しない（prevUserIds.valueが空の場合）
	if (newUserIds.length > 0 && prevUserIds.value.size > 0) {
		// 通知音を正しい関数で鳴らす
		playMisskeySfx('notification');
	}

	// 現在のユーザーIDを保存
	prevUserIds.value = currentUserIds as Set<string>;
};

const tick = async () => {
	if (!isLoggedIn.value) {
		activeUsers.value = [];
		return;
	}

	try {
		// ミュートリストとアクティブユーザーを並行して取得
		await Promise.all([
			fetchMutings(),
			refreshActiveUsers(),
		]);
	} catch (err) {
		console.error('Failed to update widget data:', err);
		activeUsers.value = [];
	}
};

// WebSocketを使用したリアルタイム更新
const connectStream = () => {
	if (!isLoggedIn.value) return;

	// 既存の接続がある場合は切断
	if (connection.value) {
		connection.value.dispose();
	}

	// グローバルタイムラインのストリームに接続
	connection.value = useStream().useChannel('main');

	// ユーザーのステータス更新があった場合に再取得
	connection.value.on('userOnlineStatusChanged', () => {
		tick();
	});

	// ミュート関連のイベントリスナー
	connection.value.on('mute', mutee => {
		userMutings.value.add(mutee.id);
		// アクティブユーザーリストを更新
		activeUsers.value = activeUsers.value.filter(user => !userMutings.value.has(user.id));
	});

	// WebSocketイベントハンドラを強化
	connection.value.on('unmute', mutee => {
		// まずローカルのミュートリストを更新
		userMutings.value.delete(mutee.id);

		// ミュート情報を完全に再取得して同期
		fetchMutings().then(() => {
			// ミュート情報取得後にアクティブユーザーリストも更新
			tick();
		});
	});

	// 接続エラーや切断時の再接続ロジック
	connection.value.on('_disconnected_', () => {
		window.setTimeout(() => {
			connectStream();
		}, 3000); // 3秒後に再接続を試みる
	});
};

// ユーザーをミュートする
function muteMember(user) {
	if (!isLoggedIn.value || !user || !user.id) return;

	// getUserMenuから取得したメニュー項目からミュート機能を使用
	const { menu, cleanup } = getUserMenu(user);

	// ミュート関連のメニュー項目を探す部分を単純化
	const muteItem = menu.find(item =>
		'icon' in item && 'text' in item && item.icon === 'ti ti-eye-off' && item.text === i18n.ts.mute,
	) as MenuButton | undefined;

	if (muteItem && muteItem.action) {
		// 既存のミュート機能を実行（期間選択UIを含む）
		muteItem.action({} as MouseEvent);

		// ミュート実行後、少し待ってからユーザーを非表示にする
		window.setTimeout(() => {
			// ミュート成功後、手動でユーザーを非表示にする
			userMutings.value.add(user.id);
			activeUsers.value = activeUsers.value.filter(u => u.id !== user.id);
			fetchMutings(); // ミュートリストを再取得
		}, 500);
	}

	// 使い終わったらクリーンアップ
	cleanup();
}

// 初期化と定期更新
onMounted(() => {
	fetchMutings();
	tick();
	connectStream();
});

// クリーンアップ
onUnmounted(() => {
	if (connection.value) {
		connection.value.dispose();
	}
});

// ログイン状態が変化した場合に再接続
watch(isLoggedIn, (newValue) => {
	if (newValue) {
		fetchMutings();
		connectStream();
	} else if (connection.value) {
		connection.value.dispose();
		connection.value = null;
	}
});

// 定期更新は維持（バックアップとして）
useInterval(tick, 1000 * 30, {
	immediate: false, // すでにonMountedでtickを実行するのでfalse
	afterMounted: true,
});

// ミュート情報の同期頻度を上げる
useInterval(fetchMutings, 1000 * 20, { // 20秒ごとに確認
	immediate: false,
	afterMounted: true,
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.content {
    padding: 8px;
}

.users {
    text-align: left;
}

.result {
    margin-top: var(--MI-margin);
}

.row {
    display: grid;
    grid-template-columns: auto 1fr auto auto;  // 4列のグリッドに変更
    gap: 8px;
    margin-bottom: 6px;
    padding: 6px;
    border-radius: 6px;
    transition: background 0.2s;
    align-items: center;
    position: relative;  // 子要素の絶対配置のための基準

    &:hover {
        background: var(--MI_THEME-accentedBg);

        .muteButton {
            opacity: 0.7;  // ホバー時に表示
        }
    }
}

.avatar {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 5px;
}

.userInfo {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
}

.name {
    font-weight: bold;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.username {
    font-size: 0.85em;
    color: var(--MI_THEME-fgTransparentWeak);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.date {
    text-align: right;
    white-space: nowrap;
    font-size: 0.8em;
    color: var(--MI_THEME-fgTransparentWeak);

    :global(.time) {
        color: inherit;
    }
}

.muteButton {
  opacity: 0;  // 初期状態では非表示
  transition: opacity 0.2s, background 0.2s;
  background: none;
  border: none;
  padding: 4px;
  height: 28px;
  aspect-ratio: 1;
  color: var(--MI_THEME-fgTransparentWeak);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    opacity: 1;  // ボタンにホバーしたときは完全表示
    color: var(--MI_THEME-accent);
    background: var(--MI_THEME-buttonHoverBg);
  }
}

.buttonPlaceholder {
  width: 28px;  /* ミュートボタンと同じ幅 */
  height: 28px; /* ミュートボタンと同じ高さ */
  aspect-ratio: 1;
}
</style>
