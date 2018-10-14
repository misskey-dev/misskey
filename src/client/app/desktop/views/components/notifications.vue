<template>
<div class="mk-notifications">
	<div class="placeholder" v-if="fetching">
		<template v-for="i in 10">
			<mk-note-skeleton :key="i"/>
		</template>
	</div>

	<div class="notifications" v-if="notifications.length != 0">
		<!-- トランジションを有効にするとなぜかメモリリークする -->
		<component :is="!$store.state.device.reduceMotion ? 'transition-group' : 'div'" name="mk-notifications" class="transition" tag="div">
			<template v-for="(notification, i) in _notifications">
				<div class="notification" :class="notification.type" :key="notification.id">
					<mk-time :time="notification.createdAt"/>

					<template v-if="notification.type == 'reaction'">
						<mk-avatar class="avatar" :user="notification.user"/>
						<div class="text">
							<p>
								<mk-reaction-icon :reaction="notification.reaction"/>
								<router-link :to="notification.user | userPage" v-user-preview="notification.user.id">{{ notification.user | userName }}</router-link>
							</p>
							<router-link class="note-ref" :to="notification.note | notePage">
								%fa:quote-left%{{ getNoteSummary(notification.note) }}%fa:quote-right%
							</router-link>
						</div>
					</template>

					<template v-if="notification.type == 'renote'">
						<mk-avatar class="avatar" :user="notification.note.user"/>
						<div class="text">
							<p>%fa:retweet%
								<router-link :to="notification.note.user | userPage" v-user-preview="notification.note.userId">{{ notification.note.user | userName }}</router-link>
							</p>
							<router-link class="note-ref" :to="notification.note | notePage">
								%fa:quote-left%{{ getNoteSummary(notification.note.renote) }}%fa:quote-right%
							</router-link>
						</div>
					</template>

					<template v-if="notification.type == 'quote'">
						<mk-avatar class="avatar" :user="notification.note.user"/>
						<div class="text">
							<p>%fa:quote-left%
								<router-link :to="notification.note.user | userPage" v-user-preview="notification.note.userId">{{ notification.note.user | userName }}</router-link>
							</p>
							<router-link class="note-preview" :to="notification.note | notePage">{{ getNoteSummary(notification.note) }}</router-link>
						</div>
					</template>

					<template v-if="notification.type == 'follow'">
						<mk-avatar class="avatar" :user="notification.user"/>
						<div class="text">
							<p>%fa:user-plus%
								<router-link :to="notification.user | userPage" v-user-preview="notification.user.id">{{ notification.user | userName }}</router-link>
							</p>
						</div>
					</template>

					<template v-if="notification.type == 'receiveFollowRequest'">
						<mk-avatar class="avatar" :user="notification.user"/>
						<div class="text">
							<p>%fa:user-clock%
								<router-link :to="notification.user | userPage" v-user-preview="notification.user.id">{{ notification.user | userName }}</router-link>
							</p>
						</div>
					</template>

					<template v-if="notification.type == 'reply'">
						<mk-avatar class="avatar" :user="notification.note.user"/>
						<div class="text">
							<p>%fa:reply%
								<router-link :to="notification.note.user | userPage" v-user-preview="notification.note.userId">{{ notification.note.user | userName }}</router-link>
							</p>
							<router-link class="note-preview" :to="notification.note | notePage">{{ getNoteSummary(notification.note) }}</router-link>
						</div>
					</template>

					<template v-if="notification.type == 'mention'">
						<mk-avatar class="avatar" :user="notification.note.user"/>
						<div class="text">
							<p>%fa:at%
								<router-link :to="notification.note.user | userPage" v-user-preview="notification.note.userId">{{ notification.note.user | userName }}</router-link>
							</p>
							<a class="note-preview" :href="notification.note | notePage">{{ getNoteSummary(notification.note) }}</a>
						</div>
					</template>

					<template v-if="notification.type == 'poll_vote'">
						<mk-avatar class="avatar" :user="notification.user"/>
						<div class="text">
							<p>%fa:chart-pie%<a :href="notification.user | userPage" v-user-preview="notification.user.id">{{ notification.user | userName }}</a></p>
							<router-link class="note-ref" :to="notification.note | notePage">
								%fa:quote-left%{{ getNoteSummary(notification.note) }}%fa:quote-right%
							</router-link>
						</div>
					</template>
				</div>

				<p class="date" v-if="i != notifications.length - 1 && notification._date != _notifications[i + 1]._date" :key="notification.id + '-time'">
					<span>%fa:angle-up%{{ notification._datetext }}</span>
					<span>%fa:angle-down%{{ _notifications[i + 1]._datetext }}</span>
				</p>
			</template>
		</component>
	</div>
	<button class="more" :class="{ fetching: fetchingMoreNotifications }" v-if="moreNotifications" @click="fetchMoreNotifications" :disabled="fetchingMoreNotifications">
		<template v-if="fetchingMoreNotifications">%fa:spinner .pulse .fw%</template>{{ fetchingMoreNotifications ? '%i18n:common.loading%' : '%i18n:@more%' }}
	</button>
	<p class="empty" v-if="notifications.length == 0 && !fetching">%i18n:@empty%</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import getNoteSummary from '../../../../../misc/get-note-summary';

export default Vue.extend({
	data() {
		return {
			fetching: true,
			fetchingMoreNotifications: false,
			notifications: [],
			moreNotifications: false,
			connection: null,
			getNoteSummary
		};
	},

	computed: {
		_notifications(): any[] {
			return (this.notifications as any).map(notification => {
				const date = new Date(notification.createdAt).getDate();
				const month = new Date(notification.createdAt).getMonth() + 1;
				notification._date = date;
				notification._datetext = '%i18n:common.month-and-day%'.replace('{month}', month.toString()).replace('{day}', date.toString());
				return notification;
			});
		}
	},

	mounted() {
		this.connection = (this as any).os.stream.useSharedConnection('main');

		this.connection.on('notification', this.onNotification);

		const max = 10;

		(this as any).api('i/notifications', {
			limit: max + 1
		}).then(notifications => {
			if (notifications.length == max + 1) {
				this.moreNotifications = true;
				notifications.pop();
			}

			this.notifications = notifications;
			this.fetching = false;
		});
	},

	beforeDestroy() {
		this.connection.dispose();
	},

	methods: {
		fetchMoreNotifications() {
			this.fetchingMoreNotifications = true;

			const max = 30;

			(this as any).api('i/notifications', {
				limit: max + 1,
				untilId: this.notifications[this.notifications.length - 1].id
			}).then(notifications => {
				if (notifications.length == max + 1) {
					this.moreNotifications = true;
					notifications.pop();
				} else {
					this.moreNotifications = false;
				}
				this.notifications = this.notifications.concat(notifications);
				this.fetchingMoreNotifications = false;
			});
		},

		onNotification(notification) {
			// TODO: ユーザーが画面を見てないと思われるとき(ブラウザやタブがアクティブじゃないなど)は送信しない
			(this as any).os.stream.send('readNotification', {
				id: notification.id
			});

			this.notifications.unshift(notification);
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-notifications
	.transition
		.mk-notifications-enter
		.mk-notifications-leave-to
			opacity 0
			transform translateY(-30px)

		> *
			transition transform .3s ease, opacity .3s ease

	> .placeholder
		padding 16px
		opacity 0.3

	> .notifications
		> div
			> .notification
				margin 0
				padding 16px
				overflow-wrap break-word
				font-size 13px
				border-bottom solid 1px var(--faceDivider)

				&:last-child
					border-bottom none

				> .mk-time
					display inline
					position absolute
					top 16px
					right 12px
					vertical-align top
					color var(--noteHeaderInfo)
					font-size small

				&:after
					content ""
					display block
					clear both

				> .avatar
					display block
					float left
					position -webkit-sticky
					position sticky
					top 16px
					width 36px
					height 36px
					border-radius 6px

				> .text
					float right
					width calc(100% - 36px)
					padding-left 8px

					p
						margin 0

						i, .mk-reaction-icon
							margin-right 4px

				.note-preview
					color var(--noteText)

				.note-ref
					color var(--noteText)

					[data-fa]
						font-size 1em
						font-weight normal
						font-style normal
						display inline-block
						margin-right 3px

				&.renote, &.quote
					.text p i
						color #77B255

				&.follow
					.text p i
						color #53c7ce

				&.receiveFollowRequest
					.text p i
						color #888

				&.reply, &.mention
					.text p i
						color #555

			> .date
				display block
				margin 0
				line-height 32px
				text-align center
				font-size 0.8em
				color var(--dateDividerFg)
				background var(--dateDividerBg)
				border-bottom solid 1px var(--faceDivider)

				span
					margin 0 16px

				[data-fa]
					margin-right 8px

	> .more
		display block
		width 100%
		padding 16px
		color #555
		border-top solid 1px rgba(#000, 0.05)

		&:hover
			background rgba(#000, 0.025)

		&:active
			background rgba(#000, 0.05)

		&.fetching
			cursor wait

		> [data-fa]
			margin-right 4px

	> .empty
		margin 0
		padding 16px
		text-align center
		color #aaa

</style>
