<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :reversed="tab === 'chat'" :tabs="headerTabs" :actions="headerActions">
	<div v-if="tab === 'chat'" class="_spacer" style="--MI_SPACER-w: 700px;">
		<div class="_gaps">
			<div v-if="initializing">
				<MkLoading/>
			</div>

			<div v-else-if="messages.length === 0">
				<div class="_gaps" style="text-align: center;">
					<div>{{ i18n.ts._chat.noMessagesYet }}</div>
					<template v-if="user">
						<div v-if="user.chatScope === 'followers'">{{ i18n.ts._chat.thisUserAllowsChatOnlyFromFollowers }}</div>
						<div v-else-if="user.chatScope === 'following'">{{ i18n.ts._chat.thisUserAllowsChatOnlyFromFollowing }}</div>
						<div v-else-if="user.chatScope === 'mutual'">{{ i18n.ts._chat.thisUserAllowsChatOnlyFromMutualFollowing }}</div>
						<div v-else-if="user.chatScope === 'none'">{{ i18n.ts._chat.thisUserNotAllowedChatAnyone }}</div>
					</template>
					<template v-else-if="room">
						<div>{{ i18n.ts._chat.inviteUserToChat }}</div>
					</template>
				</div>
			</div>

			<div v-else ref="timelineEl" class="_gaps">
				<div v-if="canFetchMore">
					<MkButton :class="$style.more" :wait="moreFetching" primary rounded @click="fetchMore">{{ i18n.ts.loadMore }}</MkButton>
				</div>

				<TransitionGroup
					:enterActiveClass="prefer.s.animation ? $style.transition_x_enterActive : ''"
					:leaveActiveClass="prefer.s.animation ? $style.transition_x_leaveActive : ''"
					:enterFromClass="prefer.s.animation ? $style.transition_x_enterFrom : ''"
					:leaveToClass="prefer.s.animation ? $style.transition_x_leaveTo : ''"
					:moveClass="prefer.s.animation ? $style.transition_x_move : ''"
					tag="div" class="_gaps"
				>
					<template v-for="item in timeline.toReversed()" :key="item.id">
						<XMessage v-if="item.type === 'item'" :message="item.data"/>
						<div v-else-if="item.type === 'date'" :class="$style.dateDivider">
							<span><i class="ti ti-chevron-up"></i> {{ item.nextText }}</span>
							<span style="height: 1em; width: 1px; background: var(--MI_THEME-divider);"></span>
							<span>{{ item.prevText }} <i class="ti ti-chevron-down"></i></span>
						</div>
					</template>
				</TransitionGroup>
			</div>

			<div v-if="user && (!user.canChat || user.host !== null)">
				<MkInfo warn>{{ i18n.ts._chat.chatNotAvailableInOtherAccount }}</MkInfo>
			</div>

			<MkInfo v-if="$i.policies.chatAvailability !== 'available'" warn>{{ $i.policies.chatAvailability === 'readonly' ? i18n.ts._chat.chatIsReadOnlyForThisAccountOrServer : i18n.ts._chat.chatNotAvailableForThisAccountOrServer }}</MkInfo>
		</div>
	</div>

	<div v-else-if="tab === 'drawing'" class="_spacer" style="--MI_SPACER-w: 100%; max-width: 100vw;">
		<XDrawing v-if="room != null" :roomId="roomId"/>
		<XDrawing v-else-if="user != null && userId" :userId="userId"/>
	</div>

	<div v-else-if="tab === 'search'" class="_spacer" style="--MI_SPACER-w: 700px;">
		<XSearch :userId="userId" :roomId="roomId"/>
	</div>

	<div v-else-if="tab === 'members'" class="_spacer" style="--MI_SPACER-w: 700px;">
		<XMembers v-if="room != null" :room="room" @inviteUser="inviteUser"/>
	</div>

	<div v-else-if="tab === 'info'" class="_spacer" style="--MI_SPACER-w: 700px;">
		<XInfo v-if="room != null" :room="room"/>
	</div>

	<template #footer>
		<div v-if="tab === 'chat'" :class="$style.footer">
			<div class="_gaps">
				<div v-if="typingUsers.length > 0" :class="$style.typing">
					<template v-if="typingUsers.length <= 2">
						<I18n :src="i18n.ts.typingUsers" text-tag="span">
							<template #users>
								<b v-for="typer in typingUsers" :key="typer.id" :class="$style.user">
									<MkUserName class="name" :user="typer" />
								</b>
							</template>
						</I18n>
					</template>
					<template v-else>
						<span>{{ i18n.ts.multipleUsersTyping }}</span>
					</template>
					<MkEllipsis />
				</div>
				<Transition name="fade">
					<div v-show="showIndicator" :class="$style.new">
						<button class="_buttonPrimary" :class="$style.newButton" @click="onIndicatorClick">
							<i class="fas ti-fw fa-arrow-circle-down" :class="$style.newIcon"></i>{{ i18n.ts._chat.newMessage }}
						</button>
					</div>
				</Transition>
				<XForm v-if="initialized" :user="user" :room="room" :isSecretMessageMode="isSecretMessageMode" :onTyping="handleTyping" :onTypingStop="handleTypingStop" :class="$style.form"/>
			</div>
		</div>
	</template>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, useTemplateRef, computed, watch, onMounted, onBeforeUnmount, onDeactivated, onActivated } from 'vue';
import * as Misskey from 'misskey-js';
import { getScrollContainer } from '@@/js/scroll.js';
import XMessage from './XMessage.vue';
import XForm from './room.form.vue';
import XSearch from './room.search.vue';
import XMembers from './room.members.vue';
import XInfo from './room.info.vue';
import XDrawing from './room.drawing.vue';
import type { MenuItem } from '@/types/menu.js';
import type { PageHeaderItem } from '@/types/page-header.js';
import * as os from '@/os.js';
import { useStream } from '@/stream.js';
import * as sound from '@/utility/sound.js';
import { i18n } from '@/i18n.js';
import { ensureSignin } from '@/i.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { definePage } from '@/page.js';
import { prefer } from '@/preferences.js';
import MkButton from '@/components/MkButton.vue';
import { useRouter } from '@/router.js';
import { useMutationObserver } from '@/composables/use-mutation-observer.js';
import MkInfo from '@/components/MkInfo.vue';
import { makeDateSeparatedTimelineComputedRef } from '@/utility/timeline-date-separate.js';
import I18n from '@/components/global/I18n.vue';
import MkUserName from '@/components/global/MkUserName.vue';
import MkEllipsis from '@/components/global/MkEllipsis.vue';

const $i = ensureSignin();
const router = useRouter();

const props = defineProps<{
	userId?: string;
	roomId?: string;
}>();

const isSecretMessageMode = ref(false);

export type NormalizedChatMessage = Omit<Misskey.entities.ChatMessageLite, 'fromUser' | 'reactions'> & {
	fromUser: Misskey.entities.UserLite;
	reactions: (Misskey.entities.ChatMessageLite['reactions'][number] & {
		user: Misskey.entities.UserLite;
	})[];
	reads?: string[]; // 既読ユーザーIDの配列
	expiresAt?: string | null;
	isSystemMessage?: boolean;
	meta?: Record<string, any> | null;
};

const initializing = ref(false);
const initialized = ref(false);
const initializeId = ref(0); // 初期化IDで重複防止
const moreFetching = ref(false);
const messages = ref<NormalizedChatMessage[]>([]);
const canFetchMore = ref(false);
const user = ref<Misskey.entities.UserDetailed | null>(null);
const room = ref<Misskey.entities.ChatRoom | null>(null);
const connection = ref<Misskey.IChannelConnection<Misskey.Channels['chatUser']> | Misskey.IChannelConnection<Misskey.Channels['chatRoom']> | null>(null);
const streamInstance = ref<any>(null); // ストリームインスタンスを保持
const showIndicator = ref(false);
const typingUsers = ref<Misskey.entities.UserLite[]>([]);
const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
// 重複イベント防止用のSets
const processedMessageIds = new Set<string>();
const processedReactionIds = new Set<string>();
const processedDeleteIds = new Set<string>();
const processedReadIds = new Set<string>();
const timelineEl = useTemplateRef('timelineEl');
const timeline = makeDateSeparatedTimelineComputedRef(messages);

const SCROLL_HEAD_THRESHOLD = 200;

// column-reverseなので本来はスクロール位置の最下部への追従は不要なはずだが、おそらくブラウザのバグにより、最下部にスクロールした状態でも追従されない場合がある(スクロール位置が少数になることがあるのが関わっていそう)
// そのため補助としてMutationObserverを使って追従を行う
useMutationObserver(timelineEl, {
	subtree: true,
	childList: true,
	attributes: false,
}, () => {
	const scrollContainer = getScrollContainer(timelineEl.value)!;

	if (scrollContainer !== null && scrollContainer !== undefined && 
	scrollContainer.scrollTop !== null && scrollContainer.scrollTop !== undefined) {
		// column-reverseなのでscrollTopは負になる
		if (-scrollContainer.scrollTop < SCROLL_HEAD_THRESHOLD) {
			scrollContainer.scrollTo({
				top: 0,
				behavior: 'instant',
			});
		}
	}
});

function normalizeMessage(message: (Misskey.entities.ChatMessageLite | Misskey.entities.ChatMessage) & { reads?: string[] }): NormalizedChatMessage {
	const normalized = {
		...message,
		fromUser: message.fromUser ?? (message.fromUserId === $i.id ? $i : user.value!),
		reactions: message.reactions.map(record => ({
			...record,
			user: record.user ?? (message.fromUserId === $i.id ? user.value! : $i),
		})),
	};

	console.log('🔍 [DEBUG] normalizeMessage:', {
		originalReads: message.reads,
		normalizedReads: normalized.reads,
		messageId: message.id,
		hasReads: !!normalized.reads,
		readsLength: normalized.reads?.length || 0
	});

	return normalized;
}

async function loadSecretMode() {
	try {
		if (props.userId) {
			const result = await misskeyApi('chat/get-secret-mode-for-user' as any, { userId: props.userId }) as any;
			isSecretMessageMode.value = result?.isSecretMessageMode || false;
		} else if (props.roomId) {
			const result = await misskeyApi('chat/rooms/get-secret-mode' as any, { roomId: props.roomId }) as any;
			isSecretMessageMode.value = result?.isSecretMessageMode || false;
		}
	} catch (error) {
		console.error('Failed to load secret mode:', error);
	}
}

async function toggleSecretMode() {
	try {
		if (props.userId) {
			await (misskeyApi as any)('chat/set-secret-mode-for-user', {
				userId: props.userId,
				isSecretMessageMode: !isSecretMessageMode.value
			});
		} else if (props.roomId) {
			await (misskeyApi as any)('chat/rooms/set-secret-mode', {
				roomId: props.roomId,
				isSecretMessageMode: !isSecretMessageMode.value
			});
		}
	} catch (error) {
		console.error('Failed to toggle secret mode:', error);
		os.alert({
			type: 'error',
			text: i18n.ts.somethingHappened,
		});
	}
}

// 表示されている全てのメッセージを既読にする関数
function markAllVisibleMessagesAsRead() {
	if (window.document.hidden) {
		console.log('🔍 [DEBUG] Skipping read mark on initialization: document hidden');
		return;
	}

	// 自分以外からの全てのメッセージを既読にする（既読済みでも再実行）
	const othersMessages = messages.value.filter(message =>
		message.fromUserId !== $i.id
	);

	console.log('🔍 [DEBUG] Marking ALL visible messages as read on initialization:', {
		totalMessages: messages.value.length,
		othersMessagesCount: othersMessages.length,
		messageIds: othersMessages.map(m => m.id)
	});

	othersMessages.forEach(message => {
		// WebSocket経由で既読通知
		connection.value?.send('read', {
			id: message.id,
		});

		// APIで既読状態を更新
		misskeyApi('chat/messages/read', {
			messageId: message.id,
		}).then(() => {
			console.log('🔍 [DEBUG] Successfully marked message as read on initialization:', message.id);
		}).catch(err => {
			console.error('🔍 [DEBUG] Failed to mark message as read on initialization:', err);
		});
	});
}

// 未読メッセージのみを既読にする関数（ページアクティベート時用）
function markUnreadMessagesAsRead() {
	if (window.document.hidden) {
		console.log('🔍 [DEBUG] Skipping read mark: document hidden');
		return;
	}

	// 自分以外からのメッセージで、まだ既読していないもののみを既読にする
	const unreadMessages = messages.value.filter(message =>
		message.fromUserId !== $i.id &&
		(!message.reads || !message.reads.includes($i.id))
	);

	console.log('🔍 [DEBUG] Marking unread messages as read:', {
		totalMessages: messages.value.length,
		unreadCount: unreadMessages.length,
		unreadMessageIds: unreadMessages.map(m => m.id)
	});

	unreadMessages.forEach(message => {
		// WebSocket経由で既読通知
		connection.value?.send('read', {
			id: message.id,
		});

		// APIで既読状態を更新
		misskeyApi('chat/messages/read', {
			messageId: message.id,
		}).then(() => {
			console.log('🔍 [DEBUG] Successfully marked message as read:', message.id);
		}).catch(err => {
			console.error('🔍 [DEBUG] Failed to mark message as read:', err);
		});
	});
}

// 既存接続と状態をクリーンアップする関数
function cleanup() {
	console.log('🔍 [DEBUG] Cleaning up existing connection and state');

	// 既存接続を破棄（明示的にイベントリスナーを削除）
	if (connection.value) {
		try {
			// 明示的にイベントリスナーを削除
			connection.value.off('message', onMessage);
			connection.value.off('deleted', onDeleted);
			connection.value.off('react', onReact);
			connection.value.off('unreact', onUnreact);
			connection.value.off('read', onRead);
			connection.value.off('typing', onTyping);
			connection.value.off('typingStop', onTypingStop);
			console.log('🔍 [DEBUG] Explicitly removed all event listeners');
		} catch (e) {
			console.warn('🔍 [DEBUG] Error removing event listeners:', e);
		}

		connection.value.dispose();
		connection.value = null;
	}

	// ストリームインスタンスもクリーンアップ
	if (streamInstance.value) {
		try {
			streamInstance.value = null;
			console.log('🔍 [DEBUG] Cleared stream instance');
		} catch (e) {
			console.warn('🔍 [DEBUG] Error clearing stream instance:', e);
		}
	}

	// タイマーをすべてクリア
	for (const timer of typingTimers.values()) {
		clearTimeout(timer);
	}
	typingTimers.clear();
	console.log('🔍 [DEBUG] Cleared all typing timers');

	// 状態をリセット
	messages.value = [];
	user.value = null;
	room.value = null;
	typingUsers.value = [];
	canFetchMore.value = false;
	showIndicator.value = false;
	// 重複チェック用Setもすべてクリア
	processedMessageIds.clear();
	processedReactionIds.clear();
	processedDeleteIds.clear();
	processedReadIds.clear();

	// イベントリスナーを削除（存在する場合のみ）
	try {
		window.document.removeEventListener('visibilitychange', onVisibilitychange);
	} catch (e) {
		// イベントリスナーが存在しない場合は無視
	}
}

async function initialize() {
	const LIMIT = 20;

	if (initializing.value) {
		console.log('🔍 [DEBUG] Already initializing, skipping duplicate request');
		return;
	}

	// 新しい初期化IDを生成して重複防止
	const currentInitId = ++initializeId.value;
	console.log('🔍 [DEBUG] Initializing chat:', {
		userId: props.userId,
		roomId: props.roomId,
		initId: currentInitId
	});

	initializing.value = true;
	initialized.value = false;

	// 既存の接続と状態をクリーンアップ
	cleanup();

	if (props.userId) {
		const [u, m] = await Promise.all([
			misskeyApi('users/show', { userId: props.userId }),
			misskeyApi('chat/messages/user-timeline', { userId: props.userId, limit: LIMIT }),
		]);

		user.value = u;
		messages.value = m.map(x => normalizeMessage(x));

		if (messages.value.length === LIMIT) {
			canFetchMore.value = true;
		}

		// 初期化途中で別のinitializeが呼ばれた場合は中断
		if (currentInitId !== initializeId.value) {
			console.log('🔍 [DEBUG] Initialize cancelled due to newer request:', currentInitId);
			initializing.value = false;
			return;
		}

		// ストリームインスタンスを取得・保持
		if (!streamInstance.value) {
			streamInstance.value = useStream();
		}

		connection.value = streamInstance.value.useChannel('chatUser', {
			otherId: user.value.id,
		});
		connection.value.on('message', onMessage);
		connection.value.on('deleted', onDeleted);
		connection.value.on('react', onReact);
		connection.value.on('unreact', onUnreact);
		connection.value.on('read', onRead);
		connection.value.on('typing', onTyping);
		connection.value.on('typingStop', onTypingStop);

		console.log('🔍 [DEBUG] Set up chatUser connection with listeners');
	} else if (props.roomId) {
		const [rResult, mResult] = await Promise.allSettled([
			misskeyApi('chat/rooms/show', { roomId: props.roomId }),
			misskeyApi('chat/messages/room-timeline', { roomId: props.roomId, limit: LIMIT }),
		]);

		if (rResult.status === 'rejected') {
			os.alert({
				type: 'error',
				text: i18n.ts.somethingHappened,
			});
			initializing.value = false;
			return;
		}

		const r = rResult.value as Misskey.entities.ChatRoomsShowResponse;

		// 初期化途中で別のinitializeが呼ばれた場合は中断
		if (currentInitId !== initializeId.value) {
			console.log('🔍 [DEBUG] Initialize cancelled due to newer request:', currentInitId);
			initializing.value = false;
			return;
		}

		if (r.invitationExists) {
			const confirm = await os.confirm({
				type: 'question',
				title: r.name,
				text: i18n.ts._chat.youAreNotAMemberOfThisRoomButInvited + '\n' + i18n.ts._chat.doYouAcceptInvitation,
			});
			if (confirm.canceled) {
				initializing.value = false;
				router.push('/chat');
				return;
			} else {
				await os.apiWithDialog('chat/rooms/join', { roomId: r.id });
				initializing.value = false;
				// 再帰ではなく、フラグをリセットしてからinitializeを呼ぶ
				setTimeout(() => initialize(), 100);
				return;
			}
		}

		const m = mResult.status === 'fulfilled' ? mResult.value as Misskey.entities.ChatMessagesRoomTimelineResponse : [];

		room.value = r;
		messages.value = m.map(x => normalizeMessage(x));

		if (messages.value.length === LIMIT) {
			canFetchMore.value = true;
		}

		// 初期化途中で別のinitializeが呼ばれた場合は中断
		if (currentInitId !== initializeId.value) {
			console.log('🔍 [DEBUG] Initialize cancelled due to newer request:', currentInitId);
			initializing.value = false;
			return;
		}

		// ストリームインスタンスを取得・保持
		if (!streamInstance.value) {
			streamInstance.value = useStream();
		}

		connection.value = streamInstance.value.useChannel('chatRoom', {
			roomId: room.value.id,
		});
		connection.value.on('message', onMessage);
		connection.value.on('deleted', onDeleted);
		connection.value.on('react', onReact);
		connection.value.on('unreact', onUnreact);
		connection.value.on('read', onRead);
		connection.value.on('typing', onTyping);
		connection.value.on('typingStop', onTypingStop);

		console.log('🔍 [DEBUG] Set up chatRoom connection with listeners');
	}

	// visibilitychangeイベントリスナーを追加（重複を避けるため一度削除してから追加）
	window.document.removeEventListener('visibilitychange', onVisibilitychange);
	window.document.addEventListener('visibilitychange', onVisibilitychange);

	// 最終チェック：初期化完了直前でも別のinitializeが呼ばれた場合は中断
	if (currentInitId !== initializeId.value) {
		console.log('🔍 [DEBUG] Initialize cancelled during final step:', currentInitId);
		initializing.value = false;
		return;
	}

	await loadSecretMode();

	// 画面表示時に表示されている全てのメッセージを既読にする
	markAllVisibleMessagesAsRead();

	initialized.value = true;
	initializing.value = false;
	console.log('🔍 [DEBUG] Initialize completed successfully:', currentInitId);
}

let isActivated = true;

onActivated(() => {
	isActivated = true;
});

onDeactivated(() => {
	isActivated = false;
});

async function fetchMore() {
	const LIMIT = 30;

	moreFetching.value = true;

	const newMessages = props.userId ? await misskeyApi('chat/messages/user-timeline', {
		userId: user.value!.id,
		limit: LIMIT,
		untilId: messages.value[messages.value.length - 1].id,
	}) : await misskeyApi('chat/messages/room-timeline', {
		roomId: room.value!.id,
		limit: LIMIT,
		untilId: messages.value[messages.value.length - 1].id,
	});

	messages.value.push(...newMessages.map(x => normalizeMessage(x)));

	canFetchMore.value = newMessages.length === LIMIT;
	moreFetching.value = false;
}


function onMessage(message: Misskey.entities.ChatMessageLite) {
	console.debug('🔍 [DEBUG] onMessage called with message:', message.id);

	// 重複チェック
	if (processedMessageIds.has(message.id)) {
		console.warn('🔍 [DEBUG] Duplicate message received, ignoring:', message.id);
		return;
	}

	// メッセージIDを記録
	processedMessageIds.add(message.id);

	// 古いメッセージIDを削除（メモリリーク防止、最新1000件保持）
	if (processedMessageIds.size > 1000) {
		const idsArray = Array.from(processedMessageIds);
		for (let i = 0; i < 100; i++) {
			processedMessageIds.delete(idsArray[i]);
		}
	}

	sound.playMisskeySfx('chatMessage');

	console.debug('New message:', message);

	// システムメッセージで内緒の会話の状態変更を検出
	const msgWithMeta = message as any; // 型定義の一時的な回避
	if (msgWithMeta.isSystemMessage && msgWithMeta.meta) {
		if (msgWithMeta?.meta?.type === 'secretModeChange') {
			isSecretMessageMode.value = msgWithMeta?.meta?.isSecretMessageMode || false;
		}
	}

	messages.value.unshift(normalizeMessage(message));

	// TODO: DOM的にバックグラウンドになっていないかどうかも考慮する
	if (message.fromUserId !== $i.id && !window.document.hidden && isActivated) {
		console.log('🔍 [DEBUG] Marking message as read:', {
			messageId: message.id,
			fromUserId: message.fromUserId,
			currentUserId: $i.id,
			isActivated,
			documentHidden: window.document.hidden
		});

		connection.value?.send('read', {
			id: message.id,
		});

		// APIで既読状態を更新
		misskeyApi('chat/messages/read', {
			messageId: message.id,
		}).then(() => {
			console.log('🔍 [DEBUG] Successfully marked message as read:', message.id);
		}).catch(err => {
			console.error('🔍 [DEBUG] Failed to mark message as read:', err);
		});
	} else {
		console.log('🔍 [DEBUG] Skipping read mark:', {
			messageId: message.id,
			fromUserId: message.fromUserId,
			currentUserId: $i.id,
			isOwnMessage: message.fromUserId === $i.id,
			documentHidden: window.document.hidden,
			isActivated
		});
	}

	if (message.fromUserId !== $i.id) {
		//notifyNewMessage();
	}
}

function onDeleted(id: string) {
	// 重複チェック
	if (processedDeleteIds.has(id)) {
		console.warn('🔍 [DEBUG] Duplicate delete event received, ignoring:', id);
		return;
	}

	// 削除IDを記録
	processedDeleteIds.add(id);

	// 古い削除IDを削除（メモリリーク防止）
	if (processedDeleteIds.size > 1000) {
		const idsArray = Array.from(processedDeleteIds);
		for (let i = 0; i < 100; i++) {
			processedDeleteIds.delete(idsArray[i]);
		}
	}

	const index = messages.value.findIndex(m => m.id === id);
	if (index !== -1) {
		messages.value.splice(index, 1);
	}
}

function onReact(ctx: Parameters<Misskey.Channels['chatUser']['events']['react']>[0] | Parameters<Misskey.Channels['chatRoom']['events']['react']>[0]) {
	// 重複チェック用のユニークID生成
	const reactionId = `${ctx.messageId}-${ctx.reaction}-${ctx.user?.id || 'self'}-react`;

	// 重複チェック
	if (processedReactionIds.has(reactionId)) {
		console.warn('🔍 [DEBUG] Duplicate reaction event received, ignoring:', reactionId);
		return;
	}

	// リアクションIDを記録
	processedReactionIds.add(reactionId);

	// 古いリアクションIDを削除（メモリリーク防止）
	if (processedReactionIds.size > 1000) {
		const idsArray = Array.from(processedReactionIds);
		for (let i = 0; i < 100; i++) {
			processedReactionIds.delete(idsArray[i]);
		}
	}

	const message = messages.value.find(m => m.id === ctx.messageId);
	if (message) {
		if (room.value == null) { // 1on1の時はuserは省略される
			message.reactions.push({
				reaction: ctx.reaction,
				user: message.fromUserId === $i.id ? user.value! : $i,
			});
		} else {
			message.reactions.push({
				reaction: ctx.reaction,
				user: ctx.user!,
			});
		}
	}
}

function onUnreact(ctx: Parameters<Misskey.Channels['chatUser']['events']['unreact']>[0] | Parameters<Misskey.Channels['chatRoom']['events']['unreact']>[0]) {
	// 重複チェック用のユニークID生成
	const unreactionId = `${ctx.messageId}-${ctx.reaction}-${ctx.user?.id || 'self'}-unreact`;

	// 重複チェック
	if (processedReactionIds.has(unreactionId)) {
		console.warn('🔍 [DEBUG] Duplicate unreaction event received, ignoring:', unreactionId);
		return;
	}

	// リアクションIDを記録
	processedReactionIds.add(unreactionId);

	// 古いリアクションIDを削除（メモリリーク防止）
	if (processedReactionIds.size > 1000) {
		const idsArray = Array.from(processedReactionIds);
		for (let i = 0; i < 100; i++) {
			processedReactionIds.delete(idsArray[i]);
		}
	}

	const message = messages.value.find(m => m.id === ctx.messageId);
	if (message) {
		const index = message.reactions.findIndex(r => r.reaction === ctx.reaction && r.user.id === ctx.user!.id);
		if (index !== -1) {
			message.reactions.splice(index, 1);
		}
	}
}

function onRead(ctx: { messageId: string; readerId: string }) {
	console.log('🔍 [DEBUG] onRead called:', ctx);

	// 重複チェック用のユニークID生成
	const readId = `${ctx.messageId}-${ctx.readerId}-read`;

	// 重複チェック
	if (processedReadIds.has(readId)) {
		console.warn('🔍 [DEBUG] Duplicate read event received, ignoring:', readId);
		return;
	}

	// 既読IDを記録
	processedReadIds.add(readId);

	// 古い既読IDを削除（メモリリーク防止）
	if (processedReadIds.size > 1000) {
		const idsArray = Array.from(processedReadIds);
		for (let i = 0; i < 100; i++) {
			processedReadIds.delete(idsArray[i]);
		}
	}

	const message = messages.value.find(m => m.id === ctx.messageId);
	console.log('🔍 [DEBUG] Found message:', message ? {
		id: message.id,
		reads: message.reads,
		readsLength: message.reads?.length || 0
	} : 'not found');

	if (message && message.reads) {
		// 既読リストに追加（重複チェック）
		if (!message.reads.includes(ctx.readerId)) {
			message.reads.push(ctx.readerId);
			console.log('🔍 [DEBUG] Added reader, new reads:', message.reads);
		} else {
			console.log('🔍 [DEBUG] Reader already exists in reads list');
		}
	}
}

function addTypingUser(typingUser: Misskey.entities.UserLite) {
	console.log('🔍 [DEBUG] addTypingUser called:', typingUser.username);
	// 自分は除外
	if (typingUser.id === $i.id) {
		console.log('🔍 [DEBUG] Skipping own user ID');
		return;
	}

	// 既存のタイマーをクリア
	const existingTimer = typingTimers.get(typingUser.id);
	if (existingTimer) {
		clearTimeout(existingTimer);
	}

	// 既に存在する場合は追加しない
	const exists = typingUsers.value.find(u => u.id === typingUser.id);
	if (!exists) {
		typingUsers.value.push(typingUser);
		console.log('🔍 [DEBUG] Added typing user:', typingUser.username);
	}

	// 5秒後に自動的に削除するタイマーを設定
	const timer = setTimeout(() => {
		console.log('🔍 [DEBUG] Auto-removing typing user after timeout:', typingUser.username);
		removeTypingUser(typingUser.id);
		typingTimers.delete(typingUser.id);
	}, 5000);

	typingTimers.set(typingUser.id, timer);
}

function removeTypingUser(userId: string) {
	console.log('🔍 [DEBUG] removeTypingUser called:', userId);

	// タイマーをクリア
	const timer = typingTimers.get(userId);
	if (timer) {
		clearTimeout(timer);
		typingTimers.delete(userId);
	}

	const index = typingUsers.value.findIndex(u => u.id === userId);
	if (index !== -1) {
		const removedUser = typingUsers.value.splice(index, 1)[0];
		console.log('🔍 [DEBUG] Removed typing user:', removedUser.username);
	} else {
		console.log('🔍 [DEBUG] Typing user not found for removal:', userId);
	}
}

function onTyping(ctx: { userId: string; user?: Misskey.entities.UserLite }) {
	console.log('🔍 [DEBUG] onTyping called:', ctx);
	console.log('🔍 [DEBUG] Current user ID:', $i.id);

	// セキュリティ: 基本的なバリデーション
	if (!ctx.userId || typeof ctx.userId !== 'string') {
		console.warn('🔍 [SECURITY] Invalid userId in typing event');
		return;
	}

	// 自分は除外
	if (ctx.userId === $i.id) {
		console.log('🔍 [DEBUG] Skipping own user ID');
		return;
	}

	let typingUser: Misskey.entities.UserLite | null = null;

	// userオブジェクトが含まれている場合は使用
	if (ctx.user) {
		// セキュリティ: userオブジェクトのIDとctx.userIdの一致確認
		if (ctx.user.id !== ctx.userId) {
			console.warn('🔍 [SECURITY] Mismatched userId and user.id in typing event');
			return;
		}
		typingUser = ctx.user;
		console.log('🔍 [DEBUG] Using provided user object:', typingUser.username);
	}
	// 1on1チャットの場合は相手ユーザー
	else if (user.value && ctx.userId === user.value.id) {
		typingUser = user.value;
		console.log('🔍 [DEBUG] Found 1on1 chat partner:', typingUser.username);
	}
	// ルームチャットの場合は過去のメッセージから検索
	else {
		const foundMessage = messages.value.find(m => m.fromUserId === ctx.userId);
		if (foundMessage) {
			typingUser = foundMessage.fromUser;
			console.log('🔍 [DEBUG] Found room user from messages:', typingUser.username);
		} else {
			console.warn('🔍 [DEBUG] User not found in messages:', ctx.userId);
		}
	}

	if (typingUser) {
		addTypingUser(typingUser);
	}
}

function onTypingStop(ctx: { userId: string }) {
	console.log('🔍 [DEBUG] onTypingStop called:', ctx);
	console.log('🔍 [DEBUG] Current user ID:', $i.id);

	// セキュリティ: 基本的なバリデーション
	if (!ctx.userId || typeof ctx.userId !== 'string') {
		console.warn('🔍 [SECURITY] Invalid userId in typingStop event');
		return;
	}

	if (ctx.userId !== $i.id) {
		removeTypingUser(ctx.userId);
	}
}

// form コンポーネント用のタイピングハンドラー関数
function handleTyping() {
	console.log('🔍 [DEBUG] handleTyping called from form component');
	if (!connection.value) {
		console.warn('🔍 [DEBUG] No connection available for typing event');
		return;
	}

	// 部屋またはユーザー情報を含めてイベント送信
	const eventData: any = {};
	if (room.value) {
		eventData.roomId = room.value.id;
		console.log('🔍 [DEBUG] Sending room typing event for room:', room.value.id);
	} else if (user.value) {
		// ユーザー対ユーザーチャットでは相手のIDではなく、空のオブジェクトを送信
		// バックエンドで認証済みユーザーIDが自動設定される
		console.log('🔍 [DEBUG] Sending user typing event for user:', user.value.id);
	}

	(connection.value as any).send('typing', eventData);
}

function handleTypingStop() {
	console.log('🔍 [DEBUG] handleTypingStop called from form component');
	if (!connection.value) {
		console.warn('🔍 [DEBUG] No connection available for typingStop event');
		return;
	}

	// 部屋またはユーザー情報を含めてイベント送信
	const eventData: any = {};
	if (room.value) {
		eventData.roomId = room.value.id;
		console.log('🔍 [DEBUG] Sending room typingStop event for room:', room.value.id);
	} else if (user.value) {
		console.log('🔍 [DEBUG] Sending user typingStop event for user:', user.value.id);
	}

	(connection.value as any).send('typingStop', eventData);
}

function onIndicatorClick() {
	showIndicator.value = false;
}

function notifyNewMessage() {
	showIndicator.value = true;
}

function onVisibilitychange() {
	if (window.document.hidden) return;
	// ページが表示状態になった時に未読メッセージを既読にする
	markUnreadMessagesAsRead();
}

// props変更を監視してチャットルーム切り替えに対応
watch([() => props.userId, () => props.roomId], ([newUserId, newRoomId], [oldUserId, oldRoomId]) => {
	console.log('🔍 [DEBUG] Props changed:', {
		oldUserId, newUserId,
		oldRoomId, newRoomId,
		shouldReinitialize: (newUserId !== oldUserId) || (newRoomId !== oldRoomId)
	});

	// userIdまたはroomIdが変更された場合、再初期化（デバウンス付き）
	if ((newUserId !== oldUserId) || (newRoomId !== oldRoomId)) {
		console.log('🔍 [DEBUG] Reinitializing due to props change');
		// 短時間での重複初期化を防ぐため、少し遅延させる
		setTimeout(() => {
			initialize();
		}, 50);
	}
}, { immediate: false }); // immediate: false で初回マウント時は実行しない

onMounted(() => {
	initialize();
});

onActivated(() => {
	// 既に初期化済みまたは初期化中の場合は、既読処理のみ実行
	if (initialized.value || initializing.value) {
		// ページが再度アクティブになった時は未読メッセージを既読にする
		markUnreadMessagesAsRead();
	} else {
		// 未初期化かつ初期化中でない場合のみinitializeを実行
		initialize();
	}
});

onBeforeUnmount(() => {
	cleanup();
});

async function inviteUser() {
	if (room.value == null) return;

	const invitee = await os.selectUser({ includeSelf: false, localOnly: true });
	os.apiWithDialog('chat/rooms/invitations/create', {
		roomId: room.value.id,
		userId: invitee.id,
	});
}

async function leaveRoom() {
	if (room.value == null) return;

	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.ts.areYouSure,
	});
	if (canceled) return;

	misskeyApi('chat/rooms/leave', {
		roomId: room.value.id,
	});
	router.push('/chat');
}

function showMenu(ev: MouseEvent) {
	const menuItems: MenuItem[] = [];

	// 内緒の会話トグル
	if ($i.policies?.chatAvailability === 'available') {
		menuItems.push({
			text: isSecretMessageMode.value ? '内緒の会話を無効にする' : '内緒の会話を有効にする',
			icon: isSecretMessageMode.value ? 'ti ti-eye-off' : 'ti ti-eye',
			action: () => {
				toggleSecretMode();
			},
		});

		// セパレーター
		if (room.value || user.value) {
			menuItems.push({ type: 'divider' });
		}
	}

	if (room.value) {
		if (room.value.ownerId === $i.id) {
			menuItems.push({
				text: i18n.ts._chat.inviteUser,
				icon: 'ti ti-user-plus',
				action: () => {
					inviteUser();
				},
			});
		} else {
			menuItems.push({
				text: i18n.ts._chat.leave,
				icon: 'ti ti-x',
				action: () => {
					leaveRoom();
				},
			});
		}
	}

	os.popupMenu(menuItems, ev.currentTarget ?? ev.target);
}

const tab = ref('chat');

const headerTabs = computed(() => room.value ? [{
	key: 'chat',
	title: i18n.ts._chat.messages,
	icon: 'ti ti-messages',
}, {
	key: 'drawing',
	title: 'お絵かき',
	icon: 'ti ti-brush',
}, {
	key: 'members',
	title: i18n.ts._chat.members,
	icon: 'ti ti-users',
}, {
	key: 'search',
	title: i18n.ts.search,
	icon: 'ti ti-search',
}, {
	key: 'info',
	title: i18n.ts.info,
	icon: 'ti ti-info-circle',
}] : [{
	key: 'chat',
	title: i18n.ts._chat.messages,
	icon: 'ti ti-messages',
}, {
	key: 'drawing',
	title: 'お絵かき',
	icon: 'ti ti-brush',
}, {
	key: 'search',
	title: i18n.ts.search,
	icon: 'ti ti-search',
}]);

const headerActions = computed<PageHeaderItem[]>(() => {
	const actions: PageHeaderItem[] = [];

	// 内緒の会話トグル - チャット利用可能時のみ表示
	if ($i.policies?.chatAvailability === 'available') {
		actions.push({
			icon: isSecretMessageMode.value ? 'ti ti-eye-off' : 'ti ti-eye',
			text: isSecretMessageMode.value ? '内緒の会話を無効にする' : '内緒の会話',
			handler: toggleSecretMode,
		});
	}

	// 通常のメニュー
	actions.push({
		icon: 'ti ti-dots',
		text: '',
		handler: showMenu,
	});

	return actions;
});

definePage(computed(() => {
	if (initialized.value) {
		if (user.value) {
			return {
				userName: user.value,
				title: user.value.name ?? user.value.username,
				avatar: user.value,
			};
		} else if (room.value) {
			return {
				title: room.value.name,
				icon: 'ti ti-users',
			};
		} else {
			return {
				title: i18n.ts.directMessage,
			};
		}
	} else {
		return {
			title: i18n.ts.directMessage,
		};
	}
}));
</script>

<style lang="scss" module>
.transition_x_move,
.transition_x_enterActive,
.transition_x_leaveActive {
	transition: opacity 0.2s cubic-bezier(0,.5,.5,1), transform 0.2s cubic-bezier(0,.5,.5,1) !important;
}
.transition_x_enterFrom,
.transition_x_leaveTo {
	opacity: 0;
	transform: translateY(80px);
}
.transition_x_leaveActive {
	position: absolute;
}

.root {
}

.more {
	margin: 0 auto;
}

.footer {
	width: 100%;
	padding-top: 8px;
	position: relative;
}

.typing {
	position: absolute;
	bottom: 100%;
	left: 0;
	right: 0;
	margin: 0 auto;
	width: 100%;
	max-width: 700px;
	padding: 0 var(--MI_SPACER-h, 16px);
	font-size: 0.9em;
	color: var(--MI_THEME-fgTransparentWeak);
	box-sizing: border-box;
}

.user + .user:before {
	content: ', ';
	font-weight: normal;
}

.user:last-of-type:after {
	content: ' ';
}

.new {
	width: 100%;
	padding-bottom: 8px;
	text-align: center;
}

.newButton {
	display: inline-block;
	margin: 0;
	padding: 0 12px;
	line-height: 32px;
	font-size: 12px;
	border-radius: 16px;
}

.newIcon {
	display: inline-block;
	margin-right: 8px;
}

.footer {

}

.form {
	margin: 0 auto;
	width: 100%;
	max-width: 700px;
}

.fade-enter-active, .fade-leave-active {
	transition: opacity 0.1s;
}

.fade-enter-from, .fade-leave-to {
	transition: opacity 0.5s;
	opacity: 0;
}

.dateDivider {
	display: flex;
	font-size: 85%;
	align-items: center;
	justify-content: center;
	gap: 0.5em;
	opacity: 0.75;
	border: solid 0.5px var(--MI_THEME-divider);
	border-radius: 999px;
	width: fit-content;
	padding: 0.5em 1em;
	margin: 0 auto;
}

.secretModeIndicator {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 8px 16px;
	background: rgba(255, 165, 0, 0.1);
	border: 1px solid rgba(255, 165, 0, 0.3);
	border-radius: 999px;
	color: orange;
	font-size: 0.9em;
	margin: 0 auto 16px;
	width: fit-content;
}
</style>
