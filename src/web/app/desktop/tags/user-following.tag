<mk-user-following>
	<mk-users-list fetch={ fetch } count={ user.following_count } you-know-count={ user.following_you_know_count } no-users={ 'フォロー中のユーザーはいないようです。' }></mk-users-list>
	<style>
		:scope
			display block
			height 100%

	</style>
	<script>
		this.mixin('api');

		this.user = this.opts.user

		this.fetch = (iknow, limit, cursor, cb) => {
			this.api 'users/following' do
				user_id: @user.id
				iknow: iknow
				limit: limit
				cursor: if cursor? then cursor else undefined
			.then cb
	</script>
</mk-user-following>
