<template>
<div class="_section"
	@dragover.prevent.stop="onDragover"
	@drop.prevent.stop="onDrop"
	ref="rootEl"
>
	<div class="_content mk-messaging-room">
		<div class="body">
			<MkPagination ref="pagingComponent" :key="userAcct || groupId" v-if="pagination" :pagination="pagination">
				<template #empty>
					<div class="_fullinfo">
						<img src="https://xn--931a.moe/assets/info.jpg" class="_ghost"/>
						<div>{{ i18n.ts.noMessagesYet }}</div>
					</div>
				</template>

				<template #default="{ items: messages, fetching, itemsContainerWrapped }">
					<XList
						v-if="messages.length > 0"
						v-slot="{ item: message }"
						:class="{ messages: true, 'deny-move-transition': fetching }"
						:items="messages"
						v-model:itemsContainer="itemsContainerWrapped.v.value"
						direction="up"
						reversed
					>
						<XMessage :key="message.id" :message="message" :is-group="group != null"/>
					</XList>
				</template>
			</MkPagination>
		</div>
		<footer>
			<div v-if="typers.length > 0" class="typers">
				<I18n :src="i18n.ts.typingUsers" text-tag="span" class="users">
					<template #users>
						<b v-for="user in typers" :key="user.id" class="user">{{ user.username }}</b>
					</template>
				</I18n>
				<MkEllipsis/>
			</div>
			<transition :name="animation ? 'fade' : ''">
				<div class="new-message" v-show="showIndicator">
					<button class="_buttonPrimary" @click="onIndicatorClick"><i class="fas fa-fw fa-arrow-circle-down"></i>{{ i18n.ts.newMessageExists }}</button>
				</div>
			</transition>
			<XForm v-if="!fetching" ref="formEl" :user="user" :group="group" class="form"/>
		</footer>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, watch, onMounted, nextTick, onBeforeUnmount } from 'vue';
import * as Misskey from 'misskey-js';
import * as Acct from 'misskey-js/built/acct';
import XList from '@/components/date-separated-list.vue';
import MkPagination, { Paging } from '@/components/ui/pagination.vue';
import XMessage from './messaging-room.message.vue';
import XForm from './messaging-room.form.vue';
import { isBottom, onScrollBottom, scrollToBottom } from '@/scripts/scroll';
import * as os from '@/os';
import { stream } from '@/stream';
import * as sound from '@/scripts/sound';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';
import { $i } from '@/account';
import { defaultStore } from '@/store';

const props = defineProps<{
	userAcct?: string;
	groupId?: string;
}>();

let rootEl = $ref<HTMLDivElement>();
let formEl = $ref<InstanceType<typeof XForm>>();
let pagingComponent = $ref<InstanceType<typeof MkPagination>>();

let fetching = $ref(true);
let user: Misskey.entities.UserDetailed | null = $ref(null);
let group: Misskey.entities.UserGroup | null = $ref(null);
let typers: Misskey.entities.User[] = $ref([]);
let connection: Misskey.ChannelConnection<Misskey.Channels['messaging']> | null = $ref(null);
let showIndicator = $ref(false);
const {
	animation
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
	connection.on('typers', typers => {
		typers = typers.filter(u => u.id !== $i?.id);
	});

	document.addEventListener('visibilitychange', onVisibilitychange);

	nextTick(() => {
		pagingComponent.inited.then(() => {
			thisScrollToBottom();
		});
		window.setTimeout(() => {
			fetching = false
		}, 300);
	});
}

function onDragover(e: DragEvent) {
	if (!e.dataTransfer) return;

	const isFile = e.dataTransfer.items[0].kind == 'file';
	const isDriveFile = e.dataTransfer.types[0] == _DATA_TRANSFER_DRIVE_FILE_;

	if (isFile || isDriveFile) {
		e.dataTransfer.dropEffect = e.dataTransfer.effectAllowed == 'all' ? 'copy' : 'move';
	} else {
		e.dataTransfer.dropEffect = 'none';
	}
}

function onDrop(e: DragEvent): void {
	if (!e.dataTransfer) return;

	// ファイルだったら
	if (e.dataTransfer.files.length == 1) {
		formEl.upload(e.dataTransfer.files[0]);
		return;
	} else if (e.dataTransfer.files.length > 1) {
		os.alert({
			type: 'error',
			text: i18n.ts.onlyOneFileCanBeAttached
		});
		return;
	}

	//#region ドライブのファイル
	const driveFile = e.dataTransfer.getData(_DATA_TRANSFER_DRIVE_FILE_);
	if (driveFile != null && driveFile != '') {
		const file = JSON.parse(driveFile);
		formEl.file = file;
	}
	//#endregion
}

function onMessage(message) {
	sound.play('chat');

	const _isBottom = isBottom(rootEl, 64);

	pagingComponent.prepend(message);
	if (message.userId != $i?.id && !document.hidden) {
		connection?.send('read', {
			id: message.id
		});
	}

	if (_isBottom) {
		// Scroll to bottom
		nextTick(() => {
			thisScrollToBottom();
		});
	} else if (message.userId != $i?.id) {
		// Notify
		notifyNewMessage();
	}
}

function onRead(x) {
	if (user) {
		if (!Array.isArray(x)) x = [x];
		for (const id of x) {
			if (pagingComponent.items.some(x => x.id == id)) {
				const exist = pagingComponent.items.map(x => x.id).indexOf(id);
				pagingComponent.items[exist] = {
					...pagingComponent.items[exist],
					isRead: true,
				};
			}
		}
	} else if (group) {
		for (const id of x.ids) {
			if (pagingComponent.items.some(x => x.id == id)) {
				const exist = pagingComponent.items.map(x => x.id).indexOf(id);
				pagingComponent.items[exist] = {
					...pagingComponent.items[exist],
					reads: [...pagingComponent.items[exist].reads, x.userId]
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
	scrollToBottom($$(rootEl).value, { behavior: "smooth" });
}

function onIndicatorClick() {
	showIndicator = false;
	thisScrollToBottom();
}

function notifyNewMessage() {
	showIndicator = true;

	onScrollBottom(rootEl, () => {
		showIndicator = false;
	});
}

function onVisibilitychange() {
	if (document.hidden) return;
	for (const message of pagingComponent.items) {
		if (message.userId !== $i?.id && !message.isRead) {
			connection?.send('read', {
				id: message.id
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
});

defineExpose({
	[symbols.PAGE_INFO]: computed(() => !fetching ? user ? {
			userName: user,
			avatar: user,
		} : {
			title: group?.name,
			icon: 'fas fa-users',
		} : null),
});
</script>

<style lang="scss" scoped>
.mk-messaging-room {
	position: relative;

	> .body {
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

			&.fetching {
				cursor: wait;
			}

			> i {
				margin-right: 4px;
			}
		}

		.messages {
			padding-top: 8px;

			> ::v-deep(*) {
				margin-bottom: 16px;
			}
		}
	}

	> footer {
		width: 100%;
		position: sticky;
		z-index: 2;
		bottom: 0;
		padding-top: 8px;

		@media (max-width: 500px) {
			bottom: 92px;
		}

		> .new-message {
			width: 100%;
			padding-bottom: 8px;
			text-align: center;

			> button {
				display: inline-block;
				margin: 0;
				padding: 0 12px;
				line-height: 32px;
				font-size: 12px;
				border-radius: 16px;

				> i {
					display: inline-block;
					margin-right: 8px;
				}
			}
		}

		> .typers {
			position: absolute;
			bottom: 100%;
			padding: 0 8px 0 8px;
			font-size: 0.9em;
			color: var(--fgTransparentWeak);

			> .users {
				> .user + .user:before {
					content: ", ";
					font-weight: normal;
				}

				> .user:last-of-type:after {
					content: " ";
				}
			}
		}

		> .form {
			max-height: 12em;
			overflow-y: scroll;
			border-top: solid 0.5px var(--divider);
		}
	}
}

.fade-enter-active, .fade-leave-active {
	transition: opacity 0.1s;
}

.fade-enter-from, .fade-leave-to {
	transition: opacity 0.5s;
	opacity: 0;
}
</style>
