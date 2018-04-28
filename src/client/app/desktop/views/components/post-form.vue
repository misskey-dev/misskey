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
			<a @click="addVisibleUser">+ユーザーを追加</a>
		</div>
		<input v-show="useCw" v-model="cw" placeholder="内容への注釈 (オプション)">
		<textarea :class="{ with: (files.length != 0 || poll) }"
			ref="text" v-model="text" :disabled="posting"
			@keydown="onKeydown" @paste="onPaste" :placeholder="placeholder"
			v-autocomplete="'text'"
		></textarea>
		<div class="medias" :class="{ with: poll }" v-show="files.length != 0">
			<x-draggable :list="files" :options="{ animation: 150 }">
				<div v-for="file in files" :key="file.id">
					<div class="img" :style="{ backgroundImage: `url(${file.url}?thumbnail&size=64)` }" :title="file.name"></div>
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
	<button class="poll" title="%i18n:@create-poll%" @click="poll = true">%fa:chart-pie%</button>
	<button class="poll" title="内容を隠す" @click="useCw = !useCw">%fa:eye-slash%</button>
	<button class="geo" title="位置情報を添付する" @click="geo ? removeGeo() : setGeo()">%fa:map-marker-alt%</button>
	<button class="visibility" title="公開範囲" @click="setVisibility" ref="visibilityButton">%fa:lock%</button>
	<button :class="{ posting }" class="submit" :disabled="!canPost" @click="post">
		{{ posting ? '%i18n:!@posting%' : submitText }}<mk-ellipsis v-if="posting"/>
	</button>
	<input ref="file" type="file" accept="image/*" multiple="multiple" tabindex="-1" @change="onChangeFile"/>
	<div class="dropzone" v-if="draghover"></div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as XDraggable from 'vuedraggable';
import getKao from '../../../common/scripts/get-kao';
import MkVisibilityChooser from '../../../common/views/components/visibility-chooser.vue';

export default Vue.extend({
	components: {
		XDraggable,
		MkVisibilityChooser
	},

	props: ['reply', 'renote'],

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
			visibility: 'public',
			visibleUsers: [],
			autocomplete: null,
			draghover: false
		};
	},

	computed: {
		draftId(): string {
			return this.renote
				? 'renote:' + this.renote.id
				: this.reply
					? 'reply:' + this.reply.id
					: 'note';
		},

		placeholder(): string {
			return this.renote
				? '%i18n:!@quote-placeholder%'
				: this.reply
					? '%i18n:!@reply-placeholder%'
					: '%i18n:!@note-placeholder%';
		},

		submitText(): string {
			return this.renote
				? '%i18n:!@renote%'
				: this.reply
					? '%i18n:!@reply%'
					: '%i18n:!@note%';
		},

		canPost(): boolean {
			return !this.posting && (this.text.length != 0 || this.files.length != 0 || this.poll || this.renote);
		}
	},

	watch: {
		text() {
			this.saveDraft();
		},

		poll() {
			this.saveDraft();
		},

		files() {
			this.saveDraft();
		}
	},

	mounted() {
		this.$nextTick(() => {
			// 書きかけの投稿を復元
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
				this.$emit('change-attached-media', this.files);
			}
		});
	},

	methods: {
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
			this.$emit('change-attached-media', this.files);
		},

		detachMedia(id) {
			this.files = this.files.filter(x => x.id != id);
			this.$emit('change-attached-media', this.files);
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
			this.$emit('change-attached-media', this.files);
		},

		onKeydown(e) {
			if ((e.which == 10 || e.which == 13) && (e.ctrlKey || e.metaKey)) this.post();
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
				this.$emit('change-attached-media', this.files);
				e.preventDefault();
			}
			//#endregion
		},

		setGeo() {
			if (navigator.geolocation == null) {
				alert('お使いの端末は位置情報に対応していません');
				return;
			}

			navigator.geolocation.getCurrentPosition(pos => {
				this.geo = pos.coords;
				this.$emit('geo-attached', this.geo);
			}, err => {
				alert('エラー: ' + err.message);
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
				source: this.$refs.visibilityButton,
				v: this.visibility
			});
			w.$once('chosen', v => {
				this.visibility = v;
			});
		},

		addVisibleUser() {
			(this as any).apis.input({
				title: 'ユーザー名を入力してください'
			}).then(username => {
				(this as any).api('users/show', {
					username
				}).then(user => {
					this.visibleUsers.push(user);
				});
			});
		},

		removeVisibleUser(user) {
			this.visibleUsers = this.visibleUsers.filter(u => u != user);
		},

		post() {
			this.posting = true;

			(this as any).api('notes/create', {
				text: this.text == '' ? undefined : this.text,
				mediaIds: this.files.length > 0 ? this.files.map(f => f.id) : undefined,
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
					? '%i18n:!@reposted%'
					: this.reply
						? '%i18n:!@replied%'
						: '%i18n:!@posted%');
			}).catch(err => {
				(this as any).apis.notify(this.renote
					? '%i18n:!@renote-failed%'
					: this.reply
						? '%i18n:!@reply-failed%'
						: '%i18n:!@note-failed%');
			}).then(() => {
				this.posting = false;
			});
		},

		saveDraft() {
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
			this.text += getKao();
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

root(isDark)
	display block
	padding 16px
	background isDark ? #282C37 : lighten($theme-color, 95%)

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
			color isDark ? #fff : #333
			background isDark ? #191d23 : #fff
			outline none
			border solid 1px rgba($theme-color, 0.1)
			border-radius 4px
			transition border-color .2s ease

			&:hover
				border-color rgba($theme-color, 0.2)
				transition border-color .1s ease

			&:focus
				border-color rgba($theme-color, 0.5)
				transition border-color 0s ease

			&:disabled
				opacity 0.5

			&::-webkit-input-placeholder
				color rgba($theme-color, 0.3)

		> input
			margin-bottom 8px

		> textarea
			margin 0
			max-width 100%
			min-width 100%
			min-height 64px

			&:hover
				& + *
				& + * + *
					border-color rgba($theme-color, 0.2)
					transition border-color .1s ease

			&:focus
				& + *
				& + * + *
					border-color rgba($theme-color, 0.5)
					transition border-color 0s ease

			&.with
				border-bottom solid 1px rgba($theme-color, 0.1) !important
				border-radius 4px 4px 0 0

		> .visibleUsers
			margin-bottom 8px
			font-size 14px

			> span
				margin-right 16px
				color isDark ? #fff : #666

		> .medias
			margin 0
			padding 0
			background isDark ? #181b23 : lighten($theme-color, 98%)
			border solid 1px rgba($theme-color, 0.1)
			border-top none
			border-radius 0 0 4px 4px
			transition border-color .3s ease

			&.with
				border-bottom solid 1px rgba($theme-color, 0.1) !important
				border-radius 0

			> .remain
				display block
				position absolute
				top 8px
				right 8px
				margin 0
				padding 0
				color rgba($theme-color, 0.4)

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
			background isDark ? #181b23 : lighten($theme-color, 98%)
			border solid 1px rgba($theme-color, 0.1)
			border-top none
			border-radius 0 0 4px 4px
			transition border-color .3s ease

	> .mk-uploader
		margin 8px 0 0 0
		padding 8px
		border solid 1px rgba($theme-color, 0.2)
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
		color $theme-color-foreground
		background linear-gradient(to bottom, lighten($theme-color, 25%) 0%, lighten($theme-color, 10%) 100%)
		outline none
		border solid 1px lighten($theme-color, 15%)
		border-radius 4px

		&:not(:disabled)
			font-weight bold

		&:hover:not(:disabled)
			background linear-gradient(to bottom, lighten($theme-color, 8%) 0%, darken($theme-color, 8%) 100%)
			border-color $theme-color

		&:active:not(:disabled)
			background $theme-color
			border-color $theme-color

		&:focus
			&:after
				content ""
				pointer-events none
				position absolute
				top -5px
				right -5px
				bottom -5px
				left -5px
				border 2px solid rgba($theme-color, 0.3)
				border-radius 8px

		&:disabled
			opacity 0.7
			cursor default

		&.wait
			background linear-gradient(
				45deg,
				darken($theme-color, 10%) 25%,
				$theme-color              25%,
				$theme-color              50%,
				darken($theme-color, 10%) 50%,
				darken($theme-color, 10%) 75%,
				$theme-color              75%,
				$theme-color
			)
			background-size 32px 32px
			animation stripe-bg 1.5s linear infinite
			opacity 0.7
			cursor wait

			@keyframes stripe-bg
				from {background-position: 0 0;}
				to   {background-position: -64px 32px;}

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
		color isDark ? $theme-color : rgba($theme-color, 0.5)
		background transparent
		outline none
		border solid 1px transparent
		border-radius 4px

		&:hover
			background transparent
			border-color isDark ? rgba($theme-color, 0.5) : rgba($theme-color, 0.3)

		&:active
			color rgba($theme-color, 0.6)
			background isDark ? transparent : linear-gradient(to bottom, lighten($theme-color, 80%) 0%, lighten($theme-color, 90%) 100%)
			border-color rgba($theme-color, 0.5)
			box-shadow 0 2px 4px rgba(0, 0, 0, 0.15) inset

		&:focus
			&:after
				content ""
				pointer-events none
				position absolute
				top -5px
				right -5px
				bottom -5px
				left -5px
				border 2px solid rgba($theme-color, 0.3)
				border-radius 8px

	> .dropzone
		position absolute
		left 0
		top 0
		width 100%
		height 100%
		border dashed 2px rgba($theme-color, 0.5)
		pointer-events none

.mk-post-form[data-darkmode]
	root(true)

.mk-post-form:not([data-darkmode])
	root(false)

</style>
