<mk-user-profile>
	<div class="friend-form" if={ SIGNIN && I.id != user.id }>
		<mk-big-follow-button user={ user }></mk-big-follow-button>
		<p class="followed" if={ user.is_followed }>フォローされています</p>
	</div>
	<div class="description" if={ user.description }>{ user.description }</div>
	<div class="birthday" if={ user.profile.birthday }>
		<p><i class="fa fa-birthday-cake"></i>{ user.profile.birthday.replace('-', '年').replace('-', '月') + '日' } ({ age(user.profile.birthday) }歳)</p>
	</div>
	<div class="twitter" if={ user.twitter }>
		<p><i class="fa fa-twitter"></i><a href={ 'https://twitter.com/' + user.twitter.screen_name } target="_blank">@{ user.twitter.screen_name }</a></p>
	</div>
	<div class="friends">
		<p class="following"><i class="fa fa-angle-right"></i><a onclick={ showFollowing }>{ user.following_count }</a>人を<b>フォロー</b></p>
		<p class="followers"><i class="fa fa-angle-right"></i><a onclick={ showFollowers }>{ user.followers_count }</a>人の<b>フォロワー</b></p>
	</div>
	<style>
		:scope
			display block
			background #fff

			> *:first-child
				border-top none !important

			> .friend-form
				padding 16px
				border-top solid 1px #eee

				> mk-big-follow-button
					width 100%

				> .followed
					margin 12px 0 0 0
					padding 0
					text-align center
					line-height 24px
					font-size 0.8em
					color #71afc7
					background #eefaff
					border-radius 4px

			> .description
				padding 16px
				color #555
				border-top solid 1px #eee

			> .birthday
				padding 16px
				color #555
				border-top solid 1px #eee

				> p
					margin 0

					> i
						margin-right 8px

			> .twitter
				padding 16px
				color #555
				border-top solid 1px #eee

				> p
					margin 0

					> i
						margin-right 8px

			> .friends
				padding 16px
				color #555
				border-top solid 1px #eee

				> p
					margin 8px 0

					> i
						margin-left 8px
						margin-right 8px

	</style>
	<script>
		this.age = require('s-age'); 

		this.mixin('i');

		this.user = this.opts.user;

		this.showFollowing = () => {
 			riot.mount(document.body.appendChild(document.createElement('mk-user-following-window')), {
				user: this.user
			});
		};

		this.showFollowers = () => {
 			riot.mount(document.body.appendChild(document.createElement('mk-user-followers-window')), {
				user: this.user
			});
		};
	</script>
</mk-user-profile>
