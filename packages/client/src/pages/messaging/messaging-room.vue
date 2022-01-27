<template>
<div class="_section"
	@dragover.prevent.stop="onDragover"
	@drop.prevent.stop="onDrop"
	ref="rootEl"
>
	<div class="_content mk-messaging-room">
		<div class="body">
			<MkPagination v-if="pagination" ref="pagingComponent" :pagination="pagination">
				<template #empty>
					<i class="fas fa-info-circle"></i>{{ $ts.noMessagesYet }}</p>
				</template>

				<template #defalut="{ items: messages }">
					<XList v-slot="{ item: message }" class="messages" :items="messages" direction="up" reversed>
						<XMessage :key="message.id" :message="message" :is-group="group != null"/>
					</XList>
				</template>
			</MkPagination>
			<MkLoading v-if="fetching"/>
		</div>
		<footer>
			<div v-if="typers.length > 0" class="typers">
				<I18n :src="$ts.typingUsers" text-tag="span" class="users">
					<template #users>
						<b v-for="user in typers" :key="user.id" class="user">{{ user.username }}</b>
					</template>
				</I18n>
				<MkEllipsis/>
			</div>
			<transition :name="$store.state.animation ? 'fade' : ''">
				<div v-show="showIndicator" class="new-message">
					<button class="_buttonPrimary" @click="onIndicatorClick"><i class="fas fa-arrow-circle-down"></i>{{ $ts.newMessageExists }}</button>
				</div>
			</transition>
			<XForm v-if="!fetching" ref="form" :user="user" :group="group" class="form"/>
		</footer>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, watch, onMounted, nextTick, onBeforeUnmount } from 'vue';
import * as Misskey from 'misskey-js';
import XList from '@/components/date-separated-list.vue';
import MkPagination from '@/components/ui/pagination.vue';
import { Paging } from '@/components/ui/pagination.vue';
import XMessage from './messaging-room.message.vue';
import XForm from './messaging-room.form.vue';
import * as Acct from 'misskey-js/built/acct';
import { isBottom, onScrollBottom, scroll } from '@/scripts/scroll';
import * as os from '@/os';
import { stream } from '@/stream';
import { popout } from '@/scripts/popout';
import * as sound from '@/scripts/sound';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';
import { defaultStore } from '@/store';
import { $i } from '@/account';

const props = defineProps<{
	userAcct?: string;
	groupId?: string;
}>();

let rootEl = $ref<Element>();
let form = $ref<InstanceType<typeof XForm>>();
let loadMore = $ref<HTMLDivElement>();
let pagingComponent = $ref<InstanceType<typeof MkPagination>>();

let fetching = $ref(true);
let user: Misskey.entities.UserDetailed | null = $ref(null);
let group: Misskey.entities.UserGroup | null = $ref(null);
let connection: Misskey.ChannelConnection<Misskey.Channels['messaging']> | null = $ref(null);
let showIndicator = $ref(false);
let timer: number | null = $ref(null);

let pagination: Paging = $computed(() => {
	return {
		endpoint: 'messaging/messages',
		limit: pagingComponent?.more ? 20 : 10,
		params: {
			userId: user ? user.id : undefined,
			groupId: group ? group.id : undefined,
		},
		reversed: true,
	};
});

const ilObserver = new IntersectionObserver(
	(entries) => entries.some((entry) => entry.isIntersecting)
		&& !fetching
		&& pagingComponent?.more
		&& fetchMoreMessages()
);

watch([() => props.userAcct, () => props.groupId], () => {
	if (connection) connection.dispose();
	fetch();
});

async function fetch() {
	fetching = true;

	connection = stream.useChannel('messaging', {
		otherparty: user ? user.id : undefined,
		group: group ? group.id : undefined,
	});

	connection?.on('message', onMessage);
	connection?.on('deleted', onDeleted);
	connection?.on('typers', typers => {
		typers = typers.filter(u => u.id !== $i.id);
	});

	document.addEventListener('visibilitychange', onVisibilitychange);

	pagingComponent.fetchMoreAhead().then(() => {
		scrollToBottom();

		// もっと見るの交差検知を発火させないためにfetchは
		// スクロールが終わるまでfalseにしておく
		// scrollendのようなイベントはないのでsetTimeoutで
		window.setTimeout(() => fetching = false, 300);
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
		form.upload(e.dataTransfer.files[0]);
		return;
	} else if (e.dataTransfer.files.length > 1) {
		os.alert({
			type: 'error',
			text: i18n.locale.onlyOneFileCanBeAttached
		});
		return;
	}

	//#region ドライブのファイル
	const driveFile = e.dataTransfer.getData(_DATA_TRANSFER_DRIVE_FILE_);
	if (driveFile != null && driveFile != '') {
		const file = JSON.parse(driveFile);
		form.file = file;
	}
	//#endregion
}

function fetchMoreMessages() {
	fetching = true;
	pagingComponent.fetchMoreAhead().then(() => {
		fetching = false;
	});
}

function onMessage(message) {
	sound.play('chat');

	const _isBottom = isBottom(rootEl, 64);

	pagingComponent.append(message);
	if (message.userId != $i.id && !document.hidden) {
		connection?.send('read', {
			id: message.id
		});
	}

	if (_isBottom) {
		// Scroll to bottom
		nextTick(() => {
			scrollToBottom();
		});
	} else if (message.userId != $i.id) {
		// Notify
		notifyNewMessage();
	}
}

function onDeleted(id) {
	const msg = messages.find(m => m.id === id);
	if (msg) {
		messages = messages.filter(m => m.id !== msg.id);
	}
}

function scrollToBottom() {
	scroll(rootEl, { top: rootEl.offsetHeight });
}

function onIndicatorClick() {
	showIndicator = false;
	scrollToBottom();
}

function notifyNewMessage() {
	showIndicator = true;

	onScrollBottom(rootEl, () => {
		showIndicator = false;
	});

	if (timer) window.clearTimeout(timer);
	timer = window.setTimeout(() => {
		showIndicator = false;
	}, 4000);
}

function onVisibilitychange() {
	if (document.hidden) return;
	for (const message of messages) {
		if (message.userId !== $i.id && !message.isRead) {
			connection?.send('read', {
				id: message.id
			});
		}
	}
}

onMounted(() => {
	fetch();
	if (defaultStore.state.enableInfiniteScroll) {
		nextTick(() => ilObserver.observe(loadMore));
	}
});

onBeforeUnmount(() => {
	connection?.dispose();
	document.removeEventListener('visibilitychange', onVisibilitychange);
	ilObserver.disconnect();
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
	> .body {
		> .empty {
			width: 100%;
			margin: 0;
			padding: 16px 8px 8px 8px;
			text-align: center;
			font-size: 0.8em;
			opacity: 0.5;

			i {
				margin-right: 4px;
			}
		}

		> .no-history {
			display: block;
			margin: 0;
			padding: 16px;
			text-align: center;
			font-size: 0.8em;
			color: var(--messagingRoomInfo);
			opacity: 0.5;

			i {
				margin-right: 4px;
			}
		}

		> .more {
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

		> .messages {
			> ::v-deep(*) {
				margin-bottom: 16px;
			}
		}
	}

	> footer {
		width: 100%;
		position: relative;

		> .new-message {
			position: absolute;
			top: -48px;
			width: 100%;
			padding: 8px 0;
			text-align: center;

			> button {
				display: inline-block;
				margin: 0;
				padding: 0 12px 0 30px;
				line-height: 32px;
				font-size: 12px;
				border-radius: 16px;

				> i {
					position: absolute;
					top: 0;
					left: 10px;
					line-height: 32px;
					font-size: 16px;
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
