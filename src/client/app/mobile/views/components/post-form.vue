<template>
<div class="mk-post-form">
	<div class="form">
		<header>
			<button class="cancel" @click="cancel">%fa:times%</button>
			<div>
				<span class="text-count" :class="{ over: trimmedLength(text) > 1000 }">{{ 1000 - trimmedLength(text) }}</span>
				<span class="geo" v-if="geo">%fa:map-marker-alt%</span>
				<button class="submit" :disabled="!canPost" @click="post">{{ submitText }}</button>
			</div>
		</header>
		<div class="form">
			<mk-note-preview class="preview" v-if="reply" :note="reply"/>
			<mk-note-preview class="preview" v-if="renote" :note="renote"/>
			<div v-if="visibility == 'specified'" class="visibleUsers">
				<span v-for="u in visibleUsers">{{ u | userName }}<a @click="removeVisibleUser(u)">[x]</a></span>
				<a @click="addVisibleUser">+%i18n:@add-visible-user%</a>
			</div>
			<input v-show="useCw" v-model="cw" placeholder="%i18n:@cw-placeholder%">
			<textarea v-model="text" ref="text" :disabled="posting" :placeholder="placeholder" v-autocomplete="'text'"></textarea>
			<div class="attaches" v-show="files.length != 0">
				<x-draggable class="files" :list="files" :options="{ animation: 150 }">
					<div class="file" v-for="file in files" :key="file.id">
						<div class="img" :style="`background-image: url(${file.thumbnailUrl})`" @click="detachMedia(file)"></div>
					</div>
				</x-draggable>
			</div>
			<mk-poll-editor v-if="poll" ref="poll" @destroyed="poll = false"/>
			<mk-uploader ref="uploader" @uploaded="attachMedia" @change="onChangeUploadings"/>
			<footer>
				<button class="upload" @click="chooseFile">%fa:upload%</button>
				<button class="drive" @click="chooseFileFromDrive">%fa:cloud%</button>
				<button class="kao" @click="kao">%fa:R smile%</button>
				<button class="poll" @click="poll = true">%fa:chart-pie%</button>
				<button class="poll" @click="useCw = !useCw">%fa:eye-slash%</button>
				<button class="geo" @click="geo ? removeGeo() : setGeo()">%fa:map-marker-alt%</button>
				<button class="visibility" @click="setVisibility" ref="visibilityButton">
					<span v-if="visibility === 'public'">%fa:globe%</span>
					<span v-if="visibility === 'home'">%fa:home%</span>
					<span v-if="visibility === 'followers'">%fa:unlock%</span>
					<span v-if="visibility === 'specified'">%fa:envelope%</span>
					<span v-if="visibility === 'private'">%fa:lock%</span>
				</button>
			</footer>
			<input ref="file" class="file" type="file" multiple="multiple" @change="onChangeFile"/>
		</div>
	</div>
	<div class="hashtags" v-if="recentHashtags.length > 0 && $store.state.settings.suggestRecentHashtags">
		<a v-for="tag in recentHashtags.slice(0, 5)" @click="addTag(tag)">#{{ tag }}</a>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import insertTextAtCursor from 'insert-text-at-cursor';
import * as XDraggable from 'vuedraggable';
import MkVisibilityChooser from '../../../common/views/components/visibility-chooser.vue';
import getFace from '../../../common/scripts/get-face';
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
			uploadings: [],
			files: [],
			poll: false,
			geo: null,
			visibility: this.$store.state.settings.rememberNoteVisibility ? (this.$store.state.device.visibility || this.$store.state.settings.defaultNoteVisibility) : this.$store.state.settings.defaultNoteVisibility,
			visibleUsers: [],
			useCw: false,
			cw: null,
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
				(this.text.trim().length <= 1000);
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

		// 公開以外へのリプライ時は元の公開範囲を引き継ぐ
		if (this.reply && ['home', 'followers', 'specified', 'private'].includes(this.reply.visibility)) {
			this.visibility = this.reply.visibility;
		}

		// ダイレクトへのリプライはリプライ先ユーザーを初期設定
		if (this.reply && this.reply.visibility === 'specified') {
			(this as any).api('users/show', {	userId: this.reply.userId }).then(user => {
				this.visibleUsers.push(user);
			});
		}

		this.focus();

		this.$nextTick(() => {
			this.focus();
		});
	},

	methods: {
		trimmedLength(text: string) {
			return length(text.trim());
		},

		addTag(tag: string) {
			insertTextAtCursor(this.$refs.text, ` #${tag} `);
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

		detachMedia(file) {
			this.files = this.files.filter(x => x.id != file.id);
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

		setGeo() {
			if (navigator.geolocation == null) {
				alert('%i18n:@location-alert%');
				return;
			}

			navigator.geolocation.getCurrentPosition(pos => {
				this.geo = pos.coords;
			}, err => {
				alert(`%i18n:@error%: ${err.message}`);
			}, {
					enableHighAccuracy: true
				});
		},

		removeGeo() {
			this.geo = null;
		},

		setVisibility() {
			const w = (this as any).os.new(MkVisibilityChooser, {
				source: this.$refs.visibilityButton,
				compact: true
			});
			w.$once('chosen', v => {
				this.visibility = v;
			});
		},

		addVisibleUser() {
			(this as any).apis.input({
				title: '%i18n:@username-prompt%'
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

		clear() {
			this.text = '';
			this.files = [];
			this.poll = false;
			this.$emit('change-attached-files');
		},

		post() {
			this.posting = true;
			const viaMobile = this.$store.state.settings.disableViaMobile !== true;
			(this as any).api('notes/create', {
				text: this.text == '' ? undefined : this.text,
				fileIds: this.files.length > 0 ? this.files.map(f => f.id) : undefined,
				replyId: this.reply ? this.reply.id : undefined,
				renoteId: this.renote ? this.renote.id : undefined,
				poll: this.poll ? (this.$refs.poll as any).get() : undefined,
				cw: this.useCw ? this.cw || '' : undefined,
				geo: this.geo ? {
					coordinates: [this.geo.longitude, this.geo.latitude],
					altitude: this.geo.altitude,
					accuracy: this.geo.accuracy,
					altitudeAccuracy: this.geo.altitudeAccuracy,
					heading: isNaN(this.geo.heading) ? null : this.geo.heading,
					speed: this.geo.speed,
				} : null,
				visibility: this.visibility,
				visibleUserIds: this.visibility == 'specified' ? this.visibleUsers.map(u => u.id) : undefined,
				viaMobile: viaMobile
			}).then(data => {
				this.$emit('posted');
			}).catch(err => {
				this.posting = false;
			});

			if (this.text && this.text != '') {
				const hashtags = parse(this.text).filter(x => x.type == 'hashtag').map(x => x.hashtag);
				const history = JSON.parse(localStorage.getItem('hashtags') || '[]') as string[];
				localStorage.setItem('hashtags', JSON.stringify(unique(hashtags.concat(history))));
			}
		},

		cancel() {
			this.$emit('cancel');
		},

		kao() {
			this.text += getFace();
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-post-form
	max-width 500px
	width calc(100% - 16px)
	margin 8px auto

	@media (min-width 500px)
		margin 16px auto
		width calc(100% - 32px)

		> .form
			box-shadow 0 8px 32px rgba(#000, 0.1)

	@media (min-width 600px)
		margin 32px auto

	> .form
		background var(--face)
		border-radius 8px
		box-shadow 0 0 2px rgba(#000, 0.1)

		> header
			z-index 1000
			height 50px
			box-shadow 0 1px 0 0 var(--mobilePostFormDivider)

			> .cancel
				padding 0
				width 50px
				line-height 50px
				font-size 24px
				color var(--text)

			> div
				position absolute
				top 0
				right 0
				color var(--text)

				> .text-count
					line-height 50px

				> .geo
					margin 0 8px
					line-height 50px

				> .submit
					margin 8px
					padding 0 16px
					line-height 34px
					vertical-align bottom
					color var(--primaryForeground)
					background var(--primary)
					border-radius 4px

					&:disabled
						opacity 0.7

		> .form
			max-width 500px
			margin 0 auto

			> .preview
				padding 16px

			> .visibleUsers
				margin 5px
				font-size 14px

				> span
					margin-right 16px
					color var(--text)

			> input
				z-index 1

			> input
			> textarea
				display block
				padding 12px
				margin 0
				width 100%
				font-size 16px
				color var(--inputText)
				background var(--mobilePostFormTextareaBg)
				border none
				border-radius 0
				box-shadow 0 1px 0 0 var(--mobilePostFormDivider)

				&:disabled
					opacity 0.5

			> textarea
				max-width 100%
				min-width 100%
				min-height 80px

			> .attaches

				> .files
					display block
					margin 0
					padding 4px
					list-style none

					&:after
						content ""
						display block
						clear both

					> .file
						display block
						float left
						margin 0
						padding 0
						border solid 4px transparent

						> .img
							width 64px
							height 64px
							background-size cover
							background-position center center

			> .mk-uploader
				margin 8px 0 0 0
				padding 8px

			> .file
				display none

			> footer
				white-space nowrap
				overflow auto
				-webkit-overflow-scrolling touch
				overflow-scrolling touch

				> *
					display inline-block
					padding 0
					margin 0
					width 48px
					height 48px
					font-size 20px
					color var(--mobilePostFormButton)
					background transparent
					outline none
					border none
					border-radius 0
					box-shadow none

	> .hashtags
		margin 8px

		> *
			margin-right 8px

</style>
