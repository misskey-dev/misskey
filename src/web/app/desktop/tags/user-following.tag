<mk-user-following>
	<mk-users-list fetch={ fetch } count={ user.following_count } you-know-count={ user.following_you_know_count } no-users={ 'フォロー中のユーザーはいないようです。' }/>
	<style lang="stylus" scoped>
		:scope
			display block
			height 100%

	</style>
	<script>
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
	</script>
</mk-user-following>
