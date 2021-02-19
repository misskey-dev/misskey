<template>
<div
	class="vfzoeqcg"
	v-if="!muted"
	v-show="!isDeleted"
	:tabindex="!isDeleted ? '-1' : null"
	:class="{ renote: isRenote, highlighted: appearNote._prId_ || appearNote._featuredId_, operating }"
	v-hotkey="keymap"
>
	<XSub :note="appearNote.reply" class="reply-to" v-if="appearNote.reply"/>
	<div class="info" v-if="pinned"><Fa :icon="faThumbtack"/> {{ $ts.pinnedNote }}</div>
	<div class="info" v-if="appearNote._prId_"><Fa :icon="faBullhorn"/> {{ $ts.promotion }}<button class="_textButton hide" @click="readPromo()">{{ $ts.hideThisNote }} <Fa :icon="faTimes"/></button></div>
	<div class="info" v-if="appearNote._featuredId_"><Fa :icon="faBolt"/> {{ $ts.featured }}</div>
	<div class="renote" v-if="isRenote">
		<MkAvatar class="avatar" :user="note.user"/>
		<Fa :icon="faRetweet"/>
		<I18n :src="$ts.renotedBy" tag="span">
			<template #user>
				<MkA class="name" :to="userPage(note.user)" v-user-preview="note.userId">
					<MkUserName :user="note.user"/>
				</MkA>
			</template>
		</I18n>
		<div class="info">
			<button class="_button time" @click="showRenoteMenu()" ref="renoteTime">
				<Fa class="dropdownIcon" v-if="isMyRenote" :icon="faEllipsisH"/>
				<MkTime :time="note.createdAt"/>
			</button>
			<span class="visibility" v-if="note.visibility !== 'public'">
				<Fa v-if="note.visibility === 'home'" :icon="faHome"/>
				<Fa v-if="note.visibility === 'followers'" :icon="faUnlock"/>
				<Fa v-if="note.visibility === 'specified'" :icon="faEnvelope"/>
			</span>
			<span class="localOnly" v-if="note.localOnly"><Fa :icon="faBiohazard"/></span>
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
					<XCwButton v-model:value="showContent" :note="appearNote"/>
				</p>
				<div class="content" :class="{ collapsed }" v-show="appearNote.cw == null || showContent">
					<div class="text">
						<span v-if="appearNote.isHidden" style="opacity: 0.5">({{ $ts.private }})</span>
						<MkA class="reply" v-if="appearNote.replyId" :to="`/notes/${appearNote.replyId}`"><Fa :icon="faReply"/></MkA>
						<Mfm v-if="appearNote.text" :text="appearNote.text" :author="appearNote.user" :i="$i" :custom-emojis="appearNote.emojis"/>
						<a class="rp" v-if="appearNote.renote != null">RN:</a>
					</div>
					<div class="files" v-if="appearNote.files.length > 0">
						<XMediaList :media-list="appearNote.files"/>
					</div>
					<XPoll v-if="appearNote.poll" :note="appearNote" ref="pollViewer" class="poll"/>
					<MkUrlPreview v-for="url in urls" :url="url" :key="url" :compact="true" :detail="false" class="url-preview"/>
					<div class="renote" v-if="appearNote.renote"><XNotePreview :note="appearNote.renote"/></div>
					<button v-if="collapsed" class="fade _button" @click="collapsed = false">
						<span>{{ $ts.showMore }}</span>
					</button>
				</div>
				<MkA v-if="appearNote.channel && !inChannel" class="channel" :to="`/channels/${appearNote.channel.id}`"><Fa :icon="faSatelliteDish"/> {{ appearNote.channel.name }}</MkA>
			</div>
			<XReactionsViewer :note="appearNote" ref="reactionsViewer"/>
			<footer class="footer _panel">
				<button @click="reply()" class="button _button" v-tooltip="$ts.reply">
					<template v-if="appearNote.reply"><Fa :icon="faReplyAll"/></template>
					<template v-else><Fa :icon="faReply"/></template>
					<p class="count" v-if="appearNote.repliesCount > 0">{{ appearNote.repliesCount }}</p>
				</button>
				<button v-if="canRenote" @click="renote()" class="button _button" ref="renoteButton" v-tooltip="$ts.renote">
					<Fa :icon="faRetweet"/><p class="count" v-if="appearNote.renoteCount > 0">{{ appearNote.renoteCount }}</p>
				</button>
				<button v-else class="button _button">
					<Fa :icon="faBan"/>
				</button>
				<button v-if="appearNote.myReaction == null" class="button _button" @click="react()" ref="reactButton" v-tooltip="$ts.reaction">
					<Fa :icon="faPlus"/>
				</button>
				<button v-if="appearNote.myReaction != null" class="button _button reacted" @click="undoReact(appearNote)" ref="reactButton" v-tooltip="$ts.reaction">
					<Fa :icon="faMinus"/>
				</button>
				<button class="button _button" @click="menu()" ref="menuButton">
					<Fa :icon="faEllipsisH"/>
				</button>
			</footer>
		</div>
	</article>
</div>
<div v-else class="muted" @click="muted = false">
	<I18n :src="$ts.userSaysSomething" tag="small">
		<template #name>
			<MkA class="name" :to="userPage(appearNote.user)" v-user-preview="appearNote.userId">
				<MkUserName :user="appearNote.user"/>
			</MkA>
		</template>
	</I18n>
</div>
</template>

<script lang="ts">
import { computed, defineAsyncComponent, defineComponent, markRaw, ref } from 'vue';
import { faSatelliteDish, faBolt, faTimes, faBullhorn, faStar, faLink, faExternalLinkSquareAlt, faPlus, faMinus, faRetweet, faReply, faReplyAll, faEllipsisH, faHome, faUnlock, faEnvelope, faThumbtack, faBan, faQuoteRight, faInfoCircle, faBiohazard, faPlug, faExclamationCircle, faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { faCopy, faTrashAlt, faEdit, faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';
import { parse } from '../../../mfm/parse';
import { sum, unique } from '../../../prelude/array';
import XSub from './note.sub.vue';
import XNoteHeader from './note-header.vue';
import XNotePreview from './note-preview.vue';
import XReactionsViewer from '@/components/reactions-viewer.vue';
import XMediaList from '@/components/media-list.vue';
import XCwButton from '@/components/cw-button.vue';
import XPoll from '@/components/poll.vue';
import { pleaseLogin } from '@/scripts/please-login';
import { focusPrev, focusNext } from '@/scripts/focus';
import { url } from '@/config';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import { checkWordMute } from '@/scripts/check-word-mute';
import { userPage } from '@/filters/user';
import * as os from '@/os';
import { noteActions, noteViewInterruptors } from '@/store';

function markRawAll(...xs) {
	for (const x of xs) {
		markRaw(x);
	}
}

markRawAll(faEdit, faBolt, faTimes, faBullhorn, faPlus, faMinus, faRetweet, faReply, faReplyAll, faEllipsisH, faHome, faUnlock, faEnvelope, faThumbtack, faBan, faBiohazard, faPlug, faSatelliteDish);

export default defineComponent({
	components: {
		XSub,
		XNoteHeader,
		XNotePreview,
		XReactionsViewer,
		XMediaList,
		XCwButton,
		XPoll,
		MkUrlPreview: defineAsyncComponent(() => import('@/components/url-preview.vue')),
		MkInstanceTicker: defineAsyncComponent(() => import('@/components/instance-ticker.vue')),
	},

	inject: {
		inChannel: {
			default: null
		},
	},

	props: {
		note: {
			type: Object,
			required: true
		},
		pinned: {
			type: Boolean,
			required: false,
			default: false
		},
	},

	emits: ['update:note'],

	data() {
		return {
			connection: null,
			replies: [],
			showContent: false,
			collapsed: false,
			isDeleted: false,
			muted: false,
			operating: false,
			faEdit, faBolt, faTimes, faBullhorn, faPlus, faMinus, faRetweet, faReply, faReplyAll, faEllipsisH, faHome, faUnlock, faEnvelope, faThumbtack, faBan, faBiohazard, faPlug, faSatelliteDish
		};
	},

	computed: {
		rs() {
			return this.$store.state.reactions;
		},
		keymap(): any {
			return {
				'r': () => this.reply(true),
				'e|a|plus': () => this.react(true),
				'q': () => this.renote(true),
				'f|b': this.favorite,
				'delete|ctrl+d': this.del,
				'ctrl+q': this.renoteDirectly,
				'up|k|shift+tab': this.focusBefore,
				'down|j|tab': this.focusAfter,
				'esc': this.blur,
				'm|o': () => this.menu(true),
				's': this.toggleShowContent,
				'1': () => this.reactDirectly(this.rs[0]),
				'2': () => this.reactDirectly(this.rs[1]),
				'3': () => this.reactDirectly(this.rs[2]),
				'4': () => this.reactDirectly(this.rs[3]),
				'5': () => this.reactDirectly(this.rs[4]),
				'6': () => this.reactDirectly(this.rs[5]),
				'7': () => this.reactDirectly(this.rs[6]),
				'8': () => this.reactDirectly(this.rs[7]),
				'9': () => this.reactDirectly(this.rs[8]),
				'0': () => this.reactDirectly(this.rs[9]),
			};
		},

		isRenote(): boolean {
			return (this.note.renote &&
				this.note.text == null &&
				this.note.fileIds.length == 0 &&
				this.note.poll == null);
		},

		appearNote(): any {
			return this.isRenote ? this.note.renote : this.note;
		},

		isMyNote(): boolean {
			return this.$i && (this.$i.id === this.appearNote.userId);
		},

		isMyRenote(): boolean {
			return this.$i && (this.$i.id === this.note.userId);
		},

		canRenote(): boolean {
			return ['public', 'home'].includes(this.appearNote.visibility) || this.isMyNote;
		},

		reactionsCount(): number {
			return this.appearNote.reactions
				? sum(Object.values(this.appearNote.reactions))
				: 0;
		},

		urls(): string[] {
			if (this.appearNote.text) {
				const ast = parse(this.appearNote.text);
				// TODO: 再帰的にURL要素がないか調べる
				const urls = unique(ast
					.filter(t => ((t.node.type == 'url' || t.node.type == 'link') && t.node.props.url && !t.node.props.silent))
					.map(t => t.node.props.url));

				// unique without hash
				// [ http://a/#1, http://a/#2, http://b/#3 ] => [ http://a/#1, http://b/#3 ]
				const removeHash = x => x.replace(/#[^#]*$/, '');

				return urls.reduce((array, url) => {
					const removed = removeHash(url);
					if (!array.map(x => removeHash(x)).includes(removed)) array.push(url);
					return array;
				}, []);
			} else {
				return null;
			}
		},

		showTicker() {
			if (this.$store.state.instanceTicker === 'always') return true;
			if (this.$store.state.instanceTicker === 'remote' && this.appearNote.user.instance) return true;
			return false;
		}
	},

	async created() {
		if (this.$i) {
			this.connection = os.stream;
		}

		this.collapsed = this.appearNote.cw == null && this.appearNote.text && (
			(this.appearNote.text.split('\n').length > 9) ||
			(this.appearNote.text.length > 500)
		);
		this.muted = await checkWordMute(this.appearNote, this.$i, this.$store.state.mutedWords);

		// plugin
		if (noteViewInterruptors.length > 0) {
			let result = this.note;
			for (const interruptor of noteViewInterruptors) {
				result = await interruptor.handler(JSON.parse(JSON.stringify(result)));
			}
			this.$emit('update:note', Object.freeze(result));
		}
	},

	mounted() {
		this.capture(true);

		if (this.$i) {
			this.connection.on('_connected_', this.onStreamConnected);
		}
	},

	beforeUnmount() {
		this.decapture(true);

		if (this.$i) {
			this.connection.off('_connected_', this.onStreamConnected);
		}
	},

	methods: {
		updateAppearNote(v) {
			this.$emit('update:note', Object.freeze(this.isRenote ? {
				...this.note,
				renote: {
					...this.note.renote,
					...v
				}
			} : {
				...this.note,
				...v
			}));
		},

		readPromo() {
			os.api('promo/read', {
				noteId: this.appearNote.id
			});
			this.isDeleted = true;
		},

		capture(withHandler = false) {
			if (this.$i) {
				this.connection.send(document.body.contains(this.$el) ? 'sn' : 's', { id: this.appearNote.id });
				if (withHandler) this.connection.on('noteUpdated', this.onStreamNoteUpdated);
			}
		},

		decapture(withHandler = false) {
			if (this.$i) {
				this.connection.send('un', {
					id: this.appearNote.id
				});
				if (withHandler) this.connection.off('noteUpdated', this.onStreamNoteUpdated);
			}
		},

		onStreamConnected() {
			this.capture();
		},

		onStreamNoteUpdated(data) {
			const { type, id, body } = data;

			if (id !== this.appearNote.id) return;

			switch (type) {
				case 'reacted': {
					const reaction = body.reaction;

					// DeepではなくShallowコピーであることに注意。n.reactions[reaction] = hogeとかしないように(親からもらったデータをミューテートすることになるので)
					let n = {
						...this.appearNote,
					};

					if (body.emoji) {
						const emojis = this.appearNote.emojis || [];
						if (!emojis.includes(body.emoji)) {
							n.emojis = [...emojis, body.emoji];
						}
					}

					// TODO: reactionsプロパティがない場合ってあったっけ？ なければ || {} は消せる
					const currentCount = (this.appearNote.reactions || {})[reaction] || 0;

					// Increment the count
					n.reactions = {
						...this.appearNote.reactions,
						[reaction]: currentCount + 1
					};

					if (body.userId === this.$i.id) {
						n.myReaction = reaction;
					}

					this.updateAppearNote(n);
					break;
				}

				case 'unreacted': {
					const reaction = body.reaction;

					// DeepではなくShallowコピーであることに注意。n.reactions[reaction] = hogeとかしないように(親からもらったデータをミューテートすることになるので)
					let n = {
						...this.appearNote,
					};

					// TODO: reactionsプロパティがない場合ってあったっけ？ なければ || {} は消せる
					const currentCount = (this.appearNote.reactions || {})[reaction] || 0;

					// Decrement the count
					n.reactions = {
						...this.appearNote.reactions,
						[reaction]: Math.max(0, currentCount - 1)
					};

					if (body.userId === this.$i.id) {
						n.myReaction = null;
					}

					this.updateAppearNote(n);
					break;
				}

				case 'pollVoted': {
					const choice = body.choice;

					// DeepではなくShallowコピーであることに注意。n.reactions[reaction] = hogeとかしないように(親からもらったデータをミューテートすることになるので)
					let n = {
						...this.appearNote,
					};

					const choices = [...this.appearNote.poll.choices];
					choices[choice] = {
						...choices[choice],
						votes: choices[choice].votes + 1,
						...(body.userId === this.$i.id ? {
							isVoted: true
						} : {})
					};

					n.poll = {
						...this.appearNote.poll,
						choices: choices
					};

					this.updateAppearNote(n);
					break;
				}

				case 'deleted': {
					this.isDeleted = true;
					break;
				}
			}
		},

		reply(viaKeyboard = false) {
			pleaseLogin();
			this.operating = true;
			os.post({
				reply: this.appearNote,
				animation: !viaKeyboard,
			}, () => {
				this.operating = false;
				this.focus();
			});
		},

		renote(viaKeyboard = false) {
			pleaseLogin();
			this.operating = true;
			this.blur();
			os.modalMenu([{
				text: this.$ts.renote,
				icon: faRetweet,
				action: () => {
					os.api('notes/create', {
						renoteId: this.appearNote.id
					});
				}
			}, {
				text: this.$ts.quote,
				icon: faQuoteRight,
				action: () => {
					os.post({
						renote: this.appearNote,
					});
				}
			}], this.$refs.renoteButton, {
				viaKeyboard
			}).then(() => {
				this.operating = false;
			});
		},

		renoteDirectly() {
			os.apiWithDialog('notes/create', {
				renoteId: this.appearNote.id
			}, undefined, (res: any) => {
				os.dialog({
					type: 'success',
					text: this.$ts.renoted,
				});
			}, (e: Error) => {
				if (e.id === 'b5c90186-4ab0-49c8-9bba-a1f76c282ba4') {
					os.dialog({
						type: 'error',
						text: this.$ts.cantRenote,
					});
				} else if (e.id === 'fd4cc33e-2a37-48dd-99cc-9b806eb2031a') {
					os.dialog({
						type: 'error',
						text: this.$ts.cantReRenote,
					});
				}
			});
		},

		async react(viaKeyboard = false) {
			pleaseLogin();
			this.operating = true;
			this.blur();
			const { dispose } = await os.popup(import('@/components/emoji-picker.vue'), {
				src: this.$refs.reactButton,
				asReactionPicker: true
			}, {
				done: reaction => {
					if (reaction) {
						os.api('notes/reactions/create', {
							noteId: this.appearNote.id,
							reaction: reaction
						});
					}
				},
				closed: () => {
					this.operating = false;
					this.focus();
					dispose();
				}
			});
		},

		reactDirectly(reaction) {
			os.api('notes/reactions/create', {
				noteId: this.appearNote.id,
				reaction: reaction
			});
		},

		undoReact(note) {
			const oldReaction = note.myReaction;
			if (!oldReaction) return;
			os.api('notes/reactions/delete', {
				noteId: note.id
			});
		},

		favorite() {
			pleaseLogin();
			os.apiWithDialog('notes/favorites/create', {
				noteId: this.appearNote.id
			}, undefined, (res: any) => {
				os.dialog({
					type: 'success',
					text: this.$ts.favorited,
				});
			}, (e: Error) => {
				if (e.id === 'a402c12b-34dd-41d2-97d8-4d2ffd96a1a6') {
					os.dialog({
						type: 'error',
						text: this.$ts.alreadyFavorited,
					});
				} else if (e.id === '6dd26674-e060-4816-909a-45ba3f4da458') {
					os.dialog({
						type: 'error',
						text: this.$ts.cantFavorite,
					});
				}
			});
		},

		del() {
			os.dialog({
				type: 'warning',
				text: this.$ts.noteDeleteConfirm,
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;

				os.api('notes/delete', {
					noteId: this.appearNote.id
				});
			});
		},

		delEdit() {
			os.dialog({
				type: 'warning',
				text: this.$ts.deleteAndEditConfirm,
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;

				os.api('notes/delete', {
					noteId: this.appearNote.id
				});

				os.post({ initialNote: this.appearNote, renote: this.appearNote.renote, reply: this.appearNote.reply, channel: this.appearNote.channel });
			});
		},

		toggleFavorite(favorite: boolean) {
			os.apiWithDialog(favorite ? 'notes/favorites/create' : 'notes/favorites/delete', {
				noteId: this.appearNote.id
			});
		},

		toggleWatch(watch: boolean) {
			os.apiWithDialog(watch ? 'notes/watching/create' : 'notes/watching/delete', {
				noteId: this.appearNote.id
			});
		},

		getMenu() {
			let menu;
			if (this.$i) {
				const statePromise = os.api('notes/state', {
					noteId: this.appearNote.id
				});

				menu = [{
					icon: faCopy,
					text: this.$ts.copyContent,
					action: this.copyContent
				}, {
					icon: faLink,
					text: this.$ts.copyLink,
					action: this.copyLink
				}, (this.appearNote.url || this.appearNote.uri) ? {
					icon: faExternalLinkSquareAlt,
					text: this.$ts.showOnRemote,
					action: () => {
						window.open(this.appearNote.url || this.appearNote.uri, '_blank');
					}
				} : undefined,
				null,
				statePromise.then(state => state.isFavorited ? {
					icon: faStar,
					text: this.$ts.unfavorite,
					action: () => this.toggleFavorite(false)
				} : {
					icon: faStar,
					text: this.$ts.favorite,
					action: () => this.toggleFavorite(true)
				}),
				{
					icon: faPaperclip,
					text: this.$ts.clip,
					action: () => this.clip()
				},
				(this.appearNote.userId != this.$i.id) ? statePromise.then(state => state.isWatching ? {
					icon: faEyeSlash,
					text: this.$ts.unwatch,
					action: () => this.toggleWatch(false)
				} : {
					icon: faEye,
					text: this.$ts.watch,
					action: () => this.toggleWatch(true)
				}) : undefined,
				this.appearNote.userId == this.$i.id ? (this.$i.pinnedNoteIds || []).includes(this.appearNote.id) ? {
					icon: faThumbtack,
					text: this.$ts.unpin,
					action: () => this.togglePin(false)
				} : {
					icon: faThumbtack,
					text: this.$ts.pin,
					action: () => this.togglePin(true)
				} : undefined,
				...(this.$i.isModerator || this.$i.isAdmin ? [
					null,
					{
						icon: faBullhorn,
						text: this.$ts.promote,
						action: this.promote
					}]
					: []
				),
				...(this.appearNote.userId != this.$i.id ? [
					null,
					{
						icon: faExclamationCircle,
						text: this.$ts.reportAbuse,
						action: () => {
							const u = `${url}/notes/${this.appearNote.id}`;
							os.popup(import('@/components/abuse-report-window.vue'), {
								user: this.appearNote.user,
								initialComment: `Note: ${u}\n-----\n`
							}, {}, 'closed');
						}
					}]
					: []
				),
				...(this.appearNote.userId == this.$i.id || this.$i.isModerator || this.$i.isAdmin ? [
					null,
					this.appearNote.userId == this.$i.id ? {
						icon: faEdit,
						text: this.$ts.deleteAndEdit,
						action: this.delEdit
					} : undefined,
					{
						icon: faTrashAlt,
						text: this.$ts.delete,
						danger: true,
						action: this.del
					}]
					: []
				)]
				.filter(x => x !== undefined);
			} else {
				menu = [{
					icon: faCopy,
					text: this.$ts.copyContent,
					action: this.copyContent
				}, {
					icon: faLink,
					text: this.$ts.copyLink,
					action: this.copyLink
				}, (this.appearNote.url || this.appearNote.uri) ? {
					icon: faExternalLinkSquareAlt,
					text: this.$ts.showOnRemote,
					action: () => {
						window.open(this.appearNote.url || this.appearNote.uri, '_blank');
					}
				} : undefined]
				.filter(x => x !== undefined);
			}

			if (noteActions.length > 0) {
				menu = menu.concat([null, ...noteActions.map(action => ({
					icon: faPlug,
					text: action.title,
					action: () => {
						action.handler(this.appearNote);
					}
				}))]);
			}

			return menu;
		},

		onContextmenu(e) {
			const isLink = (el: HTMLElement) => {
				if (el.tagName === 'A') return true;
				if (el.parentElement) {
					return isLink(el.parentElement);
				}
			};
			if (isLink(e.target)) return;
			if (window.getSelection().toString() !== '') return;
			os.contextMenu(this.getMenu(), e).then(this.focus);
		},

		menu(viaKeyboard = false) {
			this.operating = true;
			os.modalMenu(this.getMenu(), this.$refs.menuButton, {
				viaKeyboard
			}).then(() => {
				this.operating = false;
				this.focus();
			});
		},

		showRenoteMenu(viaKeyboard = false) {
			if (!this.isMyRenote) return;
			os.modalMenu([{
				text: this.$ts.unrenote,
				icon: faTrashAlt,
				danger: true,
				action: () => {
					os.api('notes/delete', {
						noteId: this.note.id
					});
					this.isDeleted = true;
				}
			}], this.$refs.renoteTime, {
				viaKeyboard: viaKeyboard
			});
		},

		toggleShowContent() {
			this.showContent = !this.showContent;
		},

		copyContent() {
			copyToClipboard(this.appearNote.text);
			os.success();
		},

		copyLink() {
			copyToClipboard(`${url}/notes/${this.appearNote.id}`);
			os.success();
		},

		togglePin(pin: boolean) {
			os.apiWithDialog(pin ? 'i/pin' : 'i/unpin', {
				noteId: this.appearNote.id
			}, undefined, null, e => {
				if (e.id === '72dab508-c64d-498f-8740-a8eec1ba385a') {
					os.dialog({
						type: 'error',
						text: this.$ts.pinLimitExceeded
					});
				}
			});
		},

		async clip() {
			const clips = await os.api('clips/list');
			os.modalMenu([{
				icon: faPlus,
				text: this.$ts.createNew,
				action: async () => {
					const { canceled, result } = await os.form(this.$ts.createNewClip, {
						name: {
							type: 'string',
							label: this.$ts.name
						},
						description: {
							type: 'string',
							required: false,
							multiline: true,
							label: this.$ts.description
						},
						isPublic: {
							type: 'boolean',
							label: this.$ts.public,
							default: false
						}
					});
					if (canceled) return;

					const clip = await os.apiWithDialog('clips/create', result);

					os.apiWithDialog('clips/add-note', { clipId: clip.id, noteId: this.appearNote.id });
				}
			}, null, ...clips.map(clip => ({
				text: clip.name,
				action: () => {
					os.apiWithDialog('clips/add-note', { clipId: clip.id, noteId: this.appearNote.id });
				}
			}))], this.$refs.menuButton, {
			}).then(this.focus);
		},

		async promote() {
			const { canceled, result: days } = await os.dialog({
				title: this.$ts.numberOfDays,
				input: { type: 'number' }
			});

			if (canceled) return;

			os.apiWithDialog('admin/promo/create', {
				noteId: this.appearNote.id,
				expiresAt: Date.now() + (86400000 * days)
			});
		},

		focus() {
			this.$el.focus();
		},

		blur() {
			this.$el.blur();
		},

		focusBefore() {
			focusPrev(this.$el);
		},

		focusAfter() {
			focusNext(this.$el);
		},

		userPage
	}
});
</script>

<style lang="scss" scoped>
.vfzoeqcg {
	position: relative;
	contain: content;

	// これらの指定はパフォーマンス向上には有効だが、ノートの高さは一定でないため、
	// 下の方までスクロールすると上のノートの高さがここで決め打ちされたものに変化し、表示しているノートの位置が変わってしまう
	// ノートがマウントされたときに自身の高さを取得し contain-intrinsic-size を設定しなおせばほぼ解決できそうだが、
	// 今度はその処理自体がパフォーマンス低下の原因にならないか懸念される。また、被リアクションでも高さは変化するため、やはり多少のズレは生じる
	// 一度レンダリングされた要素はブラウザがよしなにサイズを覚えておいてくれるような実装になるまで待った方が良さそう(なるのか？)
	//content-visibility: auto;
  //contain-intrinsic-size: 0 128px;

	&:focus {
		outline: none;
	}

	&:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	&:hover, &.operating {
		> .article > .main > .footer {
			display: block;
		}
	}

	&.renote {
		background: rgba(128, 255, 0, 0.05);
	}

	&.highlighted {
		background: rgba(255, 128, 0, 0.05);
	}

	> .info {
		display: flex;
		align-items: center;
		padding: 12px 16px 4px 16px;
		line-height: 24px;
		font-size: 85%;
		white-space: pre;
		color: #d28a3f;

		> [data-icon] {
			margin-right: 4px;
		}

		> .hide {
			margin-left: 16px;
			color: inherit;
			opacity: 0.7;
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
		padding: 12px 16px 4px 16px;
		line-height: 28px;
		white-space: pre;
		color: var(--renote);
		font-size: 0.9em;

		> .avatar {
			flex-shrink: 0;
			display: inline-block;
			width: 28px;
			height: 28px;
			margin: 0 8px 0 0;
			border-radius: 6px;
		}

		> [data-icon] {
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
			margin-left: 8px;
			font-size: 0.9em;
			opacity: 0.7;

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
		padding: 12px 16px;

		> .avatar {
			flex-shrink: 0;
			display: block;
			position: sticky;
			top: 12px;
			margin: 0 14px 0 0;
			width: 46px;
			height: 46px;
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
					}

					> .files {
						max-width: 500px;
					}

					> .url-preview {
						margin-top: 8px;
						max-width: 500px;
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
				display: none;
				position: absolute;
				top: 8px;
				right: 8px;
				padding: 0 6px;
				opacity: 0.7;

				&:hover {
					opacity: 1;
				}

				> .button {
					margin: 0;
					padding: 8px;
					opacity: 0.7;

					&:hover {
						color: var(--accent);
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
		border-top: solid 1px var(--divider);
	}
}

.muted {
	padding: 8px 16px;
	opacity: 0.7;

	&:hover {
		background: rgba(0, 0, 0, 0.05);
	}
}
</style>
