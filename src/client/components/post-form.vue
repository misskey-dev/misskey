<template>
<div class="gafaadew"
	@dragover.stop="onDragover"
	@dragenter="onDragenter"
	@dragleave="onDragleave"
	@drop.stop="onDrop"
>
	<header>
		<button v-if="!fixed" class="cancel _button" @click="cancel"><fa :icon="faTimes"/></button>
		<div>
			<span class="text-count" :class="{ over: trimmedLength(text) > max }">{{ max - trimmedLength(text) }}</span>
			<button class="_button visibility" @click="setVisibility" ref="visibilityButton">
				<span v-if="visibility === 'public'"><fa :icon="faGlobe"/></span>
				<span v-if="visibility === 'home'"><fa :icon="faHome"/></span>
				<span v-if="visibility === 'followers'"><fa :icon="faUnlock"/></span>
				<span v-if="visibility === 'specified'"><fa :icon="faEnvelope"/></span>
			</button>
			<button class="submit _buttonPrimary" :disabled="!canPost" @click="post">{{ submitText }}<fa :icon="reply ? faReply : renote ? faQuoteRight : faPaperPlane"/></button>
		</div>
	</header>
	<div class="form" :class="{ fixed }">
		<x-note-preview class="preview" v-if="attachedReply" :note="attachedReply"/>
		<x-note-preview class="preview" v-if="attachedRenote" :note="attachedRenote"/>
		<div class="with-quote" v-if="quoteId"><fa icon="quote-left"/> {{ $t('quoteAttached') }}<button @click="quoteId = null"><fa icon="times"/></button></div>
		<div v-if="visibility === 'specified'" class="to-specified">
			<span style="margin-right: 8px;">{{ $t('recipient') }}</span>
			<div class="visibleUsers">
				<span v-for="u in visibleUsers">
					<mk-acct :user="u"/>
					<button class="_button" @click="removeVisibleUser(u)"><fa :icon="faTimes"/></button>
				</span>
				<button @click="addVisibleUser" class="_buttonPrimary"><fa :icon="faPlus" fixed-width/></button>
			</div>
		</div>
		<input v-show="useCw" ref="cw" class="cw" v-model="cw" :placeholder="$t('annotation')" v-autocomplete="{ model: 'cw' }">
		<textarea v-model="text" class="text" :class="{ withCw: useCw }" ref="text" :disabled="posting" :placeholder="placeholder" v-autocomplete="{ model: 'text' }" @keydown="onKeydown" @paste="onPaste"></textarea>
		<x-post-form-attaches class="attaches" :files="files"/>
		<x-poll-editor v-if="poll" ref="poll" @destroyed="poll = false" @updated="onPollUpdate()"/>
		<x-uploader ref="uploader" @uploaded="attachMedia" @change="onChangeUploadings"/>
		<footer>
			<button class="_button" @click="chooseFileFrom"><fa :icon="faPhotoVideo"/></button>
			<button class="_button" @click="poll = !poll" :class="{ active: poll }"><fa :icon="faChartPie"/></button>
			<button class="_button" @click="useCw = !useCw" :class="{ active: useCw }"><fa :icon="faEyeSlash"/></button>
			<button class="_button" @click="insertMention"><fa :icon="faAt"/></button>
			<button class="_button" @click="insertEmoji"><fa :icon="faLaughSquint"/></button>
			<button class="_button" v-if="visibility !== 'specified'" @click="localOnly = !localOnly" :class="{ active: localOnly }"><fa :icon="faBiohazard"/></button>
		</footer>
		<input ref="file" class="file _button" type="file" multiple="multiple" @change="onChangeFile"/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faReply, faQuoteRight, faPaperPlane, faTimes, faUpload, faChartPie, faGlobe, faHome, faUnlock, faEnvelope, faPlus, faPhotoVideo, faCloud, faLink, faAt, faBiohazard } from '@fortawesome/free-solid-svg-icons';
import { faEyeSlash, faLaughSquint } from '@fortawesome/free-regular-svg-icons';
import insertTextAtCursor from 'insert-text-at-cursor';
import { length } from 'stringz';
import { toASCII } from 'punycode';
import i18n from '../i18n';
import MkVisibilityChooser from './visibility-chooser.vue';
import MkUserSelect from './user-select.vue';
import XNotePreview from './note-preview.vue';
import { parse } from '../../mfm/parse';
import { host, url } from '../config';
import { erase, unique } from '../../prelude/array';
import extractMentions from '../../misc/extract-mentions';
import getAcct from '../../misc/acct/render';
import { formatTimeString } from '../../misc/format-time-string';
import { selectDriveFile } from '../scripts/select-drive-file';

export default Vue.extend({
	i18n,

	components: {
		XNotePreview,
		XUploader: () => import('./uploader.vue').then(m => m.default),
		XPostFormAttaches: () => import('./post-form-attaches.vue').then(m => m.default),
		XPollEditor: () => import('./poll-editor.vue').then(m => m.default)
	},

	props: {
		reply: {
			type: Object,
			required: false
		},
		renote: {
			type: Object,
			required: false
		},
		mention: {
			type: Object,
			required: false
		},
		specified: {
			type: Object,
			required: false
		},
		initialText: {
			type: String,
			required: false
		},
		initialNote: {
			type: Object,
			required: false
		},
		instant: {
			type: Boolean,
			required: false,
			default: false
		},
		fixed: {
			type: Boolean,
			required: false,
			default: false
		}
	},

	data() {
		return {
			posting: false,
			text: '',
			files: [],
			uploadings: [],
			poll: false,
			pollChoices: [],
			pollMultiple: false,
			pollExpiration: [],
			useCw: false,
			cw: null,
			localOnly: false,
			visibility: 'public',
			visibleUsers: [],
			autocomplete: null,
			draghover: false,
			quoteId: null,
			attachedReply: null,
			attachedRenote: null,
			recentHashtags: JSON.parse(localStorage.getItem('hashtags') || '[]'),
			faReply, faQuoteRight, faPaperPlane, faTimes, faUpload, faChartPie, faGlobe, faHome, faUnlock, faEnvelope, faEyeSlash, faLaughSquint, faPlus, faPhotoVideo, faCloud, faLink, faAt, faBiohazard
		};
	},

	computed: {
		draftId(): string {
			return this.attachedRenote
				? `renote:${this.attachedRenote.id}`
				: this.attachedReply
					? `reply:${this.attachedReply.id}`
					: 'note';
		},

		placeholder(): string {
			const xs = [
				this.$t('_postForm._placeholders.a'),
				this.$t('_postForm._placeholders.b'),
				this.$t('_postForm._placeholders.c'),
				this.$t('_postForm._placeholders.d'),
				this.$t('_postForm._placeholders.e'),
				this.$t('_postForm._placeholders.f')
			];
			const x = xs[Math.floor(Math.random() * xs.length)];

			return this.attachedRenote
				? this.$t('_postForm.quotePlaceholder')
				: this.attachedReply
					? this.$t('_postForm.replyPlaceholder')
					: x;
		},

		submitText(): string {
			return this.attachedRenote
				? this.$t('quote')
				: this.attachedReply
					? this.$t('reply')
					: this.$t('note');
		},

		canPost(): boolean {
			return !this.posting &&
				(1 <= this.text.length || 1 <= this.files.length || this.poll || this.attachedRenote) &&
				(length(this.text.trim()) <= this.max) &&
				(!this.poll || this.pollChoices.length >= 2);
		},

		max(): number {
			return this.$store.state.instance.meta ? this.$store.state.instance.meta.maxNoteTextLength : 1000;
		}
	},

	watch: {
		localOnly() {
			this.$store.commit('deviceUser/setLocalOnly', this.localOnly);
		}
	},

	mounted() {
		if (this.initialText) {
			this.text = this.initialText;
		}

		if (this.mention) {
			this.text = this.mention.host ? `@${this.mention.username}@${toASCII(this.mention.host)}` : `@${this.mention.username}`;
			this.text += ' ';
		}

		this.attachedReply = this.reply;
		this.attachedRenote = this.renote;

		if (this.attachedReply && this.attachedReply.user.host != null) {
			this.text = `@${this.attachedReply.user.username}@${toASCII(this.attachedReply.user.host)} `;
		}

		if (this.attachedReply && this.attachedReply.text != null) {
			const ast = parse(this.attachedReply.text);

			for (const x of extractMentions(ast)) {
				const mention = x.host ? `@${x.username}@${toASCII(x.host)}` : `@${x.username}`;

				// 自分は除外
				if (this.$store.state.i.username == x.username && x.host == null) continue;
				if (this.$store.state.i.username == x.username && x.host == host) continue;

				// 重複は除外
				if (this.text.indexOf(`${mention} `) != -1) continue;

				this.text += `${mention} `;
			}
		}

		// デフォルト公開範囲
		this.applyVisibility(this.$store.state.settings.rememberNoteVisibility ? this.$store.state.deviceUser.visibility : this.$store.state.settings.defaultNoteVisibility);

		this.localOnly = this.$store.state.settings.rememberNoteVisibility ? this.$store.state.deviceUser.localOnly : this.$store.state.settings.defaultNoteLocalOnly;

		// 公開以外へのリプライ時は元の公開範囲を引き継ぐ
		if (this.attachedReply && ['home', 'followers', 'specified'].includes(this.attachedReply.visibility)) {
			this.visibility = this.attachedReply.visibility;
			if (this.attachedReply.visibility === 'specified') {
				this.$root.api('users/show', {
					userIds: this.attachedReply.visibleUserIds.filter(uid => uid !== this.$store.state.i.id && uid !== this.attachedReply.userId)
				}).then(users => {
					this.visibleUsers.push(...users);
				});

				if (this.attachedReply.userId !== this.$store.state.i.id) {
					this.$root.api('users/show', { userId: this.attachedReply.userId }).then(user => {
						this.visibleUsers.push(user);
					});
				}
			}
		}

		if (this.specified) {
			this.visibility = 'specified';
			this.visibleUsers.push(this.specified);
		}

		// keep cw when reply
		if (this.$store.state.settings.keepCw && this.attachedReply && this.attachedReply.cw) {
			this.useCw = true;
			this.cw = this.attachedReply.cw;
		}

		this.focus();

		this.$nextTick(() => {
			this.focus();
		});

		this.$nextTick(() => {
			// 書きかけの投稿を復元
			if (!this.instant && !this.mention) {
				const draft = JSON.parse(localStorage.getItem('drafts') || '{}')[this.draftId];
				if (draft) {
					this.text = draft.data.text;
					this.useCw = draft.data.useCw;
					this.cw = draft.data.cw;
					this.applyVisibility(draft.data.visibility);
					this.localOnly = draft.data.localOnly;
					this.files = (draft.data.files || []).filter(e => e);
					if (draft.data.poll) {
						this.poll = true;
						this.$nextTick(() => {
							(this.$refs.poll as any).set(draft.data.poll);
						});
					}
				}
			}

			// 削除して編集
			if (this.initialNote) {
				const init = this.initialNote;
				this.text = init.text ? init.text : '';
				this.files = init.files;
				this.cw = init.cw;
				this.useCw = init.cw != null;
				if (init.poll) {
					this.poll = true;
					this.$nextTick(() => {
						(this.$refs.poll as any).set({
							choices: init.poll.choices.map(c => c.text),
							multiple: init.poll.multiple
						});
					});
				}
				this.visibility = init.visibility;
				this.localOnly = init.localOnly;
				this.attachedRenote = init.renote;
				this.attachedReply = init.reply;
			}

			this.$nextTick(() => this.watch());
		});
	},

	methods: {
		watch() {
			this.$watch('text', () => this.saveDraft());
			this.$watch('useCw', () => this.saveDraft());
			this.$watch('cw', () => this.saveDraft());
			this.$watch('poll', () => this.saveDraft());
			this.$watch('files', () => this.saveDraft());
			this.$watch('visibility', () => this.saveDraft());
			this.$watch('localOnly', () => this.saveDraft());
		},

		trimmedLength(text: string) {
			return length(text.trim());
		},

		addTag(tag: string) {
			insertTextAtCursor(this.$refs.text, ` #${tag} `);
		},

		focus() {
			(this.$refs.text as any).focus();
		},

		chooseFileFrom(ev) {
			this.$root.menu({
				items: [{
					type: 'label',
					text: this.$t('attachFile'),
				}, {
					text: this.$t('upload'),
					icon: faUpload,
					action: () => { this.chooseFileFromPc() }
				}, {
					text: this.$t('fromDrive'),
					icon: faCloud,
					action: () => { this.chooseFileFromDrive() }
				}, {
					text: this.$t('fromUrl'),
					icon: faLink,
					action: () => { this.chooseFileFromUrl() }
				}],
				source: ev.currentTarget || ev.target
			});
		},

		chooseFileFromPc() {
			(this.$refs.file as any).click();
		},

		chooseFileFromDrive() {
			selectDriveFile(this.$root, true).then(files => {
				for (const file of files) {
					this.attachMedia(file);
				}
			});
		},

		attachMedia(driveFile) {
			this.files.push(driveFile);
		},

		detachMedia(id) {
			this.files = this.files.filter(x => x.id != id);
		},

		updateMedia(file) {
			Vue.set(this.files, this.files.findIndex(x => x.id === file.id), file);
		},

		onChangeFile() {
			for (const x of Array.from((this.$refs.file as any).files)) this.upload(x);
		},

		upload(file: File, name?: string) {
			(this.$refs.uploader as any).upload(file, this.$store.state.settings.uploadFolder, name);
		},

		onChangeUploadings(uploads) {
			this.$emit('change-uploadings', uploads);
		},

		onPollUpdate() {
			const got = this.$refs.poll.get();
			this.pollChoices = got.choices;
			this.pollMultiple = got.multiple;
			this.pollExpiration = [got.expiration, got.expiresAt || got.expiredAfter];
			this.saveDraft();
		},

		setVisibility() {
			const w = this.$root.new(MkVisibilityChooser, {
				source: this.$refs.visibilityButton,
				currentVisibility: this.visibility
			});
			w.$once('chosen', v => {
				this.applyVisibility(v);
			});
		},

		applyVisibility(v: string) {
			this.visibility = ['public', 'home', 'followers', 'specified'].includes(v) ? v : 'public'; // v11互換性のため
		},

		addVisibleUser() {
			const vm = this.$root.new(MkUserSelect, {});
			vm.$once('selected', user => {
				this.visibleUsers.push(user);
			});
		},

		removeVisibleUser(user) {
			this.visibleUsers = erase(user, this.visibleUsers);
		},

		clear() {
			this.text = '';
			this.files = [];
			this.poll = false;
			this.quoteId = null;
		},

		onKeydown(e) {
			if ((e.which == 10 || e.which == 13) && (e.ctrlKey || e.metaKey) && this.canPost) this.post();
		},

		async onPaste(e: ClipboardEvent) {
			for (const { item, i } of Array.from(e.clipboardData.items).map((item, i) => ({item, i}))) {
				if (item.kind == 'file') {
					const file = item.getAsFile();
					const lio = file.name.lastIndexOf('.');
					const ext = lio >= 0 ? file.name.slice(lio) : '';
					const formatted = `${formatTimeString(new Date(file.lastModified), this.$store.state.settings.pastedFileName).replace(/{{number}}/g, `${i + 1}`)}${ext}`;
					this.upload(file, formatted);
				}
			}

			const paste = e.clipboardData.getData('text');

			if (!this.attachedRenote && !this.quoteId && paste.startsWith(url + '/notes/')) {
				e.preventDefault();

				this.$root.dialog({
					type: 'info',
					text: this.$t('quoteQuestion'),
					showCancelButton: true
				}).then(({ canceled }) => {
					if (canceled) {
						insertTextAtCursor(this.$refs.text, paste);
						return;
					}

					this.quoteId = paste.substr(url.length).match(/^\/notes\/(.+?)\/?$/)[1];
				});
			}
		},

		onDragover(e) {
			if (!e.dataTransfer.items[0]) return;
			const isFile = e.dataTransfer.items[0].kind == 'file';
			const isDriveFile = e.dataTransfer.types[0] == 'mk_drive_file';
			if (isFile || isDriveFile) {
				e.preventDefault();
				this.draghover = true;
				e.dataTransfer.dropEffect = e.dataTransfer.effectAllowed == 'all' ? 'copy' : 'move';
			}
		},

		onDragenter(e) {
			this.draghover = true;
		},

		onDragleave(e) {
			this.draghover = false;
		},

		onDrop(e): void {
			this.draghover = false;

			// ファイルだったら
			if (e.dataTransfer.files.length > 0) {
				e.preventDefault();
				for (const x of Array.from(e.dataTransfer.files)) this.upload(x);
				return;
			}

			//#region ドライブのファイル
			const driveFile = e.dataTransfer.getData('mk_drive_file');
			if (driveFile != null && driveFile != '') {
				const file = JSON.parse(driveFile);
				this.files.push(file);
				e.preventDefault();
			}
			//#endregion
		},

		saveDraft() {
			if (this.instant) return;

			const data = JSON.parse(localStorage.getItem('drafts') || '{}');

			data[this.draftId] = {
				updatedAt: new Date(),
				data: {
					text: this.text,
					useCw: this.useCw,
					cw: this.cw,
					visibility: this.visibility,
					localOnly: this.localOnly,
					files: this.files,
					poll: this.poll && this.$refs.poll ? (this.$refs.poll as any).get() : undefined
				}
			};

			localStorage.setItem('drafts', JSON.stringify(data));
		},

		deleteDraft() {
			const data = JSON.parse(localStorage.getItem('drafts') || '{}');

			delete data[this.draftId];

			localStorage.setItem('drafts', JSON.stringify(data));
		},

		post() {
			this.posting = true;
			this.$root.api('notes/create', {
				text: this.text == '' ? undefined : this.text,
				fileIds: this.files.length > 0 ? this.files.map(f => f.id) : undefined,
				replyId: this.attachedReply ? this.attachedReply.id : undefined,
				renoteId: this.attachedRenote ? this.attachedRenote.id : this.quoteId ? this.quoteId : undefined,
				poll: this.poll ? (this.$refs.poll as any).get() : undefined,
				cw: this.useCw ? this.cw || '' : undefined,
				localOnly: this.localOnly,
				visibility: this.visibility,
				visibleUserIds: this.visibility == 'specified' ? this.visibleUsers.map(u => u.id) : undefined,
				viaMobile: this.$root.isMobile
			}).then(data => {
				this.clear();
				this.deleteDraft();
				this.$emit('posted');
			}).catch(err => {
			}).then(() => {
				this.posting = false;
			});

			if (this.text && this.text != '') {
				const hashtags = parse(this.text).filter(x => x.node.type === 'hashtag').map(x => x.node.props.hashtag);
				const history = JSON.parse(localStorage.getItem('hashtags') || '[]') as string[];
				localStorage.setItem('hashtags', JSON.stringify(unique(hashtags.concat(history))));
			}
		},

		cancel() {
			this.$emit('cancel');
		},

		insertMention() {
			const vm = this.$root.new(MkUserSelect, {});
			vm.$once('selected', user => {
				insertTextAtCursor(this.$refs.text, getAcct(user) + ' ');
			});
		},

		async insertEmoji(ev) {
			const vm = this.$root.new(await import('./emoji-picker.vue').then(m => m.default), {
				source: ev.currentTarget || ev.target
			}).$once('chosen', emoji => {
				insertTextAtCursor(this.$refs.text, emoji);
				vm.close();
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.gafaadew {
	background: var(--panel);
	border-radius: var(--radius);

	> header {
		z-index: 1000;
		height: 66px;

		@media (max-width: 500px) {
			height: 50px;
		}

		> .cancel {
			padding: 0;
			font-size: 20px;
			width: 64px;
			line-height: 66px;

			@media (max-width: 500px) {
				width: 50px;
				line-height: 50px;
			}
		}

		> div {
			position: absolute;
			top: 0;
			right: 0;

			> .text-count {
				opacity: 0.7;
				line-height: 66px;

				@media (max-width: 500px) {
					line-height: 50px;
				}
			}

			> .visibility {
				height: 34px;
				width: 34px;
				margin: 0 8px;
			}

			> .submit {
				margin: 16px 16px 16px 0;
				padding: 0 12px;
				line-height: 34px;
				font-weight: bold;
				vertical-align: bottom;
				border-radius: 4px;

				@media (max-width: 500px) {
					margin: 8px;
				}

				&:disabled {
					opacity: 0.7;
				}

				> [data-icon] {
					margin-left: 6px;
				}
			}
		}
	}

	> .form {
		max-width: 500px;
		margin: 0 auto;

		&.fixed {
			max-width: unset;
		}

		> .preview {
			padding: 16px;
		}

		> .with-quote {
			margin: 0 0 8px 0;
			color: var(--accent);

			> button {
				padding: 4px 8px;
				color: var(--accentAlpha04);

				&:hover {
					color: var(--accentAlpha06);
				}

				&:active {
					color: var(--accentDarken30);
				}
			}
		}

		> .to-specified {
			padding: 6px 24px;
			margin-bottom: 8px;
			overflow: auto;
			white-space: nowrap;

			@media (max-width: 500px) {
				padding: 6px 16px;
			}

			> .visibleUsers {
				display: inline;
				top: -1px;
				font-size: 14px;

				> button {
					padding: 4px;
					border-radius: 8px;
				}

				> span {
					margin-right: 14px;
					padding: 8px 0 8px 8px;
					border-radius: 8px;
					background: var(--nwjktjjq);

					> button {
						padding: 4px 8px;
					}
				}
			}
		}

		> .cw,
		> .text {
			display: block;
			box-sizing: border-box;
			padding: 0 24px;
			margin: 0;
			width: 100%;
			font-size: 16px;
			border: none;
			border-radius: 0;
			background: transparent;
			color: var(--fg);
			font-family: inherit;

			@media (max-width: 500px) {
				padding: 0 16px;
			}

			&:focus {
				outline: none;
			}

			&:disabled {
				opacity: 0.5;
			}
		}

		> .cw {
			z-index: 1;
			padding-bottom: 8px;
			border-bottom: solid 1px var(--divider);
		}

		> .text {
			max-width: 100%;
			min-width: 100%;
			min-height: 90px;

			@media (max-width: 500px) {
				min-height: 80px;
			}

			&.withCw {
				padding-top: 8px;
			}
		}

		> .mk-uploader {
			margin: 8px 0 0 0;
			padding: 8px;
		}

		> .file {
			display: none;
		}

		> footer {
			padding: 0 16px 16px 16px;

			@media (max-width: 500px) {
				padding: 0 8px 8px 8px;
			}

			> button {
				display: inline-block;
				padding: 0;
				margin: 0;
				font-size: 16px;
				width: 48px;
				height: 48px;
				border-radius: 6px;

				&:hover {
					background: var(--geavgsxy);
				}

				&.active {
					color: var(--accent);
				}
			}
		}
	}
}
</style>
