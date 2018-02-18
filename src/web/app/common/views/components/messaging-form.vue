<template>
<div>
	<textarea v-model="text" @keypress="onKeypress" @paste="onPaste" placeholder="%i18n:common.input-message-here%"></textarea>
	<div class="files"></div>
	<mk-uploader ref="uploader"/>
	<button class="send" @click="send" :disabled="sending" title="%i18n:common.send%">
		<template v-if="!sending">%fa:paper-plane%</template><template v-if="sending">%fa:spinner .spin%</template>
	</button>
	<button class="attach-from-local" type="button" title="%i18n:common.tags.mk-messaging-form.attach-from-local%">
		%fa:upload%
	</button>
	<button class="attach-from-drive" type="button" title="%i18n:common.tags.mk-messaging-form.attach-from-drive%">
		%fa:R folder-open%
	</button>
	<input name="file" type="file" accept="image/*"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['user'],
	data() {
		return {
			text: null,
			file: null,
			sending: false
		};
	},
	methods: {
		onPaste(e) {
			const data = e.clipboardData;
			const items = data.items;
			for (const item of items) {
				if (item.kind == 'file') {
					this.upload(item.getAsFile());
				}
			}
		},

		onKeypress(e) {
			if ((e.which == 10 || e.which == 13) && e.ctrlKey) {
				this.send();
			}
		},

		chooseFile() {
			(this.$refs.file as any).click();
		},

		chooseFileFromDrive() {
			(this as any).apis.chooseDriveFile({
				multiple: false
			}).then(file => {
				this.file = file;
			});
		},

		upload() {
			// TODO
		}

		send() {
			this.sending = true;
			(this as any).api('messaging/messages/create', {
				user_id: this.user.id,
				text: this.text
			}).then(message => {
				this.clear();
			}).catch(err => {
				console.error(err);
			}).then(() => {
				this.sending = false;
			});
		},

		clear() {
			this.text = '';
			this.files = [];
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-messaging-form
	> textarea
		cursor auto
		display block
		width 100%
		min-width 100%
		max-width 100%
		height 64px
		margin 0
		padding 8px
		font-size 1em
		color #000
		outline none
		border none
		border-top solid 1px #eee
		border-radius 0
		box-shadow none
		background transparent

	> .send
		position absolute
		bottom 0
		right 0
		margin 0
		padding 10px 14px
		line-height 1em
		font-size 1em
		color #aaa
		transition color 0.1s ease

		&:hover
			color $theme-color

		&:active
			color darken($theme-color, 10%)
			transition color 0s ease

	.files
		display block
		margin 0
		padding 0 8px
		list-style none

		&:after
			content ''
			display block
			clear both

		> li
			display block
			float left
			margin 4px
			padding 0
			width 64px
			height 64px
			background-color #eee
			background-repeat no-repeat
			background-position center center
			background-size cover
			cursor move

			&:hover
				> .remove
					display block

			> .remove
				display none
				position absolute
				right -6px
				top -6px
				margin 0
				padding 0
				background transparent
				outline none
				border none
				border-radius 0
				box-shadow none
				cursor pointer

	.attach-from-local
	.attach-from-drive
		margin 0
		padding 10px 14px
		line-height 1em
		font-size 1em
		font-weight normal
		text-decoration none
		color #aaa
		transition color 0.1s ease

		&:hover
			color $theme-color

		&:active
			color darken($theme-color, 10%)
			transition color 0s ease

	input[type=file]
		display none

</style>
