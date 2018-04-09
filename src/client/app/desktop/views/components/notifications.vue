<template>
<div class="mk-notifications">
	<div class="notifications" v-if="notifications.length != 0">
		<template v-for="(notification, i) in _notifications">
			<div class="notification" :class="notification.type" :key="notification.id">
				<mk-time :time="notification.createdAt"/>
				<template v-if="notification.type == 'reaction'">
					<router-link class="avatar-anchor" :to="notification.user | userPage" v-user-preview="notification.user.id">
						<img class="avatar" :src="`${notification.user.avatarUrl}?thumbnail&size=48`" alt="avatar"/>
					</router-link>
					<div class="text">
						<p>
							<mk-reaction-icon :reaction="notification.reaction"/>
							<router-link :to="notification.user | userPage" v-user-preview="notification.user.id">{{ notification.user | userName }}</router-link>
						</p>
						<router-link class="note-ref" :to="`/@${getAcct(notification.note.user)}/${notification.note.id}`">
							%fa:quote-left%{{ getNoteSummary(notification.note) }}%fa:quote-right%
						</router-link>
					</div>
				</template>
				<template v-if="notification.type == 'renote'">
					<router-link class="avatar-anchor" :to="notification.note.user | userPage" v-user-preview="notification.note.userId">
						<img class="avatar" :src="`${notification.note.user.avatarUrl}?thumbnail&size=48`" alt="avatar"/>
					</router-link>
					<div class="text">
						<p>%fa:retweet%
							<router-link :to="notification.note.user | userPage" v-user-preview="notification.note.userId">{{ notification.note.user | userName }}</router-link>
						</p>
						<router-link class="note-ref" :to="`/@${getAcct(notification.note.user)}/${notification.note.id}`">
							%fa:quote-left%{{ getNoteSummary(notification.note.renote) }}%fa:quote-right%
						</router-link>
					</div>
				</template>
				<template v-if="notification.type == 'quote'">
					<router-link class="avatar-anchor" :to="notification.note.user | userPage" v-user-preview="notification.note.userId">
						<img class="avatar" :src="`${notification.note.user.avatarUrl}?thumbnail&size=48`" alt="avatar"/>
					</router-link>
					<div class="text">
						<p>%fa:quote-left%
							<router-link :to="notification.note.user | userPage" v-user-preview="notification.note.userId">{{ notification.note.user | userName }}</router-link>
						</p>
						<router-link class="note-preview" :to="`/@${getAcct(notification.note.user)}/${notification.note.id}`">{{ getNoteSummary(notification.note) }}</router-link>
					</div>
				</template>
				<template v-if="notification.type == 'follow'">
					<router-link class="avatar-anchor" :to="notification.user | userPage" v-user-preview="notification.user.id">
						<img class="avatar" :src="`${notification.user.avatarUrl}?thumbnail&size=48`" alt="avatar"/>
					</router-link>
					<div class="text">
						<p>%fa:user-plus%
							<router-link :to="notification.user | userPage" v-user-preview="notification.user.id">{{ notification.user | userName }}</router-link>
						</p>
					</div>
				</template>
				<template v-if="notification.type == 'reply'">
					<router-link class="avatar-anchor" :to="notification.note.user | userPage" v-user-preview="notification.note.userId">
						<img class="avatar" :src="`${notification.note.user.avatarUrl}?thumbnail&size=48`" alt="avatar"/>
					</router-link>
					<div class="text">
						<p>%fa:reply%
							<router-link :to="notification.note.user | userPage" v-user-preview="notification.note.userId">{{ notification.note.user | userName }}</router-link>
						</p>
						<router-link class="note-preview" :to="`/@${getAcct(notification.note.user)}/${notification.note.id}`">{{ getNoteSummary(notification.note) }}</router-link>
					</div>
				</template>
				<template v-if="notification.type == 'mention'">
					<router-link class="avatar-anchor" :to="notification.note.user | userPage" v-user-preview="notification.note.userId">
						<img class="avatar" :src="`${notification.note.user.avatarUrl}?thumbnail&size=48`" alt="avatar"/>
					</router-link>
					<div class="text">
						<p>%fa:at%
							<router-link :to="notification.note.user | userPage" v-user-preview="notification.note.userId">{{ notification.note.user | userName }}</router-link>
						</p>
						<a class="note-preview" :href="`/@${getAcct(notification.note.user)}/${notification.note.id}`">{{ getNoteSummary(notification.note) }}</a>
					</div>
				</template>
				<template v-if="notification.type == 'poll_vote'">
					<router-link class="avatar-anchor" :to="notification.user | userPage" v-user-preview="notification.user.id">
						<img class="avatar" :src="`${notification.user.avatarUrl}?thumbnail&size=48`" alt="avatar"/>
					</router-link>
					<div class="text">
						<p>%fa:chart-pie%<a :href="notification.user | userPage" v-user-preview="notification.user.id">{{ notification.user | userName }}</a></p>
						<router-link class="note-ref" :to="`/@${getAcct(notification.note.user)}/${notification.note.id}`">
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
	</div>
	<button class="more" :class="{ fetching: fetchingMoreNotifications }" v-if="moreNotifications" @click="fetchMoreNotifications" :disabled="fetchingMoreNotifications">
		<template v-if="fetchingMoreNotifications">%fa:spinner .pulse .fw%</template>{{ fetchingMoreNotifications ? '%i18n:common.loading%' : '%i18n:desktop.tags.mk-notifications.more%' }}
	</button>
	<p class="empty" v-if="notifications.length == 0 && !fetching">ありません！</p>
	<p class="loading" v-if="fetching">%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import getNoteSummary from '../../../../../renderers/get-note-summary';

export default Vue.extend({
	data() {
		return {
			fetching: true,
			fetchingMoreNotifications: false,
			notifications: [],
			moreNotifications: false,
			connection: null,
			connectionId: null,
			getNoteSummary
		};
	},
	computed: {
		_notifications(): any[] {
			return (this.notifications as any).map(notification => {
				const date = new Date(notification.createdAt).getDate();
				const month = new Date(notification.createdAt).getMonth() + 1;
				notification._date = date;
				notification._datetext = `${month}月 ${date}日`;
				return notification;
			});
		}
	},
	mounted() {
		this.connection = (this as any).os.stream.getConnection();
		this.connectionId = (this as any).os.stream.use();

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
		this.connection.off('notification', this.onNotification);
		(this as any).os.stream.dispose(this.connectionId);
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
			this.connection.send({
				type: 'read_notification',
				id: notification.id
			});

			this.notifications.unshift(notification);
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-notifications
	> .notifications
		> .notification
			margin 0
			padding 16px
			overflow-wrap break-word
			font-size 0.9em
			border-bottom solid 1px rgba(0, 0, 0, 0.05)

			&:last-child
				border-bottom none

			> .mk-time
				display inline
				position absolute
				top 16px
				right 12px
				vertical-align top
				color rgba(0, 0, 0, 0.6)
				font-size small

			&:after
				content ""
				display block
				clear both

			> .avatar-anchor
				display block
				float left
				position -webkit-sticky
				position sticky
				top 16px

				> img
					display block
					min-width 36px
					min-height 36px
					max-width 36px
					max-height 36px
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
				color rgba(0, 0, 0, 0.7)

			.note-ref
				color rgba(0, 0, 0, 0.7)

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

			&.reply, &.mention
				.text p i
					color #555

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

			[data-fa]
				margin-right 8px

	> .more
		display block
		width 100%
		padding 16px
		color #555
		border-top solid 1px rgba(0, 0, 0, 0.05)

		&:hover
			background rgba(0, 0, 0, 0.025)

		&:active
			background rgba(0, 0, 0, 0.05)

		&.fetching
			cursor wait

		> [data-fa]
			margin-right 4px

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

		> [data-fa]
			margin-right 4px

</style>
