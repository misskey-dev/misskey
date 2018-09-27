<template>
<div class="mk-post-form"
	@dragover.stop="onDragover"
	@dragenter="onDragenter"
	@dragleave="onDragleave"
	@drop.stop="onDrop"
>
	<div class="content">
		<div v-if="visibility == 'specified'" class="visibleUsers">
			<span v-for="u in visibleUsers">{{ u | userName }}<a @click="removeVisibleUser(u)">[x]</a></span>
			<a @click="addVisibleUser">%i18n:@add-visible-user%</a>
		</div>
		<div class="hashtags" v-if="recentHashtags.length > 0 && $store.state.settings.suggestRecentHashtags">
			<b>%i18n:@recent-tags%:</b>
			<a v-for="tag in recentHashtags.slice(0, 5)" @click="addTag(tag)" title="%@click-to-tagging%">#{{ tag }}</a>
		</div>
		<input v-show="useCw" v-model="cw" placeholder="%i18n:@annotations%">
		<textarea :class="{ with: (files.length != 0 || poll) }"
			ref="text" v-model="text" :disabled="posting"
			@keydown="onKeydown" @paste="onPaste" :placeholder="placeholder"
			v-autocomplete="'text'"
		></textarea>
		<div class="files" :class="{ with: poll }" v-show="files.length != 0">
			<x-draggable :list="files" :options="{ animation: 150 }">
				<div v-for="file in files" :key="file.id">
					<div class="img" :style="{ backgroundImage: `url(${file.thumbnailUrl})` }" :title="file.name"></div>
					<img class="remove" @click="detachMedia(file.id)" src="/assets/desktop/remove.png" title="%i18n:@attach-cancel%" alt=""/>
				</div>
			</x-draggable>
			<p class="remain">{{ 4 - files.length }}/4</p>
		</div>
		<mk-poll-editor v-if="poll" ref="poll" @destroyed="poll = false" @updated="saveDraft()"/>
	</div>
	<mk-uploader ref="uploader" @uploaded="attachMedia" @change="onChangeUploadings"/>
	<button class="upload" title="%i18n:@attach-media-from-local%" @click="chooseFile">%fa:upload%</button>
	<button class="drive" title="%i18n:@attach-media-from-drive%" @click="chooseFileFromDrive">%fa:cloud%</button>
	<button class="kao" title="%i18n:@insert-a-kao%" @click="kao">%fa:R smile%</button>
	<button class="poll" title="%i18n:@create-poll%" @click="poll = !poll">%fa:chart-pie%</button>
	<button class="poll" title="%i18n:@hide-contents%" @click="useCw = !useCw">%fa:eye-slash%</button>
	<button class="geo" title="%i18n:@attach-location-information%" @click="geo ? removeGeo() : setGeo()">%fa:map-marker-alt%</button>
	<button class="visibility" title="%i18n:@visibility%" @click="setVisibility" ref="visibilityButton">
		<span v-if="visibility === 'public'">%fa:globe%</span>
		<span v-if="visibility === 'home'">%fa:home%</span>
		<span v-if="visibility === 'followers'">%fa:unlock%</span>
		<span v-if="visibility === 'specified'">%fa:envelope%</span>
		<span v-if="visibility === 'private'">%fa:lock%</span>
	</button>
	<p class="text-count" :class="{ over: this.trimmedLength(text) > 1000 }">{{ 1000 - this.trimmedLength(text) }}</p>
	<button :class="{ posting }" class="submit" :disabled="!canPost" @click="post">
		{{ posting ? '%i18n:@posting%' : submitText }}<mk-ellipsis v-if="posting"/>
	</button>
	<input ref="file" type="file" multiple="multiple" tabindex="-1" @change="onChangeFile"/>
	<div class="dropzone" v-if="draghover"></div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import insertTextAtCursor from 'insert-text-at-cursor';
import * as XDraggable from 'vuedraggable';
import getFace from '../../../common/scripts/get-face';
import MkVisibilityChooser from '../../../common/views/components/visibility-chooser.vue';
import parse from '../../../../../mfm/parse';
import { host } from '../../../config';
import { erase, unique } from '../../../../../prelude/array';
import { length } from 'stringz';
import parseAcct from '../../../../../misc/acct/parse';

export default Vue.extend({
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
			useCw: false,
			cw: null,
			geo: null,
			visibility: this.$store.state.settings.rememberNoteVisibility ? (this.$store.state.device.visibility || this.$store.state.settings.defaultNoteVisibility) : this.$store.state.settings.defaultNoteVisibility,
			visibleUsers: [],
			autocomplete: null,
			draghover: false,
			recentHashtags: JSON.parse(localStorage.getItem('hashtags') || '[]')
		};
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
				'%i18n:common.note-placeholders.a%',
				'%i18n:common.note-placeholders.b%',
				'%i18n:common.note-placeholders.c%',
				'%i18n:common.note-placeholders.d%',
				'%i18n:common.note-placeholders.e%',
				'%i18n:common.note-placeholders.f%'
			];
			const x = xs[Math.floor(Math.random() * xs.length)];

			return this.renote
				? '%i18n:@quote-placeholder%'
				: this.reply
					? '%i18n:@reply-placeholder%'
					: x;
		},

		submitText(): string {
			return this.renote
				? '%i18n:@renote%'
				: this.reply
					? '%i18n:@reply%'
					: '%i18n:@submit%';
		},

		canPost(): boolean {
			return !this.posting &&
				(1 <= this.text.length || 1 <= this.files.length || this.poll || this.renote) &&
				(length(this.text.trim()) <= 1000);
		}
	},

	mounted() {
		if (this.initialText) {
			this.text = this.initialText;
		}

		if (this.reply && this.reply.user.host != null) {
			this.text = `@${this.reply.user.username}@${this.reply.user.host} `;
		}

		if (this.reply && this.reply.text != null) {
			const ast = parse(this.reply.text);

			ast.filter(t => t.type == 'mention').forEach(x => {
				const mention = x.host ? `@${x.username}@${x.host}` : `@${x.username}`;

				// 自分は除外
				if (this.$store.state.i.username == x.username && x.host == null) return;
				if (this.$store.state.i.username == x.username && x.host == host) return;

				// 重複は除外
				if (this.text.indexOf(`${mention} `) != -1) return;

				this.text += `${mention} `;
			});
		}

		this.$nextTick(() => {
			// 書きかけの投稿を復元
			if (!this.instant) {
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
			(this as any).apis.chooseDriveFile({
				multiple: true
			}).then(files => {
				files.forEach(this.attachMedia);
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
			Array.from((this.$refs.file as any).files).forEach(this.upload);
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
			Array.from(e.clipboardData.items).forEach((item: any) => {
				if (item.kind == 'file') {
					this.upload(item.getAsFile());
				}
			});
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
				Array.from(e.dataTransfer.files).forEach(this.upload);
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
				alert('%i18n:@geolocation-alert%');
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
			const w = (this as any).os.new(MkVisibilityChooser, {
				source: this.$refs.visibilityButton
			});
			w.$once('chosen', v => {
				this.visibility = v;
			});
		},

		addVisibleUser() {
			(this as any).apis.input({
				title: '%i18n:@enter-username%'
			}).then(acct => {
				if (acct.startsWith('@')) acct = acct.substr(1);
				(this as any).api('users/show', parseAcct(acct)).then(user => {
					this.visibleUsers.push(user);
				});
			});
		},

		removeVisibleUser(user) {
			this.visibleUsers = erase(user, this.visibleUsers);
		},

		post() {
			this.posting = true;

			(this as any).api('notes/create', {
				text: this.text == '' ? undefined : this.text,
				fileIds: this.files.length > 0 ? this.files.map(f => f.id) : undefined,
				replyId: this.reply ? this.reply.id : undefined,
				renoteId: this.renote ? this.renote.id : undefined,
				poll: this.poll ? (this.$refs.poll as any).get() : undefined,
				cw: this.useCw ? this.cw || '' : undefined,
				visibility: this.visibility,
				visibleUserIds: this.visibility == 'specified' ? this.visibleUsers.map(u => u.id) : undefined,
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
				(this as any).apis.notify(this.renote
					? '%i18n:@reposted%'
					: this.reply
						? '%i18n:@replied%'
						: '%i18n:@posted%');
			}).catch(err => {
				(this as any).apis.notify(this.renote
					? '%i18n:@renote-failed%'
					: this.reply
						? '%i18n:@reply-failed%'
						: '%i18n:@note-failed%');
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
root(isDark)
	display block
	padding 16px
	background var(--desktopPostFormBg)

	&:after
		content ""
		display block
		clear both

	> .content
		> input
		> textarea
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

		> textarea
			margin 0
			max-width 100%
			min-width 100%
			min-height 84px

			&:hover
				& + *
				& + * + *
					border-color var(--primaryAlpha02)
					transition border-color .1s ease

			&:focus
				& + *
				& + * + *
					border-color var(--primaryAlpha05)
					transition border-color 0s ease

			&.with
				border-bottom solid 1px var(--primaryAlpha01) !important
				border-radius 4px 4px 0 0

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

		> .files
			margin 0
			padding 0
			background isDark ? #181b23 : var(--primaryLighten98)
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
			background isDark ? #181b23 : var(--primaryLighten98)
			border solid 1px var(--primaryAlpha01)
			border-top none
			border-radius 0 0 4px 4px
			transition border-color .3s ease

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
		cursor pointer
		padding 0
		margin 0
		width 110px
		height 40px
		font-size 1em
		color var(--primaryForeground)
		background linear-gradient(to bottom, var(--primaryLighten25) 0%, var(--primaryLighten10) 100%)
		outline none
		border solid 1px var(--primaryLighten15)
		border-radius 4px

		&:not(:disabled)
			font-weight bold

		&:hover:not(:disabled)
			background linear-gradient(to bottom, var(--primaryLighten8) 0%, var(--primaryDarken8) 100%)
			border-color var(--primary)

		&:active:not(:disabled)
			background var(--primary)
			border-color var(--primary)

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

		&:disabled
			opacity 0.7
			cursor default

		&.wait
			background linear-gradient(
				45deg,
				var(--primaryDarken10) 25%,
				var(--primary)              25%,
				var(--primary)              50%,
				var(--primaryDarken10) 50%,
				var(--primaryDarken10) 75%,
				var(--primary)              75%,
				var(--primary)
			)
			background-size 32px 32px
			animation stripe-bg 1.5s linear infinite
			opacity 0.7
			cursor wait

			@keyframes stripe-bg
				from {background-position: 0 0;}
				to   {background-position: -64px 32px;}

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
	> .geo
	> .visibility
		display inline-block
		cursor pointer
		padding 0
		margin 8px 4px 0 0
		width 40px
		height 40px
		font-size 1em
		color isDark ? var(--primary) : var(--primaryAlpha05)
		background transparent
		outline none
		border solid 1px transparent
		border-radius 4px

		&:hover
			background transparent
			border-color isDark ? var(--primaryAlpha05) : var(--primaryAlpha03)

		&:active
			color var(--primaryAlpha06)
			background isDark ? transparent : linear-gradient(to bottom, var(--primaryLighten80) 0%, var(--primaryLighten90) 100%)
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

.mk-post-form[data-darkmode]
	root(true)

.mk-post-form:not([data-darkmode])
	root(false)

</style>
