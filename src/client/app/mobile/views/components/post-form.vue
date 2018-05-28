<template>
<div class="mk-post-form">
	<header>
		<button class="cancel" @click="cancel">%fa:times%</button>
		<div>
			<span class="text-count" :class="{ over: text.length > 1000 }">{{ 1000 - text.length }}</span>
			<span class="geo" v-if="geo">%fa:map-marker-alt%</span>
			<button class="submit" :disabled="posting" @click="post">{{ submitText }}</button>
		</div>
	</header>
	<div class="form">
		<mk-note-preview v-if="reply" :note="reply"/>
		<mk-note-preview v-if="renote" :note="renote"/>
		<div v-if="visibility == 'specified'" class="visibleUsers">
			<span v-for="u in visibleUsers">{{ u | userName }}<a @click="removeVisibleUser(u)">[x]</a></span>
			<a @click="addVisibleUser">+%i18n:@add-visible-user%</a>
		</div>
		<input v-show="useCw" v-model="cw" placeholder="%i18n:@cw-placeholder%">
		<textarea v-model="text" ref="text" :disabled="posting" :placeholder="placeholder"></textarea>
		<div class="attaches" v-show="files.length != 0">
			<x-draggable class="files" :list="files" :options="{ animation: 150 }">
				<div class="file" v-for="file in files" :key="file.id">
					<div class="img" :style="`background-image: url(${file.url}?thumbnail&size=128)`" @click="detachMedia(file)"></div>
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
			<button class="visibility" @click="setVisibility" ref="visibilityButton">%fa:lock%</button>
		</footer>
		<input ref="file" class="file" type="file" accept="image/*" multiple="multiple" @change="onChangeFile"/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as XDraggable from 'vuedraggable';
import MkVisibilityChooser from '../../../common/views/components/visibility-chooser.vue';
import getKao from '../../../common/scripts/get-kao';
import parse from '../../../../../text/parse';

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
			uploadings: [],
			files: [],
			poll: false,
			geo: null,
			visibility: 'public',
			visibleUsers: [],
			useCw: false,
			cw: null
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
			return !this.posting && (this.text.length != 0 || this.files.length != 0 || this.poll || this.renote);
		}
	},

	mounted() {
		if (this.reply && this.reply.user.host != null) {
			this.text = `@${this.reply.user.username}@${this.reply.user.host} `;
		}

		if (this.reply && this.reply.text != null) {
			const ast = parse(this.reply.text);

			ast.filter(t => t.type == 'mention').forEach(x => {
				const mention = x.host ? `@${x.username}@${x.host}` : `@${x.username}`;

				// 自分は除外
				if (this.$store.state.i.username == x.username && x.host == null) return;

				// 重複は除外
				if (this.text.indexOf(`${mention} `) != -1) return;

				this.text += `${mention} `;
			});
		}

		this.$nextTick(() => {
			this.focus();
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

		detachMedia(file) {
			this.files = this.files.filter(x => x.id != file.id);
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

		setGeo() {
			if (navigator.geolocation == null) {
				alert('%i18n:@location-alert%');
				return;
			}

			navigator.geolocation.getCurrentPosition(pos => {
				this.geo = pos.coords;
			}, err => {
				alert('%i18n:@error%: ' + err.message);
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
				compact: true,
				v: this.visibility
			});
			w.$once('chosen', v => {
				this.visibility = v;
			});
		},

		addVisibleUser() {
			(this as any).apis.input({
				title: '%i18n:@username-prompt%'
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

		clear() {
			this.text = '';
			this.files = [];
			this.poll = false;
			this.$emit('change-attached-media');
		},

		post() {
			this.posting = true;
			const viaMobile = this.$store.state.settings.disableViaMobile !== true;
			(this as any).api('notes/create', {
				text: this.text == '' ? undefined : this.text,
				mediaIds: this.files.length > 0 ? this.files.map(f => f.id) : undefined,
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
				this.$emit('note');
				this.$destroy();
			}).catch(err => {
				this.posting = false;
			});
		},

		cancel() {
			this.$emit('cancel');
			this.$destroy();
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
	max-width 500px
	width calc(100% - 16px)
	margin 8px auto
	background isDark ? #282C37 : #fff
	border-radius 8px
	box-shadow 0 0 2px rgba(#000, 0.1)

	@media (min-width 500px)
		margin 16px auto
		width calc(100% - 32px)
		box-shadow 0 8px 32px rgba(#000, 0.1)

	@media (min-width 600px)
		margin 32px auto

	> header
		z-index 1000
		height 50px
		box-shadow 0 1px 0 0 isDark ? rgba(#000, 0.2) : rgba(#000, 0.1)

		> .cancel
			padding 0
			width 50px
			line-height 50px
			font-size 24px
			color isDark ? #9baec8 : #555

		> div
			position absolute
			top 0
			right 0
			color #657786

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
				color $theme-color-foreground
				background $theme-color
				border-radius 4px

				&:disabled
					opacity 0.7

	> .form
		max-width 500px
		margin 0 auto

		> .mk-note-preview
			padding 16px

		> .visibleUsers
			margin-bottom 8px
			font-size 14px

			> span
				margin-right 16px
				color isDark ? #fff : #666

		> input
			z-index 1

		> input
		> textarea
			display block
			padding 12px
			margin 0
			width 100%
			font-size 16px
			color isDark ? #fff : #333
			background isDark ? #191d23 : #fff
			border none
			border-radius 0
			box-shadow 0 1px 0 0 isDark ? rgba(#000, 0.2) : rgba(#000, 0.1)

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
				color #657786
				background transparent
				outline none
				border none
				border-radius 0
				box-shadow none

.mk-post-form[data-darkmode]
	root(true)

.mk-post-form:not([data-darkmode])
	root(false)

</style>
