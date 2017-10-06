<mk-notification-preview class={ notification.type }>
	<virtual if={ notification.type == 'reaction' }>
		<img class="avatar" src={ notification.user.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
		<div class="text">
			<p><mk-reaction-icon reaction={ notification.reaction }/>{ notification.user.name }</p>
			<p class="post-ref">{ getPostSummary(notification.post) }</p>
		</div>
	</virtual>
	<virtual if={ notification.type == 'repost' }>
		<img class="avatar" src={ notification.post.user.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
		<div class="text">
			<p><i class="fa fa-retweet"></i>{ notification.post.user.name }</p>
			<p class="post-ref">{ getPostSummary(notification.post.repost) }</p>
		</div>
	</virtual>
	<virtual if={ notification.type == 'quote' }>
		<img class="avatar" src={ notification.post.user.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
		<div class="text">
			<p><i class="fa fa-quote-left"></i>{ notification.post.user.name }</p>
			<p class="post-preview">{ getPostSummary(notification.post) }</p>
		</div>
	</virtual>
	<virtual if={ notification.type == 'follow' }>
		<img class="avatar" src={ notification.user.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
		<div class="text">
			<p><i class="fa fa-user-plus"></i>{ notification.user.name }</p>
		</div>
	</virtual>
	<virtual if={ notification.type == 'reply' }>
		<img class="avatar" src={ notification.post.user.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
		<div class="text">
			<p><i class="fa fa-reply"></i>{ notification.post.user.name }</p>
			<p class="post-preview">{ getPostSummary(notification.post) }</p>
		</div>
	</virtual>
	<virtual if={ notification.type == 'mention' }>
		<img class="avatar" src={ notification.post.user.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
		<div class="text">
			<p><i class="fa fa-at"></i>{ notification.post.user.name }</p>
			<p class="post-preview">{ getPostSummary(notification.post) }</p>
		</div>
	</virtual>
	<virtual if={ notification.type == 'poll_vote' }>
		<img class="avatar" src={ notification.user.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
		<div class="text">
			<p><i class="fa fa-pie-chart"></i>{ notification.user.name }</p>
			<p class="post-ref">{ getPostSummary(notification.post) }</p>
		</div>
	</virtual>
	<style>
		:scope
			display block
			margin 0
			padding 8px
			color #fff
			overflow-wrap break-word

			&:after
				content ""
				display block
				clear both

			img
				display block
				float left
				min-width 36px
				min-height 36px
				max-width 36px
				max-height 36px
				border-radius 6px

			.text
				float right
				width calc(100% - 36px)
				padding-left 8px

				p
					margin 0

					i, mk-reaction-icon
						margin-right 4px

			.post-ref

				&:before, &:after
					font-family FontAwesome
					font-size 1em
					font-weight normal
					font-style normal
					display inline-block
					margin-right 3px

				&:before
					content "\f10d"

				&:after
					content "\f10e"

			&.repost, &.quote
				.text p i
					color #77B255

			&.follow
				.text p i
					color #53c7ce

			&.reply, &.mention
				.text p i
					color #fff

	</style>
	<script>
		import getPostSummary from '../../../../common/get-post-summary';
		this.getPostSummary = getPostSummary;
		this.notification = this.opts.notification;
	</script>
</mk-notification-preview>
