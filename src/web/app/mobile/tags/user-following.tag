<mk-user-following>
	<mk-users-list ref="list" fetch={ fetch } count={ user.following_count } you-know-count={ user.following_you_know_count } no-users={ '%i18n:mobile.tags.mk-user-following.no-users%' }/>
	<style lang="stylus" scoped>
		:scope
			display block

	</style>
	<script lang="typescript">
		this.mixin('api');

		this.user = this.opts.user;

		this.fetch = (iknow, limit, cursor, cb) => {
			this.api('users/following', {
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
</mk-user-following>
