<template>
<div
	v-if="!muted"
	v-show="!isDeleted"
	ref="el"
	v-hotkey="keymap"
	v-size="{ max: [500, 450, 350, 300] }"
	class="lxwezrsl _block"
	:tabindex="!isDeleted ? '-1' : null"
	:class="{ renote: isRenote }"
>
	<MkNoteSub v-for="note in conversation" :key="note.id" class="reply-to-more" :note="note"/>
	<MkNoteSub v-if="appearNote.reply" :note="appearNote.reply" class="reply-to"/>
	<div v-if="isRenote" class="renote">
		<MkAvatar class="avatar" :user="note.user"/>
		<i class="fas fa-retweet"></i>
		<I18n :src="$ts.renotedBy" tag="span">
			<template #user>
				<MkA v-user-preview="note.userId" class="name" :to="userPage(note.user)">
					<MkUserName :user="note.user"/>
				</MkA>
			</template>
		</I18n>
		<div class="info">
			<button ref="renoteTime" class="_button time" @click="showRenoteMenu()">
				<i v-if="isMyRenote" class="fas fa-ellipsis-h dropdownIcon"></i>
				<MkTime :time="note.createdAt"/>
			</button>
			<span v-if="note.visibility !== 'public'" class="visibility">
				<i v-if="note.visibility === 'home'" class="fas fa-home"></i>
				<i v-else-if="note.visibility === 'followers'" class="fas fa-unlock"></i>
				<i v-else-if="note.visibility === 'specified'" class="fas fa-envelope"></i>
			</span>
			<span v-if="note.localOnly" class="localOnly"><i class="fas fa-biohazard"></i></span>
		</div>
	</div>
	<article class="article" @contextmenu.stop="onContextmenu">
		<header class="header">
			<MkAvatar class="avatar" :user="appearNote.user" :show-indicator="true"/>
			<div class="body">
				<div class="top">
					<MkA v-user-preview="appearNote.user.id" class="name" :to="userPage(appearNote.user)">
						<MkUserName :user="appearNote.user"/>
					</MkA>
					<span v-if="appearNote.user.isBot" class="is-bot">bot</span>
					<span v-if="appearNote.visibility !== 'public'" class="visibility">
						<i v-if="appearNote.visibility === 'home'" class="fas fa-home"></i>
						<i v-else-if="appearNote.visibility === 'followers'" class="fas fa-unlock"></i>
						<i v-else-if="appearNote.visibility === 'specified'" class="fas fa-envelope"></i>
					</span>
					<span v-if="appearNote.localOnly" class="localOnly"><i class="fas fa-biohazard"></i></span>
				</div>
				<div class="username"><MkAcct :user="appearNote.user"/></div>
				<MkInstanceTicker v-if="showTicker" class="ticker" :instance="appearNote.user.instance"/>
			</div>
		</header>
		<div class="main">
			<div class="body">
				<p v-if="appearNote.cw != null" class="cw">
					<Mfm v-if="appearNote.cw != ''" class="text" :text="appearNote.cw" :author="appearNote.user" :i="$i" :custom-emojis="appearNote.emojis"/>
					<XCwButton v-model="showContent" :note="appearNote"/>
				</p>
				<div v-show="appearNote.cw == null || showContent" class="content">
					<div class="text">
						<span v-if="appearNote.isHidden" style="opacity: 0.5">({{ $ts.private }})</span>
						<MkA v-if="appearNote.replyId" class="reply" :to="`/notes/${appearNote.replyId}`"><i class="fas fa-reply"></i></MkA>
						<Mfm v-if="appearNote.text" :text="appearNote.text" :author="appearNote.user" :i="$i" :custom-emojis="appearNote.emojis"/>
						<a v-if="appearNote.renote != null" class="rp">RN:</a>
						<div v-if="translating || translation" class="translation">
							<MkLoading v-if="translating" mini/>
							<div v-else class="translated">
								<b>{{ $t('translatedFrom', { x: translation.sourceLang }) }}: </b>
								<Mfm :text="translation.text" :author="appearNote.user" :i="$i" :custom-emojis="appearNote.emojis"/>
							</div>
						</div>
					</div>
					<div v-if="appearNote.files.length > 0" class="files">
						<XMediaList :media-list="appearNote.files"/>
					</div>
					<XPoll v-if="appearNote.poll" ref="pollViewer" :note="appearNote" class="poll"/>
					<MkUrlPreview v-for="url in urls" :key="url" :url="url" :compact="true" :detail="true" class="url-preview"/>
					<div v-if="appearNote.renote" class="renote"><XNoteSimple :note="appearNote.renote"/></div>
				</div>
				<MkA v-if="appearNote.channel && !inChannel" class="channel" :to="`/channels/${appearNote.channel.id}`"><i class="fas fa-satellite-dish"></i> {{ appearNote.channel.name }}</MkA>
			</div>
			<footer class="footer">
				<div class="info">
					<MkA class="created-at" :to="notePage(appearNote)">
						<MkTime :time="appearNote.createdAt" mode="detail"/>
					</MkA>
				</div>
				<XReactionsViewer ref="reactionsViewer" :note="appearNote"/>
				<button class="button _button" @click="reply()">
					<template v-if="appearNote.reply"><i class="fas fa-reply-all"></i></template>
					<template v-else><i class="fas fa-reply"></i></template>
					<p v-if="appearNote.repliesCount > 0" class="count">{{ appearNote.repliesCount }}</p>
				</button>
				<XRenoteButton ref="renoteButton" class="button" :note="appearNote" :count="appearNote.renoteCount"/>
				<button v-if="appearNote.myReaction == null" ref="reactButton" class="button _button" @click="react()">
					<i class="fas fa-plus"></i>
				</button>
				<button v-if="appearNote.myReaction != null" ref="reactButton" class="button _button reacted" @click="undoReact(appearNote)">
					<i class="fas fa-minus"></i>
				</button>
				<button ref="menuButton" class="button _button" @click="menu()">
					<i class="fas fa-ellipsis-h"></i>
				</button>
			</footer>
		</div>
	</article>
	<MkNoteSub v-for="note in replies" :key="note.id" :note="note" class="reply" :detail="true"/>
</div>
<div v-else class="_panel muted" @click="muted = false">
	<I18n :src="$ts.userSaysSomething" tag="small">
		<template #name>
			<MkA v-user-preview="appearNote.userId" class="name" :to="userPage(appearNote.user)">
				<MkUserName :user="appearNote.user"/>
			</MkA>
		</template>
	</I18n>
</div>
</template>

<script lang="ts" setup>
import { computed, inject, onMounted, onUnmounted, reactive, ref } from 'vue';
import * as mfm from 'mfm-js';
import * as misskey from 'misskey-js';
import MkNoteSub from './MkNoteSub.vue';
import XNoteSimple from './note-simple.vue';
import XReactionsViewer from './reactions-viewer.vue';
import XMediaList from './media-list.vue';
import XCwButton from './cw-button.vue';
import XPoll from './poll.vue';
import XRenoteButton from './renote-button.vue';
import MkUrlPreview from '@/components/url-preview.vue';
import MkInstanceTicker from '@/components/instance-ticker.vue';
import { pleaseLogin } from '@/scripts/please-login';
import { checkWordMute } from '@/scripts/check-word-mute';
import { userPage } from '@/filters/user';
import { notePage } from '@/filters/note';
import * as os from '@/os';
import { defaultStore, noteViewInterruptors } from '@/store';
import { reactionPicker } from '@/scripts/reaction-picker';
import { extractUrlFromMfm } from '@/scripts/extract-url-from-mfm';
import { $i } from '@/account';
import { i18n } from '@/i18n';
import { getNoteMenu } from '@/scripts/get-note-menu';
import { useNoteCapture } from '@/scripts/use-note-capture';

const props = defineProps<{
	note: misskey.entities.Note;
	pinned?: boolean;
}>();

const inChannel = inject('inChannel', null);

let note = $ref(JSON.parse(JSON.stringify(props.note)));

// plugin
if (noteViewInterruptors.length > 0) {
	onMounted(async () => {
		let result = JSON.parse(JSON.stringify(note));
		for (const interruptor of noteViewInterruptors) {
			result = await interruptor.handler(result);
		}
		note = result;
	});
}

const isRenote = (
	note.renote != null &&
	note.text == null &&
	note.fileIds.length === 0 &&
	note.poll == null
);

const el = ref<HTMLElement>();
const menuButton = ref<HTMLElement>();
const renoteButton = ref<InstanceType<typeof XRenoteButton>>();
const renoteTime = ref<HTMLElement>();
const reactButton = ref<HTMLElement>();
let appearNote = $computed(() => isRenote ? note.renote as misskey.entities.Note : note);
const isMyRenote = $i && ($i.id === note.userId);
const showContent = ref(false);
const isDeleted = ref(false);
const muted = ref(checkWordMute(appearNote, $i, defaultStore.state.mutedWords));
const translation = ref(null);
const translating = ref(false);
const urls = appearNote.text ? extractUrlFromMfm(mfm.parse(appearNote.text)) : null;
const showTicker = (defaultStore.state.instanceTicker === 'always') || (defaultStore.state.instanceTicker === 'remote' && appearNote.user.instance);
const conversation = ref<misskey.entities.Note[]>([]);
const replies = ref<misskey.entities.Note[]>([]);

const keymap = {
	'r': () => reply(true),
	'e|a|plus': () => react(true),
	'q': () => renoteButton.value.renote(true),
	'esc': blur,
	'm|o': () => menu(true),
	's': () => showContent.value !== showContent.value,
};

useNoteCapture({
	rootEl: el,
	note: $$(appearNote),
	isDeletedRef: isDeleted,
});

function reply(viaKeyboard = false): void {
	pleaseLogin();
	os.post({
		reply: appearNote,
		animation: !viaKeyboard,
	}, () => {
		focus();
	});
}

function react(viaKeyboard = false): void {
	pleaseLogin();
	blur();
	reactionPicker.show(reactButton.value, reaction => {
		os.api('notes/reactions/create', {
			noteId: appearNote.id,
			reaction: reaction,
		});
	}, () => {
		focus();
	});
}

function undoReact(note): void {
	const oldReaction = note.myReaction;
	if (!oldReaction) return;
	os.api('notes/reactions/delete', {
		noteId: note.id,
	});
}

function onContextmenu(ev: MouseEvent): void {
	const isLink = (el: HTMLElement) => {
		if (el.tagName === 'A') return true;
		if (el.parentElement) {
			return isLink(el.parentElement);
		}
	};
	if (isLink(ev.target)) return;
	if (window.getSelection().toString() !== '') return;

	if (defaultStore.state.useReactionPickerForContextMenu) {
		ev.preventDefault();
		react();
	} else {
		os.contextMenu(getNoteMenu({ note: note, translating, translation, menuButton }), ev).then(focus);
	}
}

function menu(viaKeyboard = false): void {
	os.popupMenu(getNoteMenu({ note: note, translating, translation, menuButton }), menuButton.value, {
		viaKeyboard,
	}).then(focus);
}

function showRenoteMenu(viaKeyboard = false): void {
	if (!isMyRenote) return;
	os.popupMenu([{
		text: i18n.ts.unrenote,
		icon: 'fas fa-trash-alt',
		danger: true,
		action: () => {
			os.api('notes/delete', {
				noteId: note.id,
			});
			isDeleted.value = true;
		},
	}], renoteTime.value, {
		viaKeyboard: viaKeyboard,
	});
}

function focus() {
	el.value.focus();
}

function blur() {
	el.value.blur();
}

os.api('notes/children', {
	noteId: appearNote.id,
	limit: 30,
}).then(res => {
	replies.value = res;
});

if (appearNote.replyId) {
	os.api('notes/conversation', {
		noteId: appearNote.replyId,
	}).then(res => {
		conversation.value = res.reverse();
	});
}
</script>

<style lang="scss" scoped>
.lxwezrsl {
	position: relative;
	transition: box-shadow 0.1s ease;
	overflow: hidden;
	contain: content;

	&:focus-visible {
		outline: none;

		&:after {
			content: "";
			pointer-events: none;
			display: block;
			position: absolute;
			z-index: 10;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			margin: auto;
			width: calc(100% - 8px);
			height: calc(100% - 8px);
			border: dashed 1px var(--focus);
			border-radius: var(--radius);
			box-sizing: border-box;
		}
	}

	&:hover > .article > .main > .footer > .button {
		opacity: 1;
	}

	> .reply-to {
		opacity: 0.7;
		padding-bottom: 0;
	}

	> .reply-to-more {
		opacity: 0.7;
	}

	> .renote {
		display: flex;
		align-items: center;
		padding: 16px 32px 8px 32px;
		line-height: 28px;
		white-space: pre;
		color: var(--renote);

		> .avatar {
			flex-shrink: 0;
			display: inline-block;
			width: 28px;
			height: 28px;
			margin: 0 8px 0 0;
			border-radius: 6px;
		}

		> i {
			margin-right: 4px;
		}

		> span {
			overflow: hidden;
			flex-shrink: 1;
			text-overflow: ellipsis;
			white-space: nowrap;

			> .name {
				font-weight: bold;
			}
		}

		> .info {
			margin-left: auto;
			font-size: 0.9em;

			> .time {
				flex-shrink: 0;
				color: inherit;

				> .dropdownIcon {
					margin-right: 4px;
				}
			}

			> .visibility {
				margin-left: 8px;
			}

			> .localOnly {
				margin-left: 8px;
			}
		}
	}

	> .renote + .article {
		padding-top: 8px;
	}

	> .article {
		padding: 32px;
		font-size: 1.1em;

		> .header {
			display: flex;
			position: relative;
			margin-bottom: 16px;

			> .avatar {
				display: block;
				flex-shrink: 0;
				width: 58px;
				height: 58px;
			}

			> .body {
				flex: 1;
				display: flex;
				flex-direction: column;
				justify-content: center;
				padding-left: 16px;
				font-size: 0.95em;

				> .top {
					> .name {
						font-weight: bold;
					}

					> .is-bot {
						flex-shrink: 0;
						align-self: center;
						margin: 0 0.5em;
						padding: 4px 6px;
						font-size: 80%;
						border: solid 0.5px var(--divider);
						border-radius: 4px;
					}
				}
			}
		}

		> .main {
			> .body {
				> .cw {
					cursor: default;
					display: block;
					margin: 0;
					padding: 0;
					overflow-wrap: break-word;

					> .text {
						margin-right: 8px;
					}
				}

				> .content {
					> .text {
						overflow-wrap: break-word;

						> .reply {
							color: var(--accent);
							margin-right: 0.5em;
						}

						> .rp {
							margin-left: 4px;
							font-style: oblique;
							color: var(--renote);
						}

						> .translation {
							border: solid 0.5px var(--divider);
							border-radius: var(--radius);
							padding: 12px;
							margin-top: 8px;
						}
					}

					> .url-preview {
						margin-top: 8px;
					}

					> .poll {
						font-size: 80%;
					}

					> .renote {
						padding: 8px 0;

						> * {
							padding: 16px;
							border: dashed 1px var(--renote);
							border-radius: 8px;
						}
					}
				}

				> .channel {
					opacity: 0.7;
					font-size: 80%;
				}
			}

			> .footer {
				> .info {
					margin: 16px 0;
					opacity: 0.7;
					font-size: 0.9em;
				}

				> .button {
					margin: 0;
					padding: 8px;
					opacity: 0.7;

					&:not(:last-child) {
						margin-right: 28px;
					}

					&:hover {
						color: var(--fgHighlighted);
					}

					> .count {
						display: inline;
						margin: 0 0 0 8px;
						opacity: 0.7;
					}

					&.reacted {
						color: var(--accent);
					}
				}
			}
		}
	}

	> .reply {
		border-top: solid 0.5px var(--divider);
	}

	&.max-width_500px {
		font-size: 0.9em;
	}

	&.max-width_450px {
		> .renote {
			padding: 8px 16px 0 16px;
		}

		> .article {
			padding: 16px;

			> .header {
				> .avatar {
					width: 50px;
					height: 50px;
				}
			}
		}
	}

	&.max-width_350px {
		> .article {
			> .main {
				> .footer {
					> .button {
						&:not(:last-child) {
							margin-right: 18px;
						}
					}
				}
			}
		}
	}

	&.max-width_300px {
		font-size: 0.825em;

		> .article {
			> .header {
				> .avatar {
					width: 50px;
					height: 50px;
				}
			}

			> .main {
				> .footer {
					> .button {
						&:not(:last-child) {
							margin-right: 12px;
						}
					}
				}
			}
		}
	}
}

.muted {
	padding: 8px;
	text-align: center;
	opacity: 0.7;
}
</style>
