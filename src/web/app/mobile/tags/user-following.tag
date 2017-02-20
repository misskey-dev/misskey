<mk-user-following>
	<mk-users-list ref="list" fetch={ fetch } count={ user.following_count } you-know-count={ user.following_you_know_count } no-users={ 'フォロー中のユーザーはいないようです。' }></mk-users-list>
	<style>
		:scope
			display block

	</style>
	<script>
		this.mixin('api');

		this.user = this.opts.user

		this.fetch = (iknow, limit, cursor, cb) => {
			this.api 'users/following' do
				user_id: this.user.id
				iknow: iknow
				limit: limit
				cursor: if cursor? then cursor else undefined
			.then cb

		this.on('mount', () => {
			this.refs.list.on('loaded', () => {
				this.trigger('loaded');
	</script>
</mk-user-following>
