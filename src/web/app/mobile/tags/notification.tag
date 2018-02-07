<mk-notification class={ notification.type }>
	<mk-time time={ notification.created_at }/>
	<virtual v-if="notification.type == 'reaction'">
		<a class="avatar-anchor" href={ '/' + notification.user.username }>
			<img class="avatar" src={ notification.user.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
		</a>
		<div class="text">
			<p>
				<mk-reaction-icon reaction={ notification.reaction }/>
				<a href={ '/' + notification.user.username }>{ notification.user.name }</a>
			</p>
			<a class="post-ref" href={ '/' + notification.post.user.username + '/' + notification.post.id }>
				%fa:quote-left%{ getPostSummary(notification.post) }%fa:quote-right%
			</a>
		</div>
	</virtual>
	<virtual v-if="notification.type == 'repost'">
		<a class="avatar-anchor" href={ '/' + notification.post.user.username }>
			<img class="avatar" src={ notification.post.user.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
		</a>
		<div class="text">
			<p>
				%fa:retweet%
				<a href={ '/' + notification.post.user.username }>{ notification.post.user.name }</a>
			</p>
			<a class="post-ref" href={ '/' + notification.post.user.username + '/' + notification.post.id }>
				%fa:quote-left%{ getPostSummary(notification.post.repost) }%fa:quote-right%
			</a>
		</div>
	</virtual>
	<virtual v-if="notification.type == 'quote'">
		<a class="avatar-anchor" href={ '/' + notification.post.user.username }>
			<img class="avatar" src={ notification.post.user.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
		</a>
		<div class="text">
			<p>
				%fa:quote-left%
				<a href={ '/' + notification.post.user.username }>{ notification.post.user.name }</a>
			</p>
			<a class="post-preview" href={ '/' + notification.post.user.username + '/' + notification.post.id }>{ getPostSummary(notification.post) }</a>
		</div>
	</virtual>
	<virtual v-if="notification.type == 'follow'">
		<a class="avatar-anchor" href={ '/' + notification.user.username }>
			<img class="avatar" src={ notification.user.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
		</a>
		<div class="text">
			<p>
				%fa:user-plus%
				<a href={ '/' + notification.user.username }>{ notification.user.name }</a>
			</p>
		</div>
	</virtual>
	<virtual v-if="notification.type == 'reply'">
		<a class="avatar-anchor" href={ '/' + notification.post.user.username }>
			<img class="avatar" src={ notification.post.user.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
		</a>
		<div class="text">
			<p>
				%fa:reply%
				<a href={ '/' + notification.post.user.username }>{ notification.post.user.name }</a>
			</p>
			<a class="post-preview" href={ '/' + notification.post.user.username + '/' + notification.post.id }>{ getPostSummary(notification.post) }</a>
		</div>
	</virtual>
	<virtual v-if="notification.type == 'mention'">
		<a class="avatar-anchor" href={ '/' + notification.post.user.username }>
			<img class="avatar" src={ notification.post.user.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
		</a>
		<div class="text">
			<p>
				%fa:at%
				<a href={ '/' + notification.post.user.username }>{ notification.post.user.name }</a>
			</p>
			<a class="post-preview" href={ '/' + notification.post.user.username + '/' + notification.post.id }>{ getPostSummary(notification.post) }</a>
		</div>
	</virtual>
	<virtual v-if="notification.type == 'poll_vote'">
		<a class="avatar-anchor" href={ '/' + notification.user.username }>
			<img class="avatar" src={ notification.user.avatar_url + '?thumbnail&size=64' } alt="avatar"/>
		</a>
		<div class="text">
			<p>
				%fa:chart-pie%
				<a href={ '/' + notification.user.username }>{ notification.user.name }</a>
			</p>
			<a class="post-ref" href={ '/' + notification.post.user.username + '/' + notification.post.id }>
				%fa:quote-left%{ getPostSummary(notification.post) }%fa:quote-right%
			</a>
		</div>
	</virtual>
	<style lang="stylus" scoped>
		:scope
			display block
			margin 0
			padding 16px
			overflow-wrap break-word

			> mk-time
				display inline
				position absolute
				top 16px
				right 12px
				vertical-align top
				color rgba(0, 0, 0, 0.6)
				font-size 12px

			&:after
				content ""
				display block
				clear both

			.avatar-anchor
				display block
				float left

				img
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

			.post-preview
				color rgba(0, 0, 0, 0.7)

			.post-ref
				color rgba(0, 0, 0, 0.7)

				[data-fa]
					font-size 1em
					font-weight normal
					font-style normal
					display inline-block
					margin-right 3px

			&.repost, &.quote
				.text p i
					color #77B255

			&.follow
				.text p i
					color #53c7ce

			&.reply, &.mention
				.text p i
					color #555

				.post-preview
					color rgba(0, 0, 0, 0.7)

	</style>
	<script>
		import getPostSummary from '../../../../common/get-post-summary.ts';
		this.getPostSummary = getPostSummary;
		this.notification = this.opts.notification;
	</script>
</mk-notification>
