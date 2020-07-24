<template>
<div
	class="note _panel"
	v-show="!isDeleted && !hideThisNote"
	:tabindex="!isDeleted ? '-1' : null"
	:class="{ renote: isRenote }"
	v-hotkey="keymap"
	v-size="[{ max: 500 }, { max: 450 }, { max: 350 }, { max: 300 }]"
>
	<x-sub v-for="note in conversation" class="reply-to-more" :key="note.id" :note="note"/>
	<x-sub :note="appearNote.reply" class="reply-to" v-if="appearNote.reply"/>
	<div class="info" v-if="pinned"><fa :icon="faThumbtack"/> {{ $t('pinnedNote') }}</div>
	<div class="info" v-if="appearNote._prId_"><fa :icon="faBullhorn"/> {{ $t('promotion') }}<button class="_textButton hide" @click="readPromo()">{{ $t('hideThisNote') }} <fa :icon="faTimes"/></button></div>
	<div class="info" v-if="appearNote._featuredId_"><fa :icon="faBolt"/> {{ $t('featured') }}</div>
	<div class="renote" v-if="isRenote">
		<mk-avatar class="avatar" :user="note.user"/>
		<fa :icon="faRetweet"/>
		<i18n path="renotedBy" tag="span">
			<router-link class="name" :to="userPage(note.user)" v-user-preview="note.userId" place="user">
				<mk-user-name :user="note.user"/>
			</router-link>
		</i18n>
		<div class="info">
			<button class="_button time" @click="showRenoteMenu()" ref="renoteTime">
				<fa class="dropdownIcon" v-if="isMyRenote" :icon="faEllipsisH"/>
				<mk-time :time="note.createdAt"/>
			</button>
			<span class="visibility" v-if="note.visibility !== 'public'">
				<fa v-if="note.visibility === 'home'" :icon="faHome"/>
				<fa v-if="note.visibility === 'followers'" :icon="faUnlock"/>
				<fa v-if="note.visibility === 'specified'" :icon="faEnvelope"/>
			</span>
			<span class="localOnly" v-if="note.localOnly"><fa :icon="faBiohazard"/></span>
		</div>
	</div>
	<article class="article">
		<mk-avatar class="avatar" :user="appearNote.user"/>
		<div class="main">
			<x-note-header class="header" :note="appearNote" :mini="true"/>
			<div class="body" v-if="appearNote.deletedAt == null" ref="noteBody">
				<p v-if="appearNote.cw != null" class="cw">
				<mfm v-if="appearNote.cw != ''" class="text" :text="appearNote.cw" :author="appearNote.user" :i="$store.state.i" :custom-emojis="appearNote.emojis" />
					<x-cw-button v-model="showContent" :note="appearNote"/>
				</p>
				<div class="content" v-show="appearNote.cw == null || showContent">
					<div class="text">
						<span v-if="appearNote.isHidden" style="opacity: 0.5">({{ $t('private') }})</span>
						<router-link class="reply" v-if="appearNote.replyId" :to="`/notes/${appearNote.replyId}`"><fa :icon="faReply"/></router-link>
						<mfm v-if="appearNote.text" :text="appearNote.text" :author="appearNote.user" :i="$store.state.i" :custom-emojis="appearNote.emojis"/>
						<a class="rp" v-if="appearNote.renote != null">RN:</a>
					</div>
					<div class="files" v-if="appearNote.files.length > 0">
						<x-media-list :media-list="appearNote.files" :parent-element="noteBody"/>
					</div>
					<x-poll v-if="appearNote.poll" :note="appearNote" ref="pollViewer" class="poll"/>
					<mk-url-preview v-for="url in urls" :url="url" :key="url" :compact="true" :detail="detail" class="url-preview"/>
					<div class="renote" v-if="appearNote.renote"><x-note-preview :note="appearNote.renote"/></div>
				</div>
			</div>
			<footer v-if="appearNote.deletedAt == null" class="footer">
				<x-reactions-viewer :note="appearNote" ref="reactionsViewer"/>
				<button @click="reply()" class="button _button">
					<template v-if="appearNote.reply"><fa :icon="faReplyAll"/></template>
					<template v-else><fa :icon="faReply"/></template>
					<p class="count" v-if="appearNote.repliesCount > 0">{{ appearNote.repliesCount }}</p>
				</button>
				<button v-if="canRenote" @click="renote()" class="button _button" ref="renoteButton">
					<fa :icon="faRetweet"/><p class="count" v-if="appearNote.renoteCount > 0">{{ appearNote.renoteCount }}</p>
				</button>
				<button v-else class="button _button">
					<fa :icon="faBan"/>
				</button>
				<button v-if="!isMyNote && appearNote.myReaction == null" class="button _button" @click="react()" ref="reactButton">
					<fa :icon="faPlus"/>
				</button>
				<button v-if="!isMyNote && appearNote.myReaction != null" class="button _button reacted" @click="undoReact(appearNote)" ref="reactButton">
					<fa :icon="faMinus"/>
				</button>
				<button class="button _button" @click="menu()" ref="menuButton">
					<fa :icon="faEllipsisH"/>
				</button>
			</footer>
			<div class="deleted" v-if="appearNote.deletedAt != null">{{ $t('deleted') }}</div>
		</div>
	</article>
	<x-sub v-for="note in replies" :key="note.id" :note="note" class="reply" :detail="true"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faBolt, faTimes, faBullhorn, faStar, faLink, faExternalLinkSquareAlt, faPlus, faMinus, faRetweet, faReply, faReplyAll, faEllipsisH, faHome, faUnlock, faEnvelope, faThumbtack, faBan, faQuoteRight, faInfoCircle, faBiohazard, faPlug } from '@fortawesome/free-solid-svg-icons';
import { faCopy, faTrashAlt, faEdit, faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';
import { parse } from '../../mfm/parse';
import { sum, unique } from '../../prelude/array';
import XSub from './note.sub.vue';
import XNoteHeader from './note-header.vue';
import XNotePreview from './note-preview.vue';
import XReactionsViewer from './reactions-viewer.vue';
import XMediaList from './media-list.vue';
import XCwButton from './cw-button.vue';
import XPoll from './poll.vue';
import MkUrlPreview from './url-preview.vue';
import MkReactionPicker from './reaction-picker.vue';
import pleaseLogin from '../scripts/please-login';
import { focusPrev, focusNext } from '../scripts/focus';
import { url } from '../config';
import copyToClipboard from '../scripts/copy-to-clipboard';
import { userPage } from '../filters/user';

export default Vue.extend({
	components: {
		XSub,
		XNoteHeader,
		XNotePreview,
		XReactionsViewer,
		XMediaList,
		XCwButton,
		XPoll,
		MkUrlPreview,
	},

	props: {
		note: {
			type: Object,
			required: true
		},
		detail: {
			type: Boolean,
			required: false,
			default: false
		},
		pinned: {
			type: Boolean,
			required: false,
			default: false
		},
	},

	data() {
		return {
			connection: null,
			conversation: [],
			replies: [],
			showContent: false,
			hideThisNote: false,
			noteBody: this.$refs.noteBody,
			faEdit, faBolt, faTimes, faBullhorn, faPlus, faMinus, faRetweet, faReply, faReplyAll, faEllipsisH, faHome, faUnlock, faEnvelope, faThumbtack, faBan, faBiohazard, faPlug
		};
	},

	computed: {
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
				'1': () => this.reactDirectly(this.$store.state.settings.reactions[0]),
				'2': () => this.reactDirectly(this.$store.state.settings.reactions[1]),
				'3': () => this.reactDirectly(this.$store.state.settings.reactions[2]),
				'4': () => this.reactDirectly(this.$store.state.settings.reactions[3]),
				'5': () => this.reactDirectly(this.$store.state.settings.reactions[4]),
				'6': () => this.reactDirectly(this.$store.state.settings.reactions[5]),
				'7': () => this.reactDirectly(this.$store.state.settings.reactions[6]),
				'8': () => this.reactDirectly(this.$store.state.settings.reactions[7]),
				'9': () => this.reactDirectly(this.$store.state.settings.reactions[8]),
				'0': () => this.reactDirectly(this.$store.state.settings.reactions[9]),
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

		isDeleted(): boolean {
			return this.appearNote.deletedAt != null || this.note.deletedAt != null;
		},

		isMyNote(): boolean {
			return this.$store.getters.isSignedIn && (this.$store.state.i.id === this.appearNote.userId);
		},

		isMyRenote(): boolean {
			return this.$store.getters.isSignedIn && (this.$store.state.i.id === this.note.userId);
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
		}
	},

	created() {
		if (this.$store.getters.isSignedIn) {
			this.connection = this.$root.stream;
		}

		if (this.detail) {
			this.$root.api('notes/children', {
				noteId: this.appearNote.id,
				limit: 30
			}).then(replies => {
				this.replies = replies;
			});

			if (this.appearNote.replyId) {
				this.$root.api('notes/conversation', {
					noteId: this.appearNote.replyId
				}).then(conversation => {
					this.conversation = conversation.reverse();
				});
			}
		}
	},

	mounted() {
		this.capture(true);

		if (this.$store.getters.isSignedIn) {
			this.connection.on('_connected_', this.onStreamConnected);
		}

		this.noteBody = this.$refs.noteBody
	},

	beforeDestroy() {
		this.decapture(true);

		if (this.$store.getters.isSignedIn) {
			this.connection.off('_connected_', this.onStreamConnected);
		}
	},

	methods: {
		readPromo() {
			(this as any).$root.api('promo/read', {
				noteId: this.appearNote.id
			});
			this.hideThisNote = true;
		},

		capture(withHandler = false) {
			if (this.$store.getters.isSignedIn) {
				this.connection.send(document.body.contains(this.$el) ? 'sn' : 's', { id: this.appearNote.id });
				if (withHandler) this.connection.on('noteUpdated', this.onStreamNoteUpdated);
			}
		},

		decapture(withHandler = false) {
			if (this.$store.getters.isSignedIn) {
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

					if (body.emoji) {
						const emojis = this.appearNote.emojis || [];
						if (!emojis.includes(body.emoji)) {
							emojis.push(body.emoji);
							Vue.set(this.appearNote, 'emojis', emojis);
						}
					}

					if (this.appearNote.reactions == null) {
						Vue.set(this.appearNote, 'reactions', {});
					}

					if (this.appearNote.reactions[reaction] == null) {
						Vue.set(this.appearNote.reactions, reaction, 0);
					}

					// Increment the count
					this.appearNote.reactions[reaction]++;

					if (body.userId == this.$store.state.i.id) {
						Vue.set(this.appearNote, 'myReaction', reaction);
					}
					break;
				}

				case 'unreacted': {
					const reaction = body.reaction;

					if (this.appearNote.reactions == null) {
						return;
					}

					if (this.appearNote.reactions[reaction] == null) {
						return;
					}

					// Decrement the count
					if (this.appearNote.reactions[reaction] > 0) this.appearNote.reactions[reaction]--;

					if (body.userId == this.$store.state.i.id) {
						Vue.set(this.appearNote, 'myReaction', null);
					}
					break;
				}

				case 'pollVoted': {
					const choice = body.choice;
					this.appearNote.poll.choices[choice].votes++;
					if (body.userId == this.$store.state.i.id) {
						Vue.set(this.appearNote.poll.choices[choice], 'isVoted', true);
					}
					break;
				}

				case 'deleted': {
					Vue.set(this.appearNote, 'deletedAt', body.deletedAt);
					Vue.set(this.appearNote, 'renote', null);
					this.appearNote.text = null;
					this.appearNote.fileIds = [];
					this.appearNote.poll = null;
					this.appearNote.cw = null;
					break;
				}
			}
		},

		reply(viaKeyboard = false) {
			pleaseLogin(this.$root);
			this.$root.post({
				reply: this.appearNote,
				animation: !viaKeyboard,
			}, () => {
				this.focus();
			});
		},

		renote(viaKeyboard = false) {
			pleaseLogin(this.$root);
			this.blur();
			this.$root.menu({
				items: [{
					text: this.$t('renote'),
					icon: faRetweet,
					action: () => {
						(this as any).$root.api('notes/create', {
							renoteId: this.appearNote.id
						});
					}
				}, {
					text: this.$t('quote'),
					icon: faQuoteRight,
					action: () => {
						this.$root.post({
							renote: this.appearNote,
						});
					}
				}]
				source: this.$refs.renoteButton,
				viaKeyboard
			});
		},

		renoteDirectly() {
			(this as any).$root.api('notes/create', {
				renoteId: this.appearNote.id
			});
		},

		react(viaKeyboard = false) {
			pleaseLogin(this.$root);
			this.blur();
			const picker = this.$root.new(MkReactionPicker, {
				source: this.$refs.reactButton,
				showFocus: viaKeyboard,
			});
			picker.$once('chosen', reaction => {
				this.$root.api('notes/reactions/create', {
					noteId: this.appearNote.id,
					reaction: reaction
				}).then(() => {
					picker.close();
				});
			});
			picker.$once('closed', this.focus);
		},

		reactDirectly(reaction) {
			this.$root.api('notes/reactions/create', {
				noteId: this.appearNote.id,
				reaction: reaction
			});
		},

		undoReact(note) {
			const oldReaction = note.myReaction;
			if (!oldReaction) return;
			this.$root.api('notes/reactions/delete', {
				noteId: note.id
			});
		},

		favorite() {
			pleaseLogin(this.$root);
			this.$root.api('notes/favorites/create', {
				noteId: this.appearNote.id
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			});
		},

		del() {
			this.$root.dialog({
				type: 'warning',
				text: this.$t('noteDeleteConfirm'),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;

				this.$root.api('notes/delete', {
					noteId: this.appearNote.id
				});
			});
		},

		delEdit() {
			this.$root.dialog({
				type: 'warning',
				text: this.$t('deleteAndEditConfirm'),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;

				this.$root.api('notes/delete', {
					noteId: this.appearNote.id
				});

				this.$root.post({ initialNote: this.appearNote, renote: this.appearNote.renote, reply: this.appearNote.reply });
			});
		},

		toggleFavorite(favorite: boolean) {
			this.$root.api(favorite ? 'notes/favorites/create' : 'notes/favorites/delete', {
				noteId: this.appearNote.id
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			});
		},

		toggleWatch(watch: boolean) {
			this.$root.api(watch ? 'notes/watching/create' : 'notes/watching/delete', {
				noteId: this.appearNote.id
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			});
		},

		async menu(viaKeyboard = false) {
			let menu;
			if (this.$store.getters.isSignedIn) {
				const state = await this.$root.api('notes/state', {
					noteId: this.appearNote.id
				});
				menu = [{
					type: 'link',
					icon: faInfoCircle,
					text: this.$t('details'),
					to: '/notes/' + this.appearNote.id
				}, null, {
					icon: faCopy,
					text: this.$t('copyContent'),
					action: this.copyContent
				}, {
					icon: faLink,
					text: this.$t('copyLink'),
					action: this.copyLink
				}, (this.appearNote.url || this.appearNote.uri) ? {
					icon: faExternalLinkSquareAlt,
					text: this.$t('showOnRemote'),
					action: () => {
						window.open(this.appearNote.url || this.appearNote.uri, '_blank');
					}
				} : undefined,
				null,
				state.isFavorited ? {
					icon: faStar,
					text: this.$t('unfavorite'),
					action: () => this.toggleFavorite(false)
				} : {
					icon: faStar,
					text: this.$t('favorite'),
					action: () => this.toggleFavorite(true)
				},
				this.appearNote.userId != this.$store.state.i.id ? state.isWatching ? {
					icon: faEyeSlash,
					text: this.$t('unwatch'),
					action: () => this.toggleWatch(false)
				} : {
					icon: faEye,
					text: this.$t('watch'),
					action: () => this.toggleWatch(true)
				} : undefined,
				this.appearNote.userId == this.$store.state.i.id ? (this.$store.state.i.pinnedNoteIds || []).includes(this.appearNote.id) ? {
					icon: faThumbtack,
					text: this.$t('unpin'),
					action: () => this.togglePin(false)
				} : {
					icon: faThumbtack,
					text: this.$t('pin'),
					action: () => this.togglePin(true)
				} : undefined,
				...(this.$store.state.i.isModerator || this.$store.state.i.isAdmin ? [
					null,
					{
						icon: faBullhorn,
						text: this.$t('promote'),
						action: this.promote
					}]
					: []
				),
				...(this.appearNote.userId == this.$store.state.i.id || this.$store.state.i.isModerator || this.$store.state.i.isAdmin ? [
					null,
					this.appearNote.userId == this.$store.state.i.id ? {
						icon: faEdit,
						text: this.$t('deleteAndEdit'),
						action: this.delEdit
					} : undefined,
					{
						icon: faTrashAlt,
						text: this.$t('delete'),
						action: this.del
					}]
					: []
				)]
				.filter(x => x !== undefined);
			} else {
				menu = [{
					icon: faCopy,
					text: this.$t('copyContent'),
					action: this.copyContent
				}, {
					icon: faLink,
					text: this.$t('copyLink'),
					action: this.copyLink
				}, (this.appearNote.url || this.appearNote.uri) ? {
					icon: faExternalLinkSquareAlt,
					text: this.$t('showOnRemote'),
					action: () => {
						window.open(this.appearNote.url || this.appearNote.uri, '_blank');
					}
				} : undefined]
				.filter(x => x !== undefined);
			}

			if (this.$store.state.noteActions.length > 0) {
				menu = menu.concat([null, ...this.$store.state.noteActions.map(action => ({
					icon: faPlug,
					text: action.title,
					action: () => {
						action.handler(this.appearNote);
					}
				}))]);
			}

			this.$root.menu({
				items: menu,
				source: this.$refs.menuButton,
				viaKeyboard
			}).then(this.focus);
		},

		showRenoteMenu(viaKeyboard = false) {
			if (!this.isMyRenote) return;
			this.$root.menu({
				items: [{
					text: this.$t('unrenote'),
					icon: faTrashAlt,
					action: () => {
						this.$root.api('notes/delete', {
							noteId: this.note.id
						});
						Vue.set(this.note, 'deletedAt', new Date());
					}
				}],
				source: this.$refs.renoteTime,
				viaKeyboard: viaKeyboard
			});
		},

		toggleShowContent() {
			this.showContent = !this.showContent;
		},

		copyContent() {
			copyToClipboard(this.appearNote.text);
			this.$root.dialog({
				type: 'success',
				iconOnly: true, autoClose: true
			});
		},

		copyLink() {
			copyToClipboard(`${url}/notes/${this.appearNote.id}`);
			this.$root.dialog({
				type: 'success',
				iconOnly: true, autoClose: true
			});
		},

		togglePin(pin: boolean) {
			this.$root.api(pin ? 'i/pin' : 'i/unpin', {
				noteId: this.appearNote.id
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			}).catch(e => {
				if (e.id === '72dab508-c64d-498f-8740-a8eec1ba385a') {
					this.$root.dialog({
						type: 'error',
						text: this.$t('pinLimitExceeded')
					});
				}
			});
		},

		async promote() {
			const { canceled, result: days } = await this.$root.dialog({
				title: this.$t('numberOfDays'),
				input: { type: 'number' }
			});

			if (canceled) return;

			this.$root.api('admin/promo/create', {
				noteId: this.appearNote.id,
				expiresAt: Date.now() + (86400000 * days)
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			}).catch(e => {
				this.$root.dialog({
					type: 'error',
					text: e
				});
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
.note {
	position: relative;
	transition: box-shadow 0.1s ease;
	overflow: hidden;

	&:focus {
		outline: none;
		box-shadow: 0 0 0 3px var(--focus);
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

		> [data-icon] {
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
			//position: sticky;
			//top: 72px;
			margin: 0 14px 8px 0;
			width: 58px;
			height: 58px;
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

			> .deleted {
				opacity: 0.7;
			}
		}
	}

	> .reply {
		border-top: solid 1px var(--divider);
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
</style>
