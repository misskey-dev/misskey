<template>
<div class="mk-post-form">
	<header>
		<button class="cancel" @click="cancel">%fa:times%</button>
		<div>
			<span v-if="refs.text" class="text-count { over: refs.text.value.length > 1000 }">{ 1000 - refs.text.value.length }</span>
			<button class="submit" @click="post">%i18n:mobile.tags.mk-post-form.submit%</button>
		</div>
	</header>
	<div class="form">
		<mk-post-preview v-if="opts.reply" post={ opts.reply }/>
		<textarea ref="text" disabled={ wait } oninput={ update } onkeydown={ onkeydown } onpaste={ onpaste } placeholder={ opts.reply ? '%i18n:mobile.tags.mk-post-form.reply-placeholder%' : '%i18n:mobile.tags.mk-post-form.post-placeholder%' }></textarea>
		<div class="attaches" show={ files.length != 0 }>
			<ul class="files" ref="attaches">
				<li class="file" each={ files } data-id={ id }>
					<div class="img" style="background-image: url({ url + '?thumbnail&size=128' })" @click="removeFile"></div>
				</li>
			</ul>
		</div>
		<mk-poll-editor v-if="poll" ref="poll" ondestroy={ onPollDestroyed }/>
		<mk-uploader @uploaded="attachMedia" @change="onChangeUploadings"/>
		<button ref="upload" @click="selectFile">%fa:upload%</button>
		<button ref="drive" @click="selectFileFromDrive">%fa:cloud%</button>
		<button class="kao" @click="kao">%fa:R smile%</button>
		<button class="poll" @click="addPoll">%fa:chart-pie%</button>
		<input ref="file" type="file" accept="image/*" multiple="multiple" onchange={ changeFile }/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import Sortable from 'sortablejs';
import getKao from '../../common/scripts/get-kao';

export default Vue.extend({
	data() {
		return {
			posting: false,
			text: '',
			uploadings: [],
			files: [],
			poll: false
		};
	},
	mounted() {
		(this.$refs.text as any).focus();

		new Sortable(this.$refs.attaches, {
			animation: 150
		});
	},
	methods: {
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
			this.$emit('change-attached-media');
		},
		cancel() {
			this.$emit('cancel');
			this.$destroy();
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-post-form
	max-width 500px
	width calc(100% - 16px)
	margin 8px auto
	background #fff
	border-radius 8px
	box-shadow 0 0 0 1px rgba(0, 0, 0, 0.2)

	@media (min-width 500px)
		margin 16px auto
		width calc(100% - 32px)

	> header
		z-index 1
		height 50px
		box-shadow 0 1px 0 0 rgba(0, 0, 0, 0.1)

		> .cancel
			width 50px
			line-height 50px
			font-size 24px
			color #555

		> div
			position absolute
			top 0
			right 0

			> .text-count
				line-height 50px
				color #657786

			> .submit
				margin 8px
				padding 0 16px
				line-height 34px
				color $theme-color-foreground
				background $theme-color
				border-radius 4px

				&:disabled
					opacity 0.7

	> .form
		max-width 500px
		margin 0 auto

		> .mk-post-preview
			padding 16px

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

		> [ref='file']
			display none

		> [ref='text']
			display block
			padding 12px
			margin 0
			width 100%
			max-width 100%
			min-width 100%
			min-height 80px
			font-size 16px
			color #333
			border none
			border-bottom solid 1px #ddd
			border-radius 0

			&:disabled
				opacity 0.5

		> [ref='upload']
		> [ref='drive']
		.kao
		.poll
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

</style>

