<mk-user-followers>
	<mk-users-list fetch={ fetch } count={ user.followers_count } you-know-count={ user.followers_you_know_count } no-users={ 'フォロワーはいないようです。' }/>
	<style lang="stylus" scoped>
		:scope
			display block
			height 100%

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
	</script>
</mk-user-followers>
