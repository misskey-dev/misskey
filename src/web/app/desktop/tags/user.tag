<mk-user>
	<div class="user" if={ !fetching }>
		<header>
			<mk-user-header user={ user }/>
		</header>
		<div class="body">
			<mk-user-home if={ page == 'home' } user={ user }/>
			<mk-user-graphs if={ page == 'graphs' } user={ user }/>
		</div>
	</div>
	<style>
		:scope
			display block

			> .user
				> header
					max-width 560px + 270px
					margin 0 auto
					padding 0 16px

					> mk-user-header
						border solid 1px rgba(0, 0, 0, 0.075)
						border-top none
						border-radius 0 0 6px 6px
						overflow hidden

				> .body
					max-width 560px + 270px
					margin 0 auto
					padding 0 16px

	</style>
	<script>
		this.mixin('api');

		this.username = this.opts.user;
		this.page = this.opts.page ? this.opts.page : 'home';
		this.fetching = true;
		this.user = null;

		this.on('mount', () => {
			this.api('users/show', {
				username: this.username
			}).then(user => {
				this.update({
					fetching: false,
					user: user
				});
				this.trigger('loaded');
			});
		});
	</script>
</mk-user>
