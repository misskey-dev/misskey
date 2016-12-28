mk-notifications
	div.notifications(if={ notifications.length != 0 })
		virtual(each={ notification, i in notifications })
			mk-notification(notification={ notification })

			p.date(if={ i != notifications.length - 1 && notification._date != notifications[i + 1]._date })
				span
					i.fa.fa-angle-up
					| { notification._datetext }
				span
					i.fa.fa-angle-down
					| { notifications[i + 1]._datetext }

	p.empty(if={ notifications.length == 0 && !loading })
		| ありません！
	p.loading(if={ loading })
		i.fa.fa-spinner.fa-pulse.fa-fw
		| 読み込んでいます
		mk-ellipsis

style.
	display block
	background #fff

	> .notifications
		margin 0 auto
		max-width 500px

		> mk-notification
			border-bottom solid 1px rgba(0, 0, 0, 0.05)

			&:last-child
				border-bottom none

		> .date
			display block
			margin 0
			line-height 32px
			text-align center
			font-size 0.8em
			color #aaa
			background #fdfdfd
			border-bottom solid 1px rgba(0, 0, 0, 0.05)

			span
				margin 0 16px

			i
				margin-right 8px

	> .empty
		margin 0
		padding 16px
		text-align center
		color #aaa

	> .loading
		margin 0
		padding 16px
		text-align center
		color #aaa

		> i
			margin-right 4px

script.
	@mixin \api
	@mixin \stream
	@mixin \get-post-summary

	@notifications = []
	@loading = true

	@on \mount ~>
		@api \i/notifications
		.then (notifications) ~>
			@notifications = notifications
			@loading = false
			@update!
			@trigger \loaded
		.catch (err, text-status) ->
			console.error err

		@stream.on \notification @on-notification

	@on \unmount ~>
		@stream.off \notification @on-notification

	@on-notification = (notification) ~>
		@notifications.unshift notification
		@update!

	@on \update ~>
		@notifications.for-each (notification) ~>
			date = (new Date notification.created_at).get-date!
			month = (new Date notification.created_at).get-month! + 1
			notification._date = date
			notification._datetext = month + '月 ' + date + '日'
