<mk-signin>
	<form class={ signing: signing } onsubmit={ onsubmit }>
		<label class="user-name">
			<input ref="username" type="text" pattern="^[a-zA-Z0-9-]+$" placeholder="%i18n:common.tags.mk-signin.username%" autofocus="autofocus" required="required" oninput={ oninput }/>%fa:at%
		</label>
		<label class="password">
			<input ref="password" type="password" placeholder="%i18n:common.tags.mk-signin.password%" required="required"/>%fa:lock%
		</label>
		<label class="token" if={ user && user.two_factor_enabled }>
			<input ref="token" type="number" placeholder="%i18n:common.tags.mk-signin.token%" required="required"/>%fa:lock%
		</label>
		<button type="submit" disabled={ signing }>{ signing ? '%i18n:common.tags.mk-signin.signing-in%' : '%i18n:common.tags.mk-signin.signin%' }</button>
	</form>
	<style lang="stylus" scoped>
		:scope
			display block

			> form
				display block
				z-index 2

				&.signing
					&, *
						cursor wait !important

				label
					display block
					margin 12px 0

					[data-fa]
						display block
						pointer-events none
						position absolute
						bottom 0
						top 0
						left 0
						z-index 1
						margin auto
						padding 0 16px
						height 1em
						color #898786

					input[type=text]
					input[type=password]
					input[type=number]
						user-select text
						display inline-block
						cursor auto
						padding 0 0 0 38px
						margin 0
						width 100%
						line-height 44px
						font-size 1em
						color rgba(0, 0, 0, 0.7)
						background #fff
						outline none
						border solid 1px #eee
						border-radius 4px

						&:hover
							background rgba(255, 255, 255, 0.7)
							border-color #ddd

							& + i
								color #797776

						&:focus
							background #fff
							border-color #ccc

							& + i
								color #797776

				[type=submit]
					cursor pointer
					padding 16px
					margin -6px 0 0 0
					width 100%
					font-size 1.2em
					color rgba(0, 0, 0, 0.5)
					outline none
					border none
					border-radius 0
					background transparent
					transition all .5s ease

					&:hover
						color $theme-color
						transition all .2s ease

					&:focus
						color $theme-color
						transition all .2s ease

					&:active
						color darken($theme-color, 30%)
						transition all .2s ease

					&:disabled
						opacity 0.7

	</style>
	<script>
		this.mixin('api');

		this.user = null;
		this.signing = false;

		this.oninput = () => {
			this.api('users/show', {
				username: this.$refs.username.value
			}).then(user => {
				this.user = user;
				this.trigger('user', user);
				this.update();
			});
		};

		this.onsubmit = e => {
			e.preventDefault();

			if (this.$refs.username.value == '') {
				this.$refs.username.focus();
				return false;
			}
			if (this.$refs.password.value == '') {
				this.$refs.password.focus();
				return false;
			}
			if (this.user && this.user.two_factor_enabled && this.$refs.token.value == '') {
				this.$refs.token.focus();
				return false;
			}

			this.update({
				signing: true
			});

			this.api('signin', {
				username: this.$refs.username.value,
				password: this.$refs.password.value,
				token: this.user && this.user.two_factor_enabled ? this.$refs.token.value : undefined
			}).then(() => {
				location.reload();
			}).catch(() => {
				alert('something happened');
				this.update({
					signing: false
				});
			});

			return false;
		};
	</script>
</mk-signin>
