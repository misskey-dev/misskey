<template>
<MkStickyContainer>
<template #header>
	<MkPageHeader />
</template>
<div
	ref="rootEl"
	:class="$style['root']"
	@dragover.prevent.stop="onDragover"
	@drop.prevent.stop="onDrop"
>
	<div :class="$style['body']">
		<MkPagination v-if="pagination" ref="pagingComponent" :key="userAcct || groupId" :pagination="pagination">
			<template #empty>
				<div class="_fullinfo">
					<img src="https://xn--931a.moe/assets/info.jpg" class="_ghost"/>
					<div>{{ i18n.ts.noMessagesYet }}</div>
				</div>
			</template>
			<template #default="{ items: messages, fetching: pFetching }">
				<MkDateSeparatedList
					v-if="messages.length > 0"
					v-slot="{ item: message }"
					:class="{ [$style['messages']]: true, 'deny-move-transition': pFetching }"
					:items="messages"
					direction="up"
					reversed
				>
					<XMessage :key="message.id" :message="message" :is-group="group != null"/>
				</MkDateSeparatedList>
			</template>
		</MkPagination>
	</div>
	<footer :class="$style['footer']">
		<div v-if="typers.length > 0" :class="$style['typers']">
			<I18n :src="i18n.ts.typingUsers" text-tag="span">
				<template #users>
					<b v-for="typer in typers" :key="typer.id" :class="$style['user']">{{ typer.username }}</b>
				</template>
			</I18n>
			<MkEllipsis/>
		</div>
		<Transition :name="animation ? 'fade' : ''">
			<div v-show="showIndicator" :class="$style['new-message']">
				<button class="_buttonPrimary" @click="onIndicatorClick" :class="$style['new-message-button']">
					<i class="fas ti-fw fa-arrow-circle-down" :class="$style['new-message-icon']"></i>{{ i18n.ts.newMessageExists }}
				</button>
			</div>
		</Transition>
		<XForm v-if="!fetching" ref="formEl" :user="user" :group="group" :class="$style['form']"/>
	</footer>
</div>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch, onMounted, nextTick, onBeforeUnmount } from 'vue';
import * as Misskey from 'misskey-js';
import * as Acct from 'misskey-js/built/acct';
import XMessage from './messaging-room.message.vue';
import XForm from './messaging-room.form.vue';
import MkDateSeparatedList from '@/components/MkDateSeparatedList.vue';
import MkPagination, { Paging } from '@/components/MkPagination.vue';
import { isBottomVisible, onScrollBottom, scrollToBottom } from '@/scripts/scroll';
import * as os from '@/os';
import { stream } from '@/stream';
import * as sound from '@/scripts/sound';
import { i18n } from '@/i18n';
import { $i } from '@/account';
import { defaultStore } from '@/store';
import { definePageMetadata } from '@/scripts/page-metadata';

const props = defineProps<{
	userAcct?: string;
	groupId?: string;
}>();

let rootEl = $shallowRef<HTMLDivElement>();
let formEl = $shallowRef<InstanceType<typeof XForm>>();
let pagingComponent = $shallowRef<InstanceType<typeof MkPagination>>();

let fetching = $ref(true);
let user: Misskey.entities.UserDetailed | null = $ref(null);
let group: Misskey.entities.UserGroup | null = $ref(null);
let typers: Misskey.entities.User[] = $ref([]);
let connection: Misskey.ChannelConnection<Misskey.Channels['messaging']> | null = $ref(null);
let showIndicator = $ref(false);
const {
	animation,
} = defaultStore.reactiveState;

let pagination: Paging | null = $ref(null);

watch([() => props.userAcct, () => props.groupId], () => {
	if (connection) connection.dispose();
	fetch();
});

async function fetch() {
	fetching = true;

	if (props.userAcct) {
		const acct = Acct.parse(props.userAcct);
		user = await os.api('users/show', { username: acct.username, host: acct.host || undefined });
		group = null;
		
		pagination = {
			endpoint: 'messaging/messages',
			limit: 20,
			params: {
				userId: user.id,
			},
			reversed: true,
			pageEl: $$(rootEl).value,
		};
		connection = stream.useChannel('messaging', {
			otherparty: user.id,
		});
	} else {
		user = null;
		group = await os.api('users/groups/show', { groupId: props.groupId });

		pagination = {
			endpoint: 'messaging/messages',
			limit: 20,
			params: {
				groupId: group?.id,
			},
			reversed: true,
			pageEl: $$(rootEl).value,
		};
		connection = stream.useChannel('messaging', {
			group: group?.id,
		});
	}

	connection.on('message', onMessage);
	connection.on('read', onRead);
	connection.on('deleted', onDeleted);
	connection.on('typers', _typers => {
		typers = _typers.filter(u => u.id !== $i?.id);
	});

	document.addEventListener('visibilitychange', onVisibilitychange);

	nextTick(() => {
		pagingComponent.inited.then(() => {
			thisScrollToBottom();
		});
		window.setTimeout(() => {
			fetching = false;
		}, 300);
	});
}

function onDragover(ev: DragEvent) {
	if (!ev.dataTransfer) return;

	const isFile = ev.dataTransfer.items[0].kind === 'file';
	const isDriveFile = ev.dataTransfer.types[0] === _DATA_TRANSFER_DRIVE_FILE_;

	if (isFile || isDriveFile) {
		switch (ev.dataTransfer.effectAllowed) {
			case 'all':
			case 'uninitialized':
			case 'copy': 
			case 'copyLink': 
			case 'copyMove': 
				ev.dataTransfer.dropEffect = 'copy';
				break;
			case 'linkMove':
			case 'move':
				ev.dataTransfer.dropEffect = 'move';
				break;
			default:
				ev.dataTransfer.dropEffect = 'none';
				break;
		}
	} else {
		ev.dataTransfer.dropEffect = 'none';
	}
}

function onDrop(ev: DragEvent): void {
	if (!ev.dataTransfer) return;

	// ファイルだったら
	if (ev.dataTransfer.files.length === 1) {
		formEl.upload(ev.dataTransfer.files[0]);
		return;
	} else if (ev.dataTransfer.files.length > 1) {
		os.alert({
			type: 'error',
			text: i18n.ts.onlyOneFileCanBeAttached,
		});
		return;
	}

	//#region ドライブのファイル
	const driveFile = ev.dataTransfer.getData(_DATA_TRANSFER_DRIVE_FILE_);
	if (driveFile != null && driveFile !== '') {
		const file = JSON.parse(driveFile);
		formEl.file = file;
	}
	//#endregion
}

function onMessage(message) {
	sound.play('chat');

	const _isBottom = isBottomVisible(rootEl, 64);

	pagingComponent.prepend(message);
	if (message.userId !== $i?.id && !document.hidden) {
		connection?.send('read', {
			id: message.id,
		});
	}

	if (_isBottom) {
		// Scroll to bottom
		nextTick(() => {
			thisScrollToBottom();
		});
	} else if (message.userId !== $i?.id) {
		// Notify
		notifyNewMessage();
	}
}

function onRead(x) {
	if (user) {
		if (!Array.isArray(x)) x = [x];
		for (const id of x) {
			if (pagingComponent.items.some(y => y.id === id)) {
				const exist = pagingComponent.items.map(y => y.id).indexOf(id);
				pagingComponent.items[exist] = {
					...pagingComponent.items[exist],
					isRead: true,
				};
			}
		}
	} else if (group) {
		for (const id of x.ids) {
			if (pagingComponent.items.some(y => y.id === id)) {
				const exist = pagingComponent.items.map(y => y.id).indexOf(id);
				pagingComponent.items[exist] = {
					...pagingComponent.items[exist],
					reads: [...pagingComponent.items[exist].reads, x.userId],
				};
			}
		}
	}
}

function onDeleted(id) {
	const msg = pagingComponent.items.find(m => m.id === id);
	if (msg) {
		pagingComponent.items = pagingComponent.items.filter(m => m.id !== msg.id);
	}
}

function thisScrollToBottom() {
	scrollToBottom($$(rootEl).value, { behavior: 'smooth' });
}

function onIndicatorClick() {
	showIndicator = false;
	thisScrollToBottom();
}

let scrollRemove: (() => void) | null = $ref(null);

function notifyNewMessage() {
	showIndicator = true;

	scrollRemove = onScrollBottom(rootEl, () => {
		showIndicator = false;
		scrollRemove = null;
	});
}

function onVisibilitychange() {
	if (document.hidden) return;
	for (const message of pagingComponent.items) {
		if (message.userId !== $i?.id && !message.isRead) {
			connection?.send('read', {
				id: message.id,
			});
		}
	}
}

onMounted(() => {
	fetch();
});

onBeforeUnmount(() => {
	connection?.dispose();
	document.removeEventListener('visibilitychange', onVisibilitychange);
	if (scrollRemove) scrollRemove();
});

definePageMetadata(computed(() => !fetching ? user ? {
	userName: user,
	avatar: user,
} : {
	title: group?.name,
	icon: 'ti ti-users',
} : null));
</script>

<style lang="scss" module>
.root {
	display: content;
}

.body {
	min-height: 80%;
}

.more {
	display: block;
	margin: 16px auto;
	padding: 0 12px;
	line-height: 24px;
	color: #fff;
	background: rgba(#000, 0.3);
	border-radius: 12px;
	&:hover {
		background: rgba(#000, 0.4);
	}
	&:active {
		background: rgba(#000, 0.5);
	}
	> i {
		margin-right: 4px;
	}
}

.fetching {
	cursor: wait;
}

.messages {
	padding: 16px 0 0;

	> * {
		margin-bottom: 16px;
	}
}

.footer {
	width: 100%;
	position: sticky;
	z-index: 2;
	padding-top: 8px;
	bottom: var(--minBottomSpacing);
}

.new-message {
	width: 100%;
	padding-bottom: 8px;
	text-align: center;
}

.new-message-button {
	display: inline-block;
	margin: 0;
	padding: 0 12px;
	line-height: 32px;
	font-size: 12px;
	border-radius: 16px;
}

.new-message-icon {
	display: inline-block;
	margin-right: 8px;
}

.typers {
	position: absolute;
	bottom: 100%;
	padding: 0 8px 0 8px;
	font-size: 0.9em;
	color: var(--fgTransparentWeak);
}


.user + .user:before {
	content: ", ";
	font-weight: normal;
}

.user:last-of-type:after {
	content: " ";
}

.form {
	max-height: 12em;
	overflow-y: scroll;
	border-top: solid 0.5px var(--divider);
	border-bottom-left-radius: 0;
	border-bottom-right-radius: 0;
}

.fade-enter-active, .fade-leave-active {
	transition: opacity 0.1s;
}

.fade-enter-from, .fade-leave-to {
	transition: opacity 0.5s;
	opacity: 0;
}
</style>
