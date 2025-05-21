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
		<div v-if="activeUsers?.length > 0" :class="$style.users">
			<div v-for="user in activeUsers" :key="user.id || user.username" :class="$style.row">
				<MkAvatar :user="user" :class="$style.avatar" indicator link preview/>
				<div :class="$style.userInfo">
					<div :class="$style.name">
						<MkA :to="'/@' + user.username">
							<MkUserName :user="user" />
						</MkA>
					</div>
					<div v-if="user.name && user.name !== user.username" :class="$style.username">@{{ user.username }}</div>
				</div>
				<div :class="$style.date">
					<template v-if="!user.hideOnlineStatus">
						<MkTime :time="user.lastActiveDate" small/>
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

const activeUsers = ref([]);
const prevUserIds = ref(new Set());
const connection = ref(null);
const isLoggedIn = computed(() => $i != null);

// 新しいユーザーが表示された時に通知音を鳴らす
const checkForNewUsers = (users) => {
	if (!widgetProps.sound) return;

	const currentUserIds = new Set(users.map(user => user.id));
	const newUserIds = [...currentUserIds].filter(id => !prevUserIds.value.has(id));

	// 初回ロード時は通知しない（prevUserIds.valueが空の場合）
	if (newUserIds.length > 0 && prevUserIds.value.size > 0) {
		// 通知音を正しい関数で鳴らす
		playMisskeySfx('notification');
	}

	// 現在のユーザーIDを保存
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
		console.error('Failed to fetch mutual followers:', err);
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
};

// 初期化と定期更新
onMounted(() => {
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
    grid-template-columns: auto 1fr auto;
    gap: 8px;
    margin-bottom: 6px;
    padding: 6px;
    border-radius: 6px;
    transition: background 0.2s;
    align-items: center;

    &:hover {
        background: var(--MI_THEME-accentedBg);
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
</style>
