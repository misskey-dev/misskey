<template>
<div class="mk-post-form"
	@dragover.stop="onDragover"
	@dragenter="onDragenter"
	@dragleave="onDragleave"
	@drop.stop="onDrop"
>
	<div class="content">
		<div v-if="visibility == 'specified'" class="visibleUsers">
			<span v-for="u in visibleUsers">
				<mk-user-name :user="u"/><a @click="removeVisibleUser(u)">[x]</a>
			</span>
			<a @click="addVisibleUser">{{ $t('add-visible-user') }}</a>
		</div>
		<div class="hashtags" v-if="recentHashtags.length > 0 && $store.state.settings.suggestRecentHashtags">
			<b>{{ $t('recent-tags') }}:</b>
			<a v-for="tag in recentHashtags.slice(0, 5)" @click="addTag(tag)" :title="$t('click-to-tagging')">#{{ tag }}</a>
		</div>
		<div class="local-only" v-if="localOnly == true">{{ $t('local-only-message') }}</div>
		<input v-show="useCw" ref="cw" v-model="cw" :placeholder="$t('annotations')" v-autocomplete="{ model: 'cw' }">
		<div class="textarea">
			<textarea :class="{ with: (files.length != 0 || poll) }"
				ref="text" v-model="text" :disabled="posting"
				@keydown="onKeydown" @paste="onPaste" :placeholder="placeholder"
				v-autocomplete="{ model: 'text' }"
			></textarea>
			<button class="emoji" @click="emoji" ref="emoji">
				<fa :icon="['far', 'laugh']"/>
			</button>
			<div class="files" :class="{ with: poll }" v-show="files.length != 0">
				<x-draggable :list="files" :options="{ animation: 150 }">
					<div v-for="file in files" :key="file.id">
						<div class="img" :style="{ backgroundImage: `url(${file.thumbnailUrl})` }" :title="file.name"></div>
						<img class="remove" @click="detachMedia(file.id)" src="/assets/desktop/remove.png" :title="$t('attach-cancel')" alt=""/>
					</div>
				</x-draggable>
				<p class="remain">{{ 4 - files.length }}/4</p>
			</div>
			<mk-poll-editor v-if="poll" ref="poll" @destroyed="poll = false" @updated="onPollUpdate()"/>
		</div>
	</div>
	<mk-uploader ref="uploader" @uploaded="attachMedia" @change="onChangeUploadings"/>
	<button class="upload" :title="$t('attach-media-from-local')" @click="chooseFile"><fa icon="upload"/></button>
	<button class="drive" :title="$t('attach-media-from-drive')" @click="chooseFileFromDrive"><fa icon="cloud"/></button>
	<button class="kao" :title="$t('insert-a-kao')" @click="kao"><fa :icon="['far', 'smile']"/></button>
	<button class="poll" :title="$t('create-poll')" @click="poll = !poll"><fa icon="chart-pie"/></button>
	<button class="cw" :title="$t('hide-contents')" @click="useCw = !useCw"><fa :icon="['far', 'eye-slash']"/></button>
	<button class="geo" :title="$t('attach-location-information')" @click="geo ? removeGeo() : setGeo()"><fa icon="map-marker-alt"/></button>
	<button class="visibility" :title="$t('visibility')" @click="setVisibility" ref="visibilityButton">
		<span v-if="visibility === 'public'"><fa icon="globe"/></span>
		<span v-if="visibility === 'home'"><fa icon="home"/></span>
		<span v-if="visibility === 'followers'"><fa icon="unlock"/></span>
		<span v-if="visibility === 'specified'"><fa icon="envelope"/></span>
	</button>
	<p class="text-count" :class="{ over: trimmedLength(text) > maxNoteTextLength }">{{ maxNoteTextLength - trimmedLength(text) }}</p>
	<ui-button primary :wait="posting" class="submit" :disabled="!canPost" @click="post">
		{{ posting ? $t('posting') : submitText }}<mk-ellipsis v-if="posting"/>
	</ui-button>
	<input ref="file" type="file" multiple="multiple" tabindex="-1" @change="onChangeFile"/>
	<div class="dropzone" v-if="draghover"></div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import insertTextAtCursor from 'insert-text-at-cursor';
import * as XDraggable from 'vuedraggable';
import getFace from '../../../common/scripts/get-face';
import MkVisibilityChooser from '../../../common/views/components/visibility-chooser.vue';
import { parse } from '../../../../../mfm/parse';
import { host } from '../../../config';
import { erase, unique } from '../../../../../prelude/array';
import { length } from 'stringz';
import { toASCII } from 'punycode';
import extractMentions from '../../../../../misc/extract-mentions';

export default Vue.extend({
	i18n: i18n('desktop/views/components/post-form.vue'),

	components: {
		XDraggable,
		MkVisibilityChooser
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
		initialText: {
			type: String,
			required: false
		},
		instant: {
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
			geo: null,
			visibility: 'public',
			visibleUsers: [],
			localOnly: false,
			autocomplete: null,
			draghover: false,
			recentHashtags: JSON.parse(localStorage.getItem('hashtags') || '[]'),
			maxNoteTextLength: 1000
		};
	},

	created() {
		this.$root.getMeta().then(meta => {
			this.maxNoteTextLength = meta.maxNoteTextLength;
		});
	},

	computed: {
		draftId(): string {
			return this.renote
				? `renote:${this.renote.id}`
				: this.reply
					? `reply:${this.reply.id}`
					: 'note';
		},

		placeholder(): string {
			const xs = [
				this.$t('@.note-placeholders.a'),
				this.$t('@.note-placeholders.b'),
				this.$t('@.note-placeholders.c'),
				this.$t('@.note-placeholders.d'),
				this.$t('@.note-placeholders.e'),
				this.$t('@.note-placeholders.f')
			];
			const x = xs[Math.floor(Math.random() * xs.length)];

			return this.renote
				? this.$t('quote-placeholder')
				: this.reply
					? this.$t('reply-placeholder')
					: x;
		},

		submitText(): string {
			return this.renote
				? this.$t('renote')
				: this.reply
					? this.$t('reply')
					: this.$t('submit');
		},

		canPost(): boolean {
			return !this.posting &&
				(1 <= this.text.length || 1 <= this.files.length || this.poll || this.renote) &&
				(length(this.text.trim()) <= this.maxNoteTextLength) &&
				(!this.poll || this.pollChoices.length >= 2);
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

		if (this.reply && this.reply.user.host != null) {
			this.text = `@${this.reply.user.username}@${toASCII(this.reply.user.host)} `;
		}

		if (this.reply && this.reply.text != null) {
			const ast = parse(this.reply.text);

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
		this.applyVisibility(this.$store.state.settings.rememberNoteVisibility ? (this.$store.state.device.visibility || this.$store.state.settings.defaultNoteVisibility) : this.$store.state.settings.defaultNoteVisibility);

		// 公開以外へのリプライ時は元の公開範囲を引き継ぐ
		if (this.reply && ['home', 'followers', 'specified'].includes(this.reply.visibility)) {
			this.visibility = this.reply.visibility;
		}

		if (this.reply) {
			this.$root.api('users/show', { userId: this.reply.userId }).then(user => {
				this.visibleUsers.push(user);
			});
		}

		// keep cw when reply
		if (this.$store.state.settings.keepCw && this.reply && this.reply.cw) {
			this.useCw = true;
			this.cw = this.reply.cw;
		}

		this.$nextTick(() => {
			// 書きかけの投稿を復元
			if (!this.instant && !this.mention) {
				const draft = JSON.parse(localStorage.getItem('drafts') || '{}')[this.draftId];
				if (draft) {
					this.text = draft.data.text;
					this.files = draft.data.files;
					if (draft.data.poll) {
						this.poll = true;
						this.$nextTick(() => {
							(this.$refs.poll as any).set(draft.data.poll);
						});
					}
					this.$emit('change-attached-files', this.files);
				}
			}

			this.$nextTick(() => this.watch());
		});
	},

	methods: {
		trimmedLength(text: string) {
			return length(text.trim());
		},

		addTag(tag: string) {
			insertTextAtCursor(this.$refs.text, ` #${tag} `);
		},

		watch() {
			this.$watch('text', () => this.saveDraft());
			this.$watch('poll', () => this.saveDraft());
			this.$watch('files', () => this.saveDraft());
		},

		focus() {
			(this.$refs.text as any).focus();
		},

		chooseFile() {
			(this.$refs.file as any).click();
		},

		chooseFileFromDrive() {
			this.$chooseDriveFile({
				multiple: true
			}).then(files => {
				for (const x of files) this.attachMedia(x);
			});
		},

		attachMedia(driveFile) {
			this.files.push(driveFile);
			this.$emit('change-attached-files', this.files);
		},

		detachMedia(id) {
			this.files = this.files.filter(x => x.id != id);
			this.$emit('change-attached-files', this.files);
		},

		onChangeFile() {
			for (const x of Array.from((this.$refs.file as any).files)) this.upload(x);
		},

		onPollUpdate() {
			const got = this.$refs.poll.get();
			this.pollChoices = got.choices;
			this.pollMultiple = got.multiple;
			this.pollExpiration = [got.expiration, got.expiresAt || got.expiredAfter];
			this.saveDraft();
		},

		upload(file) {
			(this.$refs.uploader as any).upload(file);
		},

		onChangeUploadings(uploads) {
			this.$emit('change-uploadings', uploads);
		},

		clear() {
			this.text = '';
			this.files = [];
			this.poll = false;
			this.$emit('change-attached-files', this.files);
		},

		onKeydown(e) {
			if ((e.which == 10 || e.which == 13) && (e.ctrlKey || e.metaKey) && this.canPost) this.post();
		},

		onPaste(e) {
			for (const item of Array.from(e.clipboardData.items)) {
				if (item.kind == 'file') {
					this.upload(item.getAsFile());
				}
			}
		},

		onDragover(e) {
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
				this.$emit('change-attached-files', this.files);
				e.preventDefault();
			}
			//#endregion
		},

		setGeo() {
			if (navigator.geolocation == null) {
				alert(this.$t('geolocation-alert'));
				return;
			}

			navigator.geolocation.getCurrentPosition(pos => {
				this.geo = pos.coords;
				this.$emit('geo-attached', this.geo);
			}, err => {
				alert(`%i18n:@error%: ${err.message}`);
			}, {
					enableHighAccuracy: true
				});
		},

		removeGeo() {
			this.geo = null;
			this.$emit('geo-dettached');
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

		applyVisibility(v :string) {
			const m = v.match(/^local-(.+)/);
			if (m) {
				this.localOnly = true;
				this.visibility = m[1];
			} else {
				this.localOnly = false;
				this.visibility = v;
			}
		},

		addVisibleUser() {
			this.$root.dialog({
				title: this.$t('enter-username'),
				user: true
			}).then(({ canceled, result: user }) => {
				if (canceled) return;
				this.visibleUsers.push(user);
			});
		},

		removeVisibleUser(user) {
			this.visibleUsers = erase(user, this.visibleUsers);
		},

		async emoji() {
			const Picker = await import('./emoji-picker-dialog.vue').then(m => m.default);
			const button = this.$refs.emoji;
			const rect = button.getBoundingClientRect();
			const vm = this.$root.new(Picker, {
				x: button.offsetWidth + rect.left + window.pageXOffset,
				y: rect.top + window.pageYOffset
			});
			vm.$once('chosen', emoji => {
				insertTextAtCursor(this.$refs.text, emoji);
			});
		},

		post() {
			this.posting = true;

			this.$root.api('notes/create', {
				text: this.text == '' ? undefined : this.text,
				fileIds: this.files.length > 0 ? this.files.map(f => f.id) : undefined,
				replyId: this.reply ? this.reply.id : undefined,
				renoteId: this.renote ? this.renote.id : undefined,
				poll: this.poll ? (this.$refs.poll as any).get() : undefined,
				cw: this.useCw ? this.cw || '' : undefined,
				visibility: this.visibility,
				visibleUserIds: this.visibility == 'specified' ? this.visibleUsers.map(u => u.id) : undefined,
				localOnly: this.localOnly,
				geo: this.geo ? {
					coordinates: [this.geo.longitude, this.geo.latitude],
					altitude: this.geo.altitude,
					accuracy: this.geo.accuracy,
					altitudeAccuracy: this.geo.altitudeAccuracy,
					heading: isNaN(this.geo.heading) ? null : this.geo.heading,
					speed: this.geo.speed,
				} : null
			}).then(data => {
				this.clear();
				this.deleteDraft();
				this.$emit('posted');
				this.$notify(this.renote
					? this.$t('reposted')
					: this.reply
						? this.$t('replied')
						: this.$t('posted'));
			}).catch(err => {
				this.$notify(this.renote
					? this.$t('renote-failed')
					: this.reply
						? this.$t('reply-failed')
						: this.$t('note-failed'));
			}).then(() => {
				this.posting = false;
			});

			if (this.text && this.text != '') {
				const hashtags = parse(this.text).filter(x => x.type == 'hashtag').map(x => x.hashtag);
				const history = JSON.parse(localStorage.getItem('hashtags') || '[]') as string[];
				localStorage.setItem('hashtags', JSON.stringify(unique(hashtags.concat(history))));
			}
		},

		saveDraft() {
			if (this.instant) return;

			const data = JSON.parse(localStorage.getItem('drafts') || '{}');

			data[this.draftId] = {
				updatedAt: new Date(),
				data: {
					text: this.text,
					files: this.files,
					poll: this.poll && this.$refs.poll ? (this.$refs.poll as any).get() : undefined
				}
			}

			localStorage.setItem('drafts', JSON.stringify(data));
		},

		deleteDraft() {
			const data = JSON.parse(localStorage.getItem('drafts') || '{}');

			delete data[this.draftId];

			localStorage.setItem('drafts', JSON.stringify(data));
		},

		kao() {
			this.text += getFace();
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-post-form
	display block
	padding 16px
	background var(--desktopPostFormBg)
	overflow hidden

	&:after
		content ""
		display block
		clear both

	> .content
		> input
		> .textarea > textarea
			display block
			width 100%
			padding 12px
			font-size 16px
			color var(--desktopPostFormTextareaFg)
			background var(--desktopPostFormTextareaBg)
			outline none
			border solid 1px var(--primaryAlpha01)
			border-radius 4px
			transition border-color .2s ease
			padding-right 30px

			&:hover
				border-color var(--primaryAlpha02)
				transition border-color .1s ease

			&:focus
				border-color var(--primaryAlpha05)
				transition border-color 0s ease

			&:disabled
				opacity 0.5

			&::-webkit-input-placeholder
				color var(--primaryAlpha03)

		> input
			margin-bottom 8px

		> .textarea
			> .emoji
				position absolute
				top 0
				right 0
				padding 10px
				font-size 18px
				color var(--text)
				opacity 0.5

				&:hover
					color var(--textHighlighted)
					opacity 1

				&:active
					color var(--primary)
					opacity 1

			> textarea
				margin 0
				max-width 100%
				min-width 100%
				min-height 84px

				&:hover
					& + * + *
					& + * + * + *
						border-color var(--primaryAlpha02)
						transition border-color .1s ease

				&:focus
					& + * + *
					& + * + * + *
						border-color var(--primaryAlpha05)
						transition border-color 0s ease

					& + .emoji
						opacity 0.7

				&.with
					border-bottom solid 1px var(--primaryAlpha01) !important
					border-radius 4px 4px 0 0

			> .files
				margin 0
				padding 0
				background var(--desktopPostFormTextareaBg)
				border solid 1px var(--primaryAlpha01)
				border-top none
				border-radius 0 0 4px 4px
				transition border-color .3s ease

				&.with
					border-bottom solid 1px var(--primaryAlpha01) !important
					border-radius 0

				> .remain
					display block
					position absolute
					top 8px
					right 8px
					margin 0
					padding 0
					color var(--primaryAlpha04)

				> div
					padding 4px

					&:after
						content ""
						display block
						clear both

					> div
						float left
						border solid 4px transparent
						cursor move

						&:hover > .remove
							display block

						> .img
							width 64px
							height 64px
							background-size cover
							background-position center center

						> .remove
							display none
							position absolute
							top -6px
							right -6px
							width 16px
							height 16px
							cursor pointer

			> .mk-poll-editor
				background var(--desktopPostFormTextareaBg)
				border solid 1px var(--primaryAlpha01)
				border-top none
				border-radius 0 0 4px 4px
				transition border-color .3s ease

		> .visibleUsers
			margin-bottom 8px
			font-size 14px

			> span
				margin-right 16px
				color var(--primary)

		> .hashtags
			margin 0 0 8px 0
			overflow hidden
			white-space nowrap
			font-size 14px

			> b
				color var(--primary)

			> *
				margin-right 8px
				white-space nowrap

		> .local-only
			margin 0 0 8px 0
			color var(--primary)

	> .mk-uploader
		margin 8px 0 0 0
		padding 8px
		border solid 1px var(--primaryAlpha02)
		border-radius 4px

	input[type='file']
		display none

	.submit
		display block
		position absolute
		bottom 16px
		right 16px
		width 110px
		height 40px

	> .text-count
		pointer-events none
		display block
		position absolute
		bottom 16px
		right 138px
		margin 0
		line-height 40px
		color var(--primaryAlpha05)

		&.over
			color #ec3828

	> .upload
	> .drive
	> .kao
	> .poll
	> .cw
	> .geo
	> .visibility
		display inline-block
		cursor pointer
		padding 0
		margin 8px 4px 0 0
		width 40px
		height 40px
		font-size 1em
		color var(--desktopPostFormTransparentButtonFg)
		background transparent
		outline none
		border solid 1px transparent
		border-radius 4px

		&:hover
			background transparent
			border-color var(--primaryAlpha03)

		&:active
			color var(--primaryAlpha06)
			background linear-gradient(to bottom, var(--desktopPostFormTransparentButtonActiveGradientStart) 0%, var(--desktopPostFormTransparentButtonActiveGradientEnd) 100%)
			border-color var(--primaryAlpha05)
			box-shadow 0 2px 4px rgba(#000, 0.15) inset

		&:focus
			&:after
				content ""
				pointer-events none
				position absolute
				top -5px
				right -5px
				bottom -5px
				left -5px
				border 2px solid var(--primaryAlpha03)
				border-radius 8px

	> .dropzone
		position absolute
		left 0
		top 0
		width 100%
		height 100%
		border dashed 2px var(--primaryAlpha05)
		pointer-events none

</style>
