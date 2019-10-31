<template>
<div class="mk-messaging" :data-compact="compact">
	<div class="search" v-if="!compact" :style="{ top: headerTop + 'px' }">
		<div class="form">
			<label for="search-input"><i><fa icon="search"/></i></label>
			<input v-model="q" type="search" @input="search" @keydown="onSearchKeydown" :placeholder="$t('search-user')"/>
		</div>
		<div class="result">
			<ol class="users" v-if="result.length > 0" ref="searchResult">
				<li v-for="(user, i) in result"
					@keydown.enter="navigate(user)"
					@keydown="onSearchResultKeydown(i)"
					@click="navigate(user)"
					tabindex="-1"
				>
					<mk-avatar class="avatar" :user="user" :key="user.id"/>
					<span class="name"><mk-user-name :user="user" :key="user.id"/></span>
					<span class="username">@{{ user | acct }}</span>
				</li>
			</ol>
		</div>
	</div>
	<div class="history" v-if="messages.length > 0">
		<a v-for="message in messages"
			class="user"
			:href="message.groupId ? `/i/messaging/group/${message.groupId}` : `/i/messaging/${getAcct(isMe(message) ? message.recipient : message.user)}`"
			:data-is-me="isMe(message)"
			:data-is-read="message.groupId ? message.reads.includes($store.state.i.id) : message.isRead"
			@click.prevent="message.groupId ? navigateGroup(message.group) : navigate(isMe(message) ? message.recipient : message.user)"
			:key="message.id"
		>
			<div>
				<mk-avatar class="avatar" :user="message.groupId ? message.user : isMe(message) ? message.recipient : message.user"/>
				<header v-if="message.groupId">
					<span class="name">{{ message.group.name }}</span>
					<mk-time :time="message.createdAt"/>
				</header>
				<header v-else>
					<span class="name"><mk-user-name :user="isMe(message) ? message.recipient : message.user"/></span>
					<span class="username">@{{ isMe(message) ? message.recipient : message.user | acct }}</span>
					<mk-time :time="message.createdAt"/>
				</header>
				<div class="body">
					<p class="text"><span class="me" v-if="isMe(message)">{{ $t('you') }}:</span>{{ message.text }}</p>
				</div>
			</div>
		</a>
	</div>
	<p class="no-history" v-if="!fetching && messages.length == 0">{{ $t('no-history') }}</p>
	<p class="fetching" v-if="fetching"><fa icon="spinner" pulse fixed-width/>{{ $t('@.loading') }}<mk-ellipsis/></p>
	<ui-margin>
		<ui-button @click="startUser()"><fa :icon="faUser"/> {{ $t('start-with-user') }}</ui-button>
		<ui-button @click="startGroup()"><fa :icon="faUsers"/> {{ $t('start-with-group') }}</ui-button>
	</ui-margin>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faUser, faUsers } from '@fortawesome/free-solid-svg-icons';
import i18n from '../../../i18n';
import getAcct from '../../../../../misc/acct/render';

export default Vue.extend({
	i18n: i18n('common/views/components/messaging.vue'),
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
			faUser, faUsers
		};
	},
	mounted() {
		this.connection = this.$root.stream.useSharedConnection('messagingIndex');

		this.connection.on('message', this.onMessage);
		this.connection.on('read', this.onRead);

		this.$root.api('messaging/history', { group: false }).then(userMessages => {
			this.$root.api('messaging/history', { group: true }).then(groupMessages => {
				const messages = userMessages.concat(groupMessages);
				messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
				this.messages = messages;
				this.fetching = false;
			});
		});
	},
	beforeDestroy() {
		this.connection.dispose();
	},
	methods: {
		getAcct,
		isMe(message) {
			return message.userId == this.$store.state.i.id;
		},
		onMessage(message) {
			if (message.recipientId) {
				this.messages = this.messages.filter(m => !(
					(m.recipientId == message.recipientId && m.userId == message.userId) ||
					(m.recipientId == message.userId && m.userId == message.recipientId)));

				this.messages.unshift(message);
			} else if (message.groupId) {
				this.messages = this.messages.filter(m => m.groupId !== message.groupId);
				this.messages.unshift(message);
			}
		},
		onRead(ids) {
			for (const id of ids) {
				const found = this.messages.find(m => m.id == id);
				if (found) {
					if (found.recipientId) {
						found.isRead = true;
					} else if (found.groupId) {
						found.reads.push(this.$store.state.i.id);
					}
				}
			}
		},
		search() {
			if (this.q == '') {
				this.result = [];
				return;
			}
			this.$root.api('users/search', {
				query: this.q,
				localOnly: false,
				limit: 10,
				detail: false
			}).then(users => {
				this.result = users.filter(user => user.id != this.$store.state.i.id);
			});
		},
		navigate(user) {
			this.$emit('navigate', user);
		},
		navigateGroup(group) {
			this.$emit('navigateGroup', group);
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
		},
		async startUser() {
			const { result: user } = await this.$root.dialog({
				user: {
					local: true
				}
			});
			if (user == null) return;
			this.navigate(user);
		},
		async startGroup() {
			const groups1 = await this.$root.api('users/groups/owned');
			const groups2 = await this.$root.api('users/groups/joined');
			const { canceled, result: group } = await this.$root.dialog({
				type: null,
				title: this.$t('select-group'),
				select: {
					items: groups1.concat(groups2).map(group => ({
						value: group, text: group.name
					}))
				},
				showCancelButton: true
			});
			if (canceled) return;
			this.navigateGroup(group);
		}
	}
});
</script>

<style lang="stylus" scoped>
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
		box-shadow 0 0 2px rgba(#000, 0.2)

		> .form
			background rgba(0, 0, 0, 0.02)

			> label
				display block
				position absolute
				top 0
				left 8px
				z-index 1
				height 100%
				width 38px
				pointer-events none

				> i
					display block
					position absolute
					top 0
					right 0
					bottom 0
					left 0
					width 1em
					line-height 48px
					margin auto
					color #555

			> input
				margin 0
				padding 0 0 0 42px
				width 100%
				font-size 1em
				line-height 48px
				color var(--faceText)
				outline none
				background transparent
				border none
				border-radius 5px
				box-shadow none

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
					color rgba(#000, 0.8)
					text-decoration none
					transition none
					cursor pointer

					&:hover
					&:focus
						color #fff
						background var(--primary)

						.name
							color #fff

						.username
							color #fff

					&:active
						color #fff
						background var(--primaryDarken10)

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
						color rgba(#000, 0.8)

					.username
						font-weight normal
						color rgba(#000, 0.3)

	> .history
		> a
			display block
			text-decoration none
			background var(--face)
			border-bottom solid 1px var(--faceDivider)

			*
				pointer-events none
				user-select none

			&:hover
				box-shadow 0 0 0 100px inset rgba(0, 0, 0, 0.05)

				.avatar
					filter saturate(200%)

			&:active
				box-shadow 0 0 0 100px inset rgba(0, 0, 0, 0.1)

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
						color var(--noteHeaderName)
						font-weight bold
						transition all 0.1s ease

					> .username
						margin 0 8px
						color var(--noteHeaderAcct)

					> .mk-time
						margin 0 0 0 auto
						color var(--noteHeaderInfo)
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
						color var(--faceText)

						.me
							opacity 0.7

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
		color var(--text)

		> [data-icon]
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
