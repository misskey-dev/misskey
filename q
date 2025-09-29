[1mdiff --git a/packages/frontend/src/pages/chat/room.vue b/packages/frontend/src/pages/chat/room.vue[m
[1mindex 7aa50696d1..aea655870f 100644[m
[1m--- a/packages/frontend/src/pages/chat/room.vue[m
[1m+++ b/packages/frontend/src/pages/chat/room.vue[m
[36m@@ -153,6 +153,7 @@[m [mexport type NormalizedChatMessage = Omit<Misskey.entities.ChatMessageLite, 'from[m
 [m
 const initializing = ref(false);[m
 const initialized = ref(false);[m
[32m+[m[32mconst initializeId = ref(0); // 初期化IDで重複防止[m
 const moreFetching = ref(false);[m
 const messages = ref<NormalizedChatMessage[]>([]);[m
 const canFetchMore = ref(false);[m
[36m@@ -161,6 +162,7 @@[m [mconst room = ref<Misskey.entities.ChatRoom | null>(null);[m
 const connection = ref<Misskey.IChannelConnection<Misskey.Channels['chatUser']> | Misskey.IChannelConnection<Misskey.Channels['chatRoom']> | null>(null);[m
 const showIndicator = ref(false);[m
 const typingUsers = ref<Misskey.entities.UserLite[]>([]);[m
[32m+[m[32mconst typingTimers = new Map<string, ReturnType<typeof setTimeout>>();[m
 const timelineEl = useTemplateRef('timelineEl');[m
 const timeline = makeDateSeparatedTimelineComputedRef(messages);[m
 [m
[36m@@ -319,12 +321,33 @@[m [mfunction markUnreadMessagesAsRead() {[m
 function cleanup() {[m
 	console.log('🔍 [DEBUG] Cleaning up existing connection and state');[m
 [m
[31m-	// 既存接続を破棄[m
[32m+[m	[32m// 既存接続を破棄（明示的にイベントリスナーを削除）[m
 	if (connection.value) {[m
[32m+[m		[32mtry {[m
[32m+[m			[32m// 明示的にイベントリスナーを削除[m
[32m+[m			[32mconnection.value.off('message', onMessage);[m
[32m+[m			[32mconnection.value.off('deleted', onDeleted);[m
[32m+[m			[32mconnection.value.off('react', onReact);[m
[32m+[m			[32mconnection.value.off('unreact', onUnreact);[m
[32m+[m			[32mconnection.value.off('read', onRead);[m
[32m+[m			[32mconnection.value.off('typing', onTyping);[m
[32m+[m			[32mconnection.value.off('typingStop', onTypingStop);[m
[32m+[m			[32mconsole.log('🔍 [DEBUG] Explicitly removed all event listeners');[m
[32m+[m		[32m} catch (e) {[m
[32m+[m			[32mconsole.warn('🔍 [DEBUG] Error removing event listeners:', e);[m
[32m+[m		[32m}[m
[32m+[m
 		connection.value.dispose();[m
 		connection.value = null;[m
 	}[m
 [m
[32m+[m	[32m// タイマーをすべてクリア[m
[32m+[m	[32mfor (const timer of typingTimers.values()) {[m
[32m+[m		[32mclearTimeout(timer);[m
[32m+[m	[32m}[m
[32m+[m	[32mtypingTimers.clear();[m
[32m+[m	[32mconsole.log('🔍 [DEBUG] Cleared all typing timers');[m
[32m+[m
 	// 状態をリセット[m
 	messages.value = [];[m
 	user.value = null;[m
[36m@@ -344,9 +367,18 @@[m [mfunction cleanup() {[m
 async function initialize() {[m
 	const LIMIT = 20;[m
 [m
[31m-	if (initializing.value) return;[m
[32m+[m	[32mif (initializing.value) {[m
[32m+[m		[32mconsole.log('🔍 [DEBUG] Already initializing, skipping duplicate request');[m
[32m+[m		[32mreturn;[m
[32m+[m	[32m}[m
 [m
[31m-	console.log('🔍 [DEBUG] Initializing chat:', { userId: props.userId, roomId: props.roomId });[m
[32m+[m	[32m// 新しい初期化IDを生成して重複防止[m
[32m+[m	[32mconst currentInitId = ++initializeId.value;[m
[32m+[m	[32mconsole.log('🔍 [DEBUG] Initializing chat:', {[m
[32m+[m		[32muserId: props.userId,[m
[32m+[m		[32mroomId: props.roomId,[m
[32m+[m		[32minitId: currentInitId[m
[32m+[m	[32m});[m
 [m
 	initializing.value = true;[m
 	initialized.value = false;[m
[36m@@ -433,6 +465,8 @@[m [masync function initialize() {[m
 		connection.value.on('typingStop', onTypingStop);[m
 	}[m
 [m
[32m+[m	[32m// visibilitychangeイベントリスナーを追加（重複を避けるため一度削除してから追加）[m
[32m+[m	[32mwindow.document.removeEventListener('visibilitychange', onVisibilitychange);[m
 	window.document.addEventListener('visibilitychange', onVisibilitychange);[m
 [m
 	await loadSecretMode();[m
[36m@@ -591,16 +625,39 @@[m [mfunction addTypingUser(typingUser: Misskey.entities.UserLite) {[m
 		return;[m
 	}[m
 [m
[32m+[m	[32m// 既存のタイマーをクリア[m
[32m+[m	[32mconst existingTimer = typingTimers.get(typingUser.id);[m
[32m+[m	[32mif (existingTimer) {[m
[32m+[m		[32mclearTimeout(existingTimer);[m
[32m+[m	[32m}[m
[32m+[m
 	// 既に存在する場合は追加しない[m
 	const exists = typingUsers.value.find(u => u.id === typingUser.id);[m
 	if (!exists) {[m
 		typingUsers.value.push(typingUser);[m
 		console.log('🔍 [DEBUG] Added typing user:', typingUser.username);[m
 	}[m
[32m+[m
[32m+[m	[32m// 5秒後に自動的に削除するタイマーを設定[m
[32m+[m	[32mconst timer = setTimeout(() => {[m
[32m+[m		[32mconsole.log('🔍 [DEBUG] Auto-removing typing user after timeout:', typingUser.username);[m
[32m+[m		[32mremoveTypingUser(typingUser.id);[m
[32m+[m		[32mtypingTimers.delete(typingUser.id);[m
[32m+[m	[32m}, 5000);[m
[32m+[m
[32m+[m	[32mtypingTimers.set(typingUser.id, timer);[m
 }[m
 [m
 function removeTypingUser(userId: string) {[m
 	console.log('🔍 [DEBUG] removeTypingUser called:', userId);[m
[32m+[m
[32m+[m	[32m// タイマーをクリア[m
[32m+[m	[32mconst timer = typingTimers.get(userId);[m
[32m+[m	[32mif (timer) {[m
[32m+[m		[32mclearTimeout(timer);[m
[32m+[m		[32mtypingTimers.delete(userId);[m
[32m+[m	[32m}[m
[32m+[m
 	const index = typingUsers.value.findIndex(u => u.id === userId);[m
 	if (index !== -1) {[m
 		const removedUser = typingUsers.value.splice(index, 1)[0];[m
[36m@@ -696,10 +753,13 @@[m [mwatch([() => props.userId, () => props.roomId], ([newUserId, newRoomId], [oldUse[m
 		shouldReinitialize: (newUserId !== oldUserId) || (newRoomId !== oldRoomId)[m
 	});[m
 [m
[31m-	// userIdまたはroomIdが変更された場合、再初期化[m
[32m+[m	[32m// userIdまたはroomIdが変更された場合、再初期化（デバウンス付き）[m
 	if ((newUserId !== oldUserId) || (newRoomId !== oldRoomId)) {[m
 		console.log('🔍 [DEBUG] Reinitializing due to props change');[m
[31m-		initialize();[m
[32m+[m		[32m// 短時間での重複初期化を防ぐため、少し遅延させる[m
[32m+[m		[32msetTimeout(() => {[m
[32m+[m			[32minitialize();[m
[32m+[m		[32m}, 50);[m
 	}[m
 }, { immediate: false }); // immediate: false で初回マウント時は実行しない[m
 [m
[36m@@ -888,17 +948,21 @@[m [mdefinePage(computed(() => {[m
 .footer {[m
 	width: 100%;[m
 	padding-top: 8px;[m
[32m+[m	[32mposition: relative;[m
 }[m
 [m
 .typing {[m
 	position: absolute;[m
 	bottom: 100%;[m
[32m+[m	[32mleft: 0;[m
[32m+[m	[32mright: 0;[m
[32m+[m	[32mmargin: 0 auto;[m
 	width: 100%;[m
 	max-width: 700px;[m
[31m-	margin: 0 auto;[m
 	padding: 0 var(--MI_SPACER-h, 16px);[m
 	font-size: 0.9em;[m
 	color: var(--MI_THEME-fgTransparentWeak);[m
[32m+[m	[32mbox-sizing: border-box;[m
 }[m
 [m
 .user + .user:before {[m
