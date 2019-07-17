<template>
<div class="mk-notifications">
	<div class="placeholder" v-if="fetching">
		<template v-for="i in 10">
			<mk-note-skeleton :key="i"/>
		</template>
	</div>

	<div class="notifications" v-if="!empty">
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
								<router-link :to="notification.user | userPage" v-user-preview="notification.user.id">
									<mk-user-name :user="notification.user"/>
								</router-link>
							</p>
							<router-link class="note-ref" :to="notification.note | notePage" :title="getNoteSummary(notification.note)">
								<fa icon="quote-left"/>
									<mfm :text="getNoteSummary(notification.note)" :plain="true" :nowrap="true" :custom-emojis="notification.note.emojis"/>
								<fa icon="quote-right"/>
							</router-link>
						</div>
					</template>

					<template v-if="notification.type == 'renote'">
						<mk-avatar class="avatar" :user="notification.note.user"/>
						<div class="text">
							<p><fa icon="retweet"/>
								<router-link :to="notification.note.user | userPage" v-user-preview="notification.note.userId">
									<mk-user-name :user="notification.note.user"/>
								</router-link>
							</p>
							<router-link class="note-ref" :to="notification.note | notePage" :title="getNoteSummary(notification.note.renote)">
								<fa icon="quote-left"/>
									<mfm :text="getNoteSummary(notification.note.renote)" :plain="true" :nowrap="true" :custom-emojis="notification.note.renote.emojis"/>
								<fa icon="quote-right"/>
							</router-link>
						</div>
					</template>

					<template v-if="notification.type == 'quote'">
						<mk-avatar class="avatar" :user="notification.note.user"/>
						<div class="text">
							<p><fa icon="quote-left"/>
								<router-link :to="notification.note.user | userPage" v-user-preview="notification.note.userId">
									<mk-user-name :user="notification.note.user"/>
								</router-link>
							</p>
							<router-link class="note-preview" :to="notification.note | notePage" :title="getNoteSummary(notification.note)">
								<mfm :text="getNoteSummary(notification.note)" :plain="true" :custom-emojis="notification.note.emojis"/>
							</router-link>
						</div>
					</template>

					<template v-if="notification.type == 'follow'">
						<mk-avatar class="avatar" :user="notification.user"/>
						<div class="text">
							<p><fa icon="user-plus"/>
								<router-link :to="notification.user | userPage" v-user-preview="notification.user.id">
									<mk-user-name :user="notification.user"/>
								</router-link>
							</p>
						</div>
					</template>

					<template v-if="notification.type == 'receiveFollowRequest'">
						<mk-avatar class="avatar" :user="notification.user"/>
						<div class="text">
							<p><fa icon="user-clock"/>
								<router-link :to="notification.user | userPage" v-user-preview="notification.user.id">
									<mk-user-name :user="notification.user"/>
								</router-link>
							</p>
						</div>
					</template>

					<template v-if="notification.type == 'reply'">
						<mk-avatar class="avatar" :user="notification.note.user"/>
						<div class="text">
							<p><fa icon="reply"/>
								<router-link :to="notification.note.user | userPage" v-user-preview="notification.note.userId">
									<mk-user-name :user="notification.note.user"/>
								</router-link>
							</p>
							<router-link class="note-preview" :to="notification.note | notePage" :title="getNoteSummary(notification.note)">
								<mfm :text="getNoteSummary(notification.note)" :plain="true" :custom-emojis="notification.note.emojis"/>
							</router-link>
						</div>
					</template>

					<template v-if="notification.type == 'mention'">
						<mk-avatar class="avatar" :user="notification.note.user"/>
						<div class="text">
							<p><fa icon="at"/>
								<router-link :to="notification.note.user | userPage" v-user-preview="notification.note.userId">
									<mk-user-name :user="notification.note.user"/>
								</router-link>
							</p>
							<router-link class="note-preview" :to="notification.note | notePage" :title="getNoteSummary(notification.note)">
								<mfm :text="getNoteSummary(notification.note)" :plain="true" :custom-emojis="notification.note.emojis"/>
							</router-link>
						</div>
					</template>

					<template v-if="notification.type == 'pollVote'">
						<mk-avatar class="avatar" :user="notification.user"/>
						<div class="text">
							<p><fa icon="chart-pie"/><router-link :to="notification.user | userPage" v-user-preview="notification.user.id">
								<mk-user-name :user="notification.user"/>
							</router-link></p>
							<router-link class="note-ref" :to="notification.note | notePage" :title="getNoteSummary(notification.note)">
								<fa icon="quote-left"/>
									<mfm :text="getNoteSummary(notification.note)" :plain="true" :nowrap="true" :custom-emojis="notification.note.emojis"/>
								<fa icon="quote-right"/>
							</router-link>
						</div>
					</template>
				</div>

				<p class="date" v-if="i != items.length - 1 && notification._date != _notifications[i + 1]._date" :key="notification.id + '-time'">
					<span><fa icon="angle-up"/>{{ notification._datetext }}</span>
					<span><fa icon="angle-down"/>{{ _notifications[i + 1]._datetext }}</span>
				</p>
			</template>
		</component>
	</div>
	<button class="more" :class="{ fetching: moreFetching }" v-if="more" @click="fetchMore" :disabled="moreFetching">
		<template v-if="moreFetching"><fa icon="spinner" pulse fixed-width/></template>{{ moreFetching ? $t('@.loading') : $t('@.load-more') }}
	</button>
	<p class="empty" v-if="empty">{{ $t('empty') }}</p>
	<mk-error v-if="error" @retry="init()"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import getNoteSummary from '../../../../../misc/get-note-summary';
import paging from '../../../common/scripts/paging';

export default Vue.extend({
	i18n: i18n(),

	mixins: [
		paging({}),
	],

	data() {
		return {
			connection: null,
			getNoteSummary,
			pagination: {
				endpoint: 'i/notifications',
				limit: 10,
			}
		};
	},

	computed: {
		_notifications(): any[] {
			return (this.items as any).map(notification => {
				const date = new Date(notification.createdAt).getDate();
				const month = new Date(notification.createdAt).getMonth() + 1;
				notification._date = date;
				notification._datetext = this.$t('@.month-and-day').replace('{month}', month.toString()).replace('{day}', date.toString());
				return notification;
			});
		}
	},

	mounted() {
		this.connection = this.$root.stream.useSharedConnection('main');
		this.connection.on('notification', this.onNotification);
	},

	beforeDestroy() {
		this.connection.dispose();
	},

	methods: {
		onNotification(notification) {
			// TODO: ユーザーが画面を見てないと思われるとき(ブラウザやタブがアクティブじゃないなど)は送信しない
			this.$root.stream.send('readNotification', {
				id: notification.id
			});

			this.prepend(notification);
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
				font-size 12px
				border-bottom solid var(--lineWidth) var(--faceDivider)

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

						[data-icon], .mk-reaction-icon
							margin-right 4px

				.note-preview
					color var(--noteText)
					display inline-block
					word-break break-word

				.note-ref
					color var(--noteText)
					display inline-block
					width: 100%
					overflow hidden
					white-space nowrap
					text-overflow ellipsis

					[data-icon]
						font-size 1em
						font-weight normal
						font-style normal
						display inline-block
						margin-right 3px

				&.renote, &.quote
					.text p [data-icon]
						color #77B255

				&.follow
					.text p [data-icon]
						color #53c7ce

				&.receiveFollowRequest
					.text p [data-icon]
						color #888

				&.reply, &.mention
					.text p [data-icon]
						color #555

			> .date
				display block
				margin 0
				line-height 32px
				text-align center
				font-size 0.8em
				color var(--dateDividerFg)
				background var(--dateDividerBg)
				border-bottom solid var(--lineWidth) var(--faceDivider)

				span
					margin 0 16px

				[data-icon]
					margin-right 8px

	> .more
		display block
		width 100%
		padding 16px
		color var(--text)
		border-top solid var(--lineWidth) rgba(#000, 0.05)

		&:hover
			background rgba(#000, 0.025)

		&:active
			background rgba(#000, 0.05)

		&.fetching
			cursor wait

		> [data-icon]
			margin-right 4px

	> .empty
		margin 0
		padding 16px
		text-align center
		color var(--text)

</style>
