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
				<MkAvatar :user="user as unknown as Misskey.entities.User" :class="$style.avatar" indicator link preview/>
				<div :class="$style.userInfo">
					<div :class="$style.name">
						<MkA :to="'/@' + user.username">
							<MkUserName :user="user as unknown as Misskey.entities.User"/>
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
						<MkTime v-if="user.lastActiveDate" :time="user.lastActiveDate" small/>
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
import type { MenuButton } from '@/types/menu.js';
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

// yamisskey独自: get-online-users-countエンドポイントの戻り値型
// 本家Misskeyには存在しない独自拡張のため、手動で型定義
// バックエンドのレスポンス形状を正確に反映
type OnlineUserDetail = {
	id: string;
	username: string;
	name?: string | null;
	avatarUrl?: string | null;
	avatarBlurhash?: string | null;
	avatarDecorations: Array<{
		id: string;
		angle?: number;
		flipH?: boolean;
		url: string;
		offsetX?: number;
		offsetY?: number;
	}>;
	host?: string | null;
	// バックエンドはISO文字列を返す
	lastActiveDate: string | null;
	onlineStatus: 'online' | 'active' | 'offline' | 'unknown';
};

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

const activeUsers = ref<OnlineUserDetail[]>([]);
const prevUserIds = ref(new Set<string>());
const isLoggedIn = computed(() => $i != null);
const userMutings = ref(new Set<string>());

// WebSocketストリーム接続（本家パターンに従う）
// 型定義の複雑さを回避するため、実装詳細は隠蔽
let connection: { dispose: () => void } | null = null;

// ミュート情報を取得
async function fetchMutings() {
	if (!isLoggedIn.value) return;

	try {
		const mutings = await misskeyApi('mute/list');
		userMutings.value = new Set(mutings.map(m => m.muteeId));
	} catch (err) {
		console.error('Failed to fetch mutings:', err);
	}
}

// ミュートユーザーを除外した表示用のユーザーリスト
const filteredActiveUsers = computed(() => {
	if (!activeUsers.value) return [];
	return activeUsers.value.filter(user => !userMutings.value.has(user.id));
});

// 新しいユーザーが表示された時に通知音を鳴らす
const checkForNewUsers = (users: OnlineUserDetail[]) => {
	if (!widgetProps.sound) return;

	const currentUserIds = new Set<string>(users.map(user => user.id));
	const newUserIds = Array.from(currentUserIds).filter(id =>
		!prevUserIds.value.has(id) && !userMutings.value.has(id),
	);

	// 初回ロード時は通知しない
	if (newUserIds.length > 0 && prevUserIds.value.size > 0) {
		playMisskeySfx('notification');
	}

	prevUserIds.value = currentUserIds;
};

const tick = async () => {
	if (!isLoggedIn.value) {
		activeUsers.value = [];
		return;
	}

	try {
		const res = await misskeyApi('get-online-users-count');
		checkForNewUsers(res.details);
		activeUsers.value = res.details;
	} catch (err) {
		console.error('Failed to fetch active users:', err);
		activeUsers.value = [];
	}
};

// WebSocketストリーム接続とイベントハンドラの設定
function connectStream() {
	if (!isLoggedIn.value) return;

	// 既存の接続がある場合は切断
	if (connection) {
		connection.dispose();
	}

	// mainチャネルに接続（本家パターン）
	const stream = useStream().useChannel('main');
	connection = stream;

	// yamisskey独自イベントへの対応
	// 型定義に含まれていないイベントを扱うため、unknown経由で型安全に処理
	type ConnectionWithExtendedEvents = {
		on: (event: string, handler: (...args: unknown[]) => void) => void;
	};
	const conn = stream as unknown as ConnectionWithExtendedEvents;

	// meUpdated時にミュートリストとアクティブユーザーを更新
	// ミュート/アンミュートすると自分の情報が更新されるため、このイベントを活用
	conn.on('meUpdated', () => {
		fetchMutings();
		tick(); // アクティブユーザーも更新してリアルタイム性を確保
	});

	// ユーザーのオンライン状態変更時に即座に更新
	conn.on('userOnlineStatusChanged', () => {
		tick();
	});

	// ミュート実行時に即座にUIから削除
	conn.on('mute', (mutee: unknown) => {
		if (mutee && typeof mutee === 'object' && 'id' in mutee) {
			userMutings.value.add((mutee as { id: string }).id);
		}
	});

	// ミュート解除時に即座に再表示
	conn.on('unmute', (mutee: unknown) => {
		if (mutee && typeof mutee === 'object' && 'id' in mutee) {
			userMutings.value.delete((mutee as { id: string }).id);
			tick();
		}
	});

	// 接続切断時の自動再接続
	conn.on('_disconnected_', () => {
		window.setTimeout(() => {
			connectStream();
		}, 3000);
	});
}

// ユーザーをミュートする
function muteMember(user: OnlineUserDetail) {
	if (!isLoggedIn.value) return;

	const { menu, cleanup } = getUserMenu(user as unknown as Misskey.entities.UserDetailed);

	const muteItem = menu.find(item =>
		'icon' in item && 'text' in item && item.icon === 'ti ti-eye-off' && item.text === i18n.ts.mute,
	) as MenuButton | undefined;

	if (muteItem?.action) {
		muteItem.action({} as MouseEvent);

		// WebSocketイベントで処理されるが、念のためフォールバック
		window.setTimeout(() => {
			fetchMutings();
		}, 500);
	}

	cleanup();
}

// 初期化
onMounted(() => {
	fetchMutings();
	tick();
	connectStream();
});

// クリーンアップ
onUnmounted(() => {
	if (connection) {
		connection.dispose();
		connection = null;
	}
});

// ログイン状態変化への対応
watch(isLoggedIn, (newValue) => {
	if (newValue) {
		// ログイン時: 接続確立
		fetchMutings();
		connectStream();
	} else {
		// ログアウト時: 接続切断
		if (connection) {
			connection.dispose();
			connection = null;
		}
		activeUsers.value = [];
		userMutings.value.clear();
	}
});

// 定期更新（WebSocketのバックアップとして30秒ごと）
useInterval(tick, 1000 * 30, {
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
