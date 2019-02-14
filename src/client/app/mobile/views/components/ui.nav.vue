<template>
<div class="nav">
	<transition name="back">
		<div class="backdrop"
			v-if="isOpen"
			@click="$parent.isDrawerOpening = false"
			@touchstart="$parent.isDrawerOpening = false"
		></div>
	</transition>
	<transition name="nav">
		<div class="body" v-if="isOpen">
			<router-link class="me" v-if="$store.getters.isSignedIn" :to="`/@${$store.state.i.username}`">
				<img class="avatar" :src="$store.state.i.avatarUrl" alt="avatar"/>
				<p class="name"><mk-user-name :user="$store.state.i"/></p>
			</router-link>
			<div class="links">
				<ul>
					<li><router-link to="/" :data-active="$route.name == 'index'"><i><fa icon="home" fixed-width/></i>{{ $t('timeline') }}<i><fa icon="angle-right"/></i></router-link></li>
					<li><router-link to="/i/notifications" :data-active="$route.name == 'notifications'"><i><fa :icon="['far', 'bell']" fixed-width/></i>{{ $t('notifications') }}<i v-if="hasUnreadNotification" class="circle"><fa icon="circle"/></i><i><fa icon="angle-right"/></i></router-link></li>
					<li><router-link to="/i/messaging" :data-active="$route.name == 'messaging'"><i><fa :icon="['far', 'comments']" fixed-width/></i>{{ $t('@.messaging') }}<i v-if="hasUnreadMessagingMessage" class="circle"><fa icon="circle"/></i><i><fa icon="angle-right"/></i></router-link></li>
					<li v-if="$store.getters.isSignedIn && ($store.state.i.isLocked || $store.state.i.carefulBot)"><router-link to="/i/received-follow-requests" :data-active="$route.name == 'received-follow-requests'"><i><fa :icon="['far', 'envelope']" fixed-width/></i>{{ $t('follow-requests') }}<i v-if="$store.getters.isSignedIn && $store.state.i.pendingReceivedFollowRequestsCount" class="circle"><fa icon="circle"/></i><i><fa icon="angle-right"/></i></router-link></li>
					<li><router-link to="/featured" :data-active="$route.name == 'featured'"><i><fa :icon="faNewspaper" fixed-width/></i>{{ $t('@.featured-notes') }}<i><fa icon="angle-right"/></i></router-link></li>
					<li><router-link to="/games/reversi" :data-active="$route.name == 'reversi'"><i><fa icon="gamepad" fixed-width/></i>{{ $t('game') }}<i v-if="hasGameInvitation" class="circle"><fa icon="circle"/></i><i><fa icon="angle-right"/></i></router-link></li>
				</ul>
				<ul>
					<li><router-link to="/i/widgets" :data-active="$route.name == 'widgets'"><i><fa :icon="['far', 'calendar-alt']" fixed-width/></i>{{ $t('widgets') }}<i><fa icon="angle-right"/></i></router-link></li>
					<li><router-link to="/i/favorites" :data-active="$route.name == 'favorites'"><i><fa icon="star" fixed-width/></i>{{ $t('favorites') }}<i><fa icon="angle-right"/></i></router-link></li>
					<li><router-link to="/i/lists" :data-active="$route.name == 'user-lists'"><i><fa icon="list" fixed-width/></i>{{ $t('user-lists') }}<i><fa icon="angle-right"/></i></router-link></li>
					<li><router-link to="/i/drive" :data-active="$route.name == 'drive'"><i><fa icon="cloud" fixed-width/></i>{{ $t('@.drive') }}<i><fa icon="angle-right"/></i></router-link></li>
				</ul>
				<ul>
					<li><a @click="search"><i><fa icon="search" fixed-width/></i>{{ $t('search') }}<i><fa icon="angle-right"/></i></a></li>
					<li><router-link to="/i/settings" :data-active="$route.name == 'settings'"><i><fa icon="cog" fixed-width/></i>{{ $t('settings') }}<i><fa icon="angle-right"/></i></router-link></li>
					<li v-if="$store.getters.isSignedIn && ($store.state.i.isAdmin || $store.state.i.isModerator)"><a href="/admin"><i><fa icon="terminal" fixed-width/></i><span>{{ $t('admin') }}</span><i><fa icon="angle-right"/></i></a></li>
					<li @click="dark"><p><template v-if="$store.state.device.darkmode"><i><fa icon="moon" fixed-width/></i></template><template v-else><i><fa :icon="['far', 'moon']"/></i></template><span>{{ $t('darkmode') }}</span></p></li>
				</ul>
			</div>
			<div class="announcements" v-if="announcements && announcements.length > 0">
				<article v-for="announcement in announcements">
					<span v-html="announcement.title" class="title"></span>
					<div v-html="announcement.text"></div>
				</article>
			</div>
			<a :href="aboutUrl"><p class="about">{{ $t('about') }}</p></a>
		</div>
	</transition>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { lang } from '../../../config';
import { faNewspaper } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
	i18n: i18n('mobile/views/components/ui.nav.vue'),
	props: ['isOpen'],

	data() {
		return {
			hasGameInvitation: false,
			connection: null,
			aboutUrl: `/docs/${lang}/about`,
			announcements: [],
			searching: false,
			faNewspaper
		};
	},

	computed: {
		hasUnreadNotification(): boolean {
			return this.$store.getters.isSignedIn && this.$store.state.i.hasUnreadNotification;
		},

		hasUnreadMessagingMessage(): boolean {
			return this.$store.getters.isSignedIn && this.$store.state.i.hasUnreadMessagingMessage;
		}
	},

	mounted() {
		this.$root.getMeta().then(meta => {
			this.announcements = meta.broadcasts;
		});

		if (this.$store.getters.isSignedIn) {
			this.connection = this.$root.stream.useSharedConnection('main');

			this.connection.on('reversiInvited', this.onReversiInvited);
			this.connection.on('reversiNoInvites', this.onReversiNoInvites);
		}
	},

	beforeDestroy() {
		if (this.$store.getters.isSignedIn) {
			this.connection.dispose();
		}
	},

	methods: {
		search() {
			if (this.searching) return;

			this.$root.dialog({
				title: this.$t('search'),
				input: true
			}).then(async ({ canceled, result: query }) => {
				if (canceled) return;

				const q = query.trim();
				if (q.startsWith('@')) {
					this.$router.push(`/${q}`);
				} else if (q.startsWith('#')) {
					this.$router.push(`/tags/${encodeURIComponent(q.substr(1))}`);
				} else if (q.startsWith('https://')) {
					this.searching = true;
					try {
						const res = await this.$root.api('ap/show', {
							uri: q
						});
						if (res.type == 'User') {
							this.$router.push(`/@${res.object.username}@${res.object.host}`);
						} else if (res.type == 'Note') {
							this.$router.push(`/notes/${res.object.id}`);
						}
					} catch (e) {
						// TODO
					}
					this.searching = false;
				} else {
					this.$router.push(`/search?q=${encodeURIComponent(q)}`);
				}
			});
		},

		onReversiInvited() {
			this.hasGameInvitation = true;
		},

		onReversiNoInvites() {
			this.hasGameInvitation = false;
		},

		dark() {
			this.$store.commit('device/set', {
				key: 'darkmode',
				value: !this.$store.state.device.darkmode
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.nav
	$color = var(--text)

	.backdrop
		position fixed
		top 0
		left 0
		z-index 1025
		width 100%
		height 100%
		background var(--mobileNavBackdrop)

	.body
		position fixed
		top 0
		left 0
		z-index 1026
		width 240px
		height 100%
		overflow auto
		-webkit-overflow-scrolling touch
		background var(--secondary)
		font-size 15px

	.me
		display block
		margin 0
		padding 16px

		.avatar
			display inline
			max-width 64px
			border-radius 32px
			vertical-align middle

		.name
			display block
			margin 0 16px
			position absolute
			top 0
			left 80px
			padding 0
			width calc(100% - 112px)
			color $color
			line-height 96px
			overflow hidden
			text-overflow ellipsis
			white-space nowrap

	ul
		display block
		margin 16px 0
		padding 0
		list-style none

		&:first-child
			margin-top 0

		&:last-child
			margin-bottom 0

		> li
			display block
			font-size 1em
			line-height 1em

			a, p
				display block
				margin 0
				padding 0 20px
				line-height 3rem
				line-height calc(1rem + 30px)
				color $color
				text-decoration none

				&[data-active]
					color var(--primaryForeground)
					background var(--primary)

					> i:last-child
						color var(--primaryForeground)

				> i:first-child
					margin-right 0.5em
					width 20px
					text-align center

				> i.circle
					margin-left 6px
					font-size 10px
					color var(--notificationIndicator)

				> i:last-child
					position absolute
					top 0
					right 0
					padding 0 20px
					font-size 1.2em
					line-height calc(1rem + 30px)
					color $color
					opacity 0.5

	.announcements
		> article
			background var(--mobileAnnouncement)
			color var(--mobileAnnouncementFg)
			padding 16px
			margin 8px 0
			font-size 12px

			> .title
				font-weight bold

	.about
		margin 0 0 8px 0
		padding 1em 0
		text-align center
		font-size 0.8em
		color $color
		opacity 0.5

.nav-enter-active,
.nav-leave-active {
	opacity: 1;
	transform: translateX(0);
	transition: transform 300ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.nav-enter,
.nav-leave-active {
	opacity: 0;
	transform: translateX(-240px);
}

.back-enter-active,
.back-leave-active {
	opacity: 1;
	transition: opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.back-enter,
.back-leave-active {
	opacity: 0;
}

</style>
