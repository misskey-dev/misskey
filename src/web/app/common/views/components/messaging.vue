<template>
<div class="mk-messaging" :data-compact="compact">
	<div class="search" v-if="!compact" :style="{ top: headerTop + 'px' }">
		<div class="form">
			<label for="search-input">%fa:search%</label>
			<input v-model="q" type="search" @input="search" @keydown="onSearchKeydown" placeholder="%i18n:common.tags.mk-messaging.search-user%"/>
		</div>
		<div class="result">
			<ol class="users" v-if="result.length > 0" ref="searchResult">
				<li v-for="(user, i) in result"
					@keydown.enter="navigate(user)"
					@keydown="onSearchResultKeydown(i)"
					@click="navigate(user)"
					tabindex="-1"
				>
					<img class="avatar" :src="`${user.avatar_url}?thumbnail&size=32`" alt=""/>
					<span class="name">{{ user.name }}</span>
					<span class="username">@{{ getAcct(user) }}</span>
				</li>
			</ol>
		</div>
	</div>
	<div class="history" v-if="messages.length > 0">
		<template>
			<a v-for="message in messages"
				class="user"
				:href="`/i/messaging/${getAcct(isMe(message) ? message.recipient : message.user)}`"
				:data-is-me="isMe(message)"
				:data-is-read="message.is_read"
				@click.prevent="navigate(isMe(message) ? message.recipient : message.user)"
				:key="message.id"
			>
				<div>
					<img class="avatar" :src="`${isMe(message) ? message.recipient.avatar_url : message.user.avatar_url}?thumbnail&size=64`" alt=""/>
					<header>
						<span class="name">{{ isMe(message) ? message.recipient.name : message.user.name }}</span>
						<span class="username">@{{ getAcct(isMe(message) ? message.recipient : message.user) }}</span>
						<mk-time :time="message.created_at"/>
					</header>
					<div class="body">
						<p class="text"><span class="me" v-if="isMe(message)">%i18n:common.tags.mk-messaging.you%:</span>{{ message.text }}</p>
					</div>
				</div>
			</a>
		</template>
	</div>
	<p class="no-history" v-if="!fetching && messages.length == 0">%i18n:common.tags.mk-messaging.no-history%</p>
	<p class="fetching" v-if="fetching">%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import getAcct from '../../../../../common/user/get-acct';

export default Vue.extend({
	props: {
		compact: {
			type: Boolean,
			default: false
		},
		headerTop: {
			type: Number,
			default: 0
		}
	},
	data() {
		return {
			fetching: true,
			moreFetching: false,
			messages: [],
			q: null,
			result: [],
			connection: null,
			connectionId: null
		};
	},
	mounted() {
		this.connection = (this as any).os.streams.messagingIndexStream.getConnection();
		this.connectionId = (this as any).os.streams.messagingIndexStream.use();

		this.connection.on('message', this.onMessage);
		this.connection.on('read', this.onRead);

		(this as any).api('messaging/history').then(messages => {
			this.messages = messages;
			this.fetching = false;
		});
	},
	beforeDestroy() {
		this.connection.off('message', this.onMessage);
		this.connection.off('read', this.onRead);
		(this as any).os.streams.messagingIndexStream.dispose(this.connectionId);
	},
	methods: {
		getAcct,
		isMe(message) {
			return message.user_id == (this as any).os.i.id;
		},
		onMessage(message) {
			this.messages = this.messages.filter(m => !(
				(m.recipient_id == message.recipient_id && m.user_id == message.user_id) ||
				(m.recipient_id == message.user_id && m.user_id == message.recipient_id)));

			this.messages.unshift(message);
		},
		onRead(ids) {
			ids.forEach(id => {
				const found = this.messages.find(m => m.id == id);
				if (found) found.is_read = true;
			});
		},
		search() {
			if (this.q == '') {
				this.result = [];
				return;
			}
			(this as any).api('users/search', {
				query: this.q,
				max: 5
			}).then(users => {
				this.result = users;
			});
		},
		navigate(user) {
			this.$emit('navigate', user);
		},
		onSearchKeydown(e) {
			switch (e.which) {
				case 9: // [TAB]
				case 40: // [↓]
					e.preventDefault();
					e.stopPropagation();
					(this.$refs.searchResult as any).childNodes[0].focus();
					break;
			}
		},
		onSearchResultKeydown(i, e) {
			const list = this.$refs.searchResult as any;

			const cancel = () => {
				e.preventDefault();
				e.stopPropagation();
			};

			switch (true) {
				case e.which == 27: // [ESC]
					cancel();
					(this.$refs.search as any).focus();
					break;

				case e.which == 9 && e.shiftKey: // [TAB] + [Shift]
				case e.which == 38: // [↑]
					cancel();
					(list.childNodes[i].previousElementSibling || list.childNodes[this.result.length - 1]).focus();
					break;

				case e.which == 9: // [TAB]
				case e.which == 40: // [↓]
					cancel();
					(list.childNodes[i].nextElementSibling || list.childNodes[0]).focus();
					break;
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.mk-messaging

	&[data-compact]
		font-size 0.8em

		> .history
			> a
				&:last-child
					border-bottom none

				&:not([data-is-me]):not([data-is-read])
					> div
						background-image none
						border-left solid 4px #3aa2dc

				> div
					padding 16px

					> header
						> .mk-time
							font-size 1em

					> .avatar
						width 42px
						height 42px
						margin 0 12px 0 0

	> .search
		display block
		position -webkit-sticky
		position sticky
		top 0
		left 0
		z-index 1
		width 100%
		background #fff
		box-shadow 0 0px 2px rgba(0, 0, 0, 0.2)

		> .form
			padding 8px
			background #f7f7f7

			> label
				display block
				position absolute
				top 0
				left 8px
				z-index 1
				height 100%
				width 38px
				pointer-events none

				> [data-fa]
					display block
					position absolute
					top 0
					right 0
					bottom 0
					left 0
					width 1em
					line-height 56px
					margin auto
					color #555

			> input
				margin 0
				padding 0 0 0 32px
				width 100%
				font-size 1em
				line-height 38px
				color #000
				outline none
				border solid 1px #eee
				border-radius 5px
				box-shadow none
				transition color 0.5s ease, border 0.5s ease

				&:hover
					border solid 1px #ddd
					transition border 0.2s ease

				&:focus
					color darken($theme-color, 20%)
					border solid 1px $theme-color
					transition color 0, border 0

		> .result
			display block
			top 0
			left 0
			z-index 2
			width 100%
			margin 0
			padding 0
			background #fff

			> .users
				margin 0
				padding 0
				list-style none

				> li
					display inline-block
					z-index 1
					width 100%
					padding 8px 32px
					vertical-align top
					white-space nowrap
					overflow hidden
					color rgba(0, 0, 0, 0.8)
					text-decoration none
					transition none
					cursor pointer

					&:hover
					&:focus
						color #fff
						background $theme-color

						.name
							color #fff

						.username
							color #fff

					&:active
						color #fff
						background darken($theme-color, 10%)

						.name
							color #fff

						.username
							color #fff

					.avatar
						vertical-align middle
						min-width 32px
						min-height 32px
						max-width 32px
						max-height 32px
						margin 0 8px 0 0
						border-radius 6px

					.name
						margin 0 8px 0 0
						/*font-weight bold*/
						font-weight normal
						color rgba(0, 0, 0, 0.8)

					.username
						font-weight normal
						color rgba(0, 0, 0, 0.3)

	> .history

		> a
			display block
			text-decoration none
			background #fff
			border-bottom solid 1px #eee

			*
				pointer-events none
				user-select none

			&:hover
				background #fafafa

				> .avatar
					filter saturate(200%)

			&:active
				background #eee

			&[data-is-read]
			&[data-is-me]
				opacity 0.8

			&:not([data-is-me]):not([data-is-read])
				> div
					background-image url("/assets/unread.svg")
					background-repeat no-repeat
					background-position 0 center

			&:after
				content ""
				display block
				clear both

			> div
				max-width 500px
				margin 0 auto
				padding 20px 30px

				&:after
					content ""
					display block
					clear both

				> header
					display flex
					align-items center
					margin-bottom 2px
					white-space nowrap
					overflow hidden

					> .name
						margin 0
						padding 0
						overflow hidden
						text-overflow ellipsis
						font-size 1em
						color rgba(0, 0, 0, 0.9)
						font-weight bold
						transition all 0.1s ease

					> .username
						margin 0 8px
						color rgba(0, 0, 0, 0.5)

					> .mk-time
						margin 0 0 0 auto
						color rgba(0, 0, 0, 0.5)
						font-size 80%

				> .avatar
					float left
					width 54px
					height 54px
					margin 0 16px 0 0
					border-radius 8px
					transition all 0.1s ease

				> .body

					> .text
						display block
						margin 0 0 0 0
						padding 0
						overflow hidden
						overflow-wrap break-word
						font-size 1.1em
						color rgba(0, 0, 0, 0.8)

						.me
							color rgba(0, 0, 0, 0.4)

					> .image
						display block
						max-width 100%
						max-height 512px

	> .no-history
		margin 0
		padding 2em 1em
		text-align center
		color #999
		font-weight 500

	> .fetching
		margin 0
		padding 16px
		text-align center
		color #aaa

		> [data-fa]
			margin-right 4px

	// TODO: element base media query
	@media (max-width 400px)
		> .search
			> .result
				> .users
					> li
						padding 8px 16px

		> .history
			> a
				&:not([data-is-me]):not([data-is-read])
					> div
						background-image none
						border-left solid 4px #3aa2dc

				> div
					padding 16px
					font-size 14px

					> .avatar
						margin 0 12px 0 0

</style>
