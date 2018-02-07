<mk-user-followers>
	<mk-users-list ref="list" fetch={ fetch } count={ user.followers_count } you-know-count={ user.followers_you_know_count } no-users={ '%i18n:mobile.tags.mk-user-followers.no-users%' }/>
	<style lang="stylus" scoped>
		:scope
			display block

	</style>
	<script>
		this.mixin('api');

		this.user = this.opts.user;

		this.fetch = (iknow, limit, cursor, cb) => {
			this.api('users/followers', {
				user_id: this.user.id,
				iknow: iknow,
				limit: limit,
				cursor: cursor ? cursor : undefined
			}).then(cb);
		};

		this.on('mount', () => {
			this.$refs.list.on('loaded', () => {
				this.trigger('loaded');
			});
		});
	</script>
</mk-user-followers>
