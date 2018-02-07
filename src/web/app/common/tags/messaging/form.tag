<mk-messaging-form>
	<textarea ref="text" onkeypress={ onkeypress } onpaste={ onpaste } placeholder="%i18n:common.input-message-here%"></textarea>
	<div class="files"></div>
	<mk-uploader ref="uploader"/>
	<button class="send" @click="send" disabled={ sending } title="%i18n:common.send%">
		<virtual if={ !sending }>%fa:paper-plane%</virtual><virtual if={ sending }>%fa:spinner .spin%</virtual>
	</button>
	<button class="attach-from-local" type="button" title="%i18n:common.tags.mk-messaging-form.attach-from-local%">
		%fa:upload%
	</button>
	<button class="attach-from-drive" type="button" title="%i18n:common.tags.mk-messaging-form.attach-from-drive%">
		%fa:R folder-open%
	</button>
	<input name="file" type="file" accept="image/*"/>
	<style lang="stylus" scoped>
		:scope
			display block

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
	<script>
		this.mixin('api');

		this.onpaste = e => {
			const data = e.clipboardData;
			const items = data.items;
			for (const item of items) {
				if (item.kind == 'file') {
					this.upload(item.getAsFile());
				}
			}
		};

		this.onkeypress = e => {
			if ((e.which == 10 || e.which == 13) && e.ctrlKey) {
				this.send();
			}
		};

		this.selectFile = () => {
			this.$refs.file.click();
		};

		this.selectFileFromDrive = () => {
			const browser = document.body.appendChild(document.createElement('mk-select-file-from-drive-window'));
			const event = riot.observable();
			riot.mount(browser, {
				multiple: true,
				event: event
			});
			event.one('selected', files => {
				files.forEach(this.addFile);
			});
		};

		this.send = () => {
			this.sending = true;
			this.api('messaging/messages/create', {
				user_id: this.opts.user.id,
				text: this.$refs.text.value
			}).then(message => {
				this.clear();
			}).catch(err => {
				console.error(err);
			}).then(() => {
				this.sending = false;
				this.update();
			});
		};

		this.clear = () => {
			this.$refs.text.value = '';
			this.files = [];
			this.update();
		};
	</script>
</mk-messaging-form>
