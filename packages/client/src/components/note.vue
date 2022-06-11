<template>
<div
	v-if="!muted"
	v-show="!isDeleted"
	ref="el"
	v-hotkey="keymap"
	v-size="{ max: [500, 450, 350, 300] }"
	class="tkcbzcuz"
	:tabindex="!isDeleted ? '-1' : null"
	:class="{ renote: isRenote }"
>
	<MkNoteSub v-if="appearNote.reply" :note="appearNote.reply" class="reply-to"/>
	<div v-if="pinned" class="info"><i class="fas fa-thumbtack"></i> {{ i18n.ts.pinnedNote }}</div>
	<div v-if="appearNote._prId_" class="info"><i class="fas fa-bullhorn"></i> {{ i18n.ts.promotion }}<button class="_textButton hide" @click="readPromo()">{{ i18n.ts.hideThisNote }} <i class="fas fa-times"></i></button></div>
	<div v-if="appearNote._featuredId_" class="info"><i class="fas fa-bolt"></i> {{ i18n.ts.featured }}</div>
	<div v-if="isRenote" class="renote">
		<MkAvatar class="avatar" :user="note.user"/>
		<i class="fas fa-retweet"></i>
		<I18n :src="i18n.ts.renotedBy" tag="span">
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
		<MkAvatar class="avatar" :user="appearNote.user"/>
		<div class="main">
			<XNoteHeader class="header" :note="appearNote" :mini="true"/>
			<MkInstanceTicker v-if="showTicker" class="ticker" :instance="appearNote.user.instance"/>
			<div class="body">
				<p v-if="appearNote.cw != null" class="cw">
					<Mfm v-if="appearNote.cw != ''" class="text" :text="appearNote.cw" :author="appearNote.user" :i="$i" :custom-emojis="appearNote.emojis"/>
					<XCwButton v-model="showContent" :note="appearNote"/>
				</p>
				<div v-show="appearNote.cw == null || showContent" class="content" :class="{ collapsed }">
					<div class="text">
						<span v-if="appearNote.isHidden" style="opacity: 0.5">({{ i18n.ts.private }})</span>
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
					<MkUrlPreview v-for="url in urls" :key="url" :url="url" :compact="true" :detail="false" class="url-preview"/>
					<div v-if="appearNote.renote" class="renote"><XNoteSimple :note="appearNote.renote"/></div>
					<button v-if="collapsed" class="fade _button" @click="collapsed = false">
						<span>{{ i18n.ts.showMore }}</span>
					</button>
				</div>
				<MkA v-if="appearNote.channel && !inChannel" class="channel" :to="`/channels/${appearNote.channel.id}`"><i class="fas fa-satellite-dish"></i> {{ appearNote.channel.name }}</MkA>
			</div>
			<footer class="footer">
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
</div>
<div v-else class="muted" @click="muted = false">
	<I18n :src="i18n.ts.userSaysSomething" tag="small">
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
import XNoteHeader from './note-header.vue';
import XNoteSimple from './note-simple.vue';
import XReactionsViewer from './reactions-viewer.vue';
import XMediaList from './media-list.vue';
import XCwButton from './cw-button.vue';
import XPoll from './poll.vue';
import XRenoteButton from './renote-button.vue';
import MkUrlPreview from '@/components/url-preview.vue';
import MkInstanceTicker from '@/components/instance-ticker.vue';
import { pleaseLogin } from '@/scripts/please-login';
import { focusPrev, focusNext } from '@/scripts/focus';
import { checkWordMute } from '@/scripts/check-word-mute';
import { userPage } from '@/filters/user';
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
const collapsed = ref(appearNote.cw == null && appearNote.text != null && (
	(appearNote.text.split('\n').length > 9) ||
	(appearNote.text.length > 500)
));
const isDeleted = ref(false);
const muted = ref(checkWordMute(appearNote, $i, defaultStore.state.mutedWords));
const translation = ref(null);
const translating = ref(false);
const urls = appearNote.text ? extractUrlFromMfm(mfm.parse(appearNote.text)) : null;
const showTicker = (defaultStore.state.instanceTicker === 'always') || (defaultStore.state.instanceTicker === 'remote' && appearNote.user.instance);

const keymap = {
	'r': () => reply(true),
	'e|a|plus': () => react(true),
	'q': () => renoteButton.value.renote(true),
	'up|k|shift+tab': focusBefore,
	'down|j|tab': focusAfter,
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

function focusBefore() {
	focusPrev(el.value);
}

function focusAfter() {
	focusNext(el.value);
}

function readPromo() {
	os.api('promo/read', {
		noteId: appearNote.id,
	});
	isDeleted.value = true;
}
</script>

<style lang="scss" scoped>
.tkcbzcuz {
	position: relative;
	transition: box-shadow 0.1s ease;
	font-size: 1.05em;
	overflow: clip;
	contain: content;

	// これらの指定はパフォーマンス向上には有効だが、ノートの高さは一定でないため、
	// 下の方までスクロールすると上のノートの高さがここで決め打ちされたものに変化し、表示しているノートの位置が変わってしまう
	// ノートがマウントされたときに自身の高さを取得し contain-intrinsic-size を設定しなおせばほぼ解決できそうだが、
	// 今度はその処理自体がパフォーマンス低下の原因にならないか懸念される。また、被リアクションでも高さは変化するため、やはり多少のズレは生じる
	// 一度レンダリングされた要素はブラウザがよしなにサイズを覚えておいてくれるような実装になるまで待った方が良さそう(なるのか？)
	//content-visibility: auto;
  //contain-intrinsic-size: 0 128px;

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

	> .info {
		display: flex;
		align-items: center;
		padding: 16px 32px 8px 32px;
		line-height: 24px;
		font-size: 90%;
		white-space: pre;
		color: #d28a3f;

		> i {
			margin-right: 4px;
		}

		> .hide {
			margin-left: auto;
			color: inherit;
		}
	}

	> .info + .article {
		padding-top: 8px;
	}

	> .reply-to {
		opacity: 0.7;
		padding-bottom: 0;
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
		display: flex;
		padding: 28px 32px 18px;

		> .avatar {
			flex-shrink: 0;
			display: block;
			margin: 0 14px 8px 0;
			width: 58px;
			height: 58px;
			position: sticky;
			top: calc(22px + var(--stickyTop, 0px));
			left: 0;
		}

		> .main {
			flex: 1;
			min-width: 0;

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
					&.collapsed {
						position: relative;
						max-height: 9em;
						overflow: hidden;

						> .fade {
							display: block;
							position: absolute;
							bottom: 0;
							left: 0;
							width: 100%;
							height: 64px;
							background: linear-gradient(0deg, var(--panel), var(--X15));

							> span {
								display: inline-block;
								background: var(--panel);
								padding: 6px 10px;
								font-size: 0.8em;
								border-radius: 999px;
								box-shadow: 0 2px 6px rgb(0 0 0 / 20%);
							}

							&:hover {
								> span {
									background: var(--panelHighlight);
								}
							}
						}
					}

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

		> .info {
			padding: 8px 16px 0 16px;
		}

		> .article {
			padding: 14px 16px 9px;

			> .avatar {
				margin: 0 10px 8px 0;
				width: 50px;
				height: 50px;
				top: calc(14px + var(--stickyTop, 0px));
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
			> .avatar {
				width: 44px;
				height: 44px;
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
