<template>
<div class="sub">
	<router-link class="avatar-anchor" :to="note.user | userPage">
		<img class="avatar" :src="`${note.user.avatarUrl}?thumbnail&size=96`" alt="avatar"/>
	</router-link>
	<div class="main">
		<header>
			<router-link class="name" :to="note.user | userPage">{{ note.user | userName }}</router-link>
			<span class="username">@{{ note.user | acct }}</span>
			<div class="info">
				<span class="mobile" v-if="note.viaMobile">%fa:mobile-alt%</span>
				<router-link class="created-at" :to="note | notePage">
					<mk-time :time="note.createdAt"/>
				</router-link>
				<span class="visibility" v-if="note.visibility != 'public'">
					<template v-if="note.visibility == 'home'">%fa:home%</template>
					<template v-if="note.visibility == 'followers'">%fa:unlock%</template>
					<template v-if="note.visibility == 'specified'">%fa:envelope%</template>
					<template v-if="note.visibility == 'private'">%fa:lock%</template>
				</span>
			</div>
		</header>
		<div class="body">
			<mk-sub-note-content class="text" :note="note"/>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['note']
});
</script>

<style lang="stylus" scoped>
root(isDark)
	padding 16px
	font-size 0.9em
	background isDark ? #21242d : #fcfcfc

	@media (min-width 600px)
		padding 24px 32px

	&:after
		content ""
		display block
		clear both

	> .avatar-anchor
		display block
		float left
		margin 0 10px 0 0

		@media (min-width 500px)
			margin-right 16px

		> .avatar
			display block
			width 44px
			height 44px
			margin 0
			border-radius 8px
			vertical-align bottom

			@media (min-width 500px)
				width 52px
				height 52px

	> .main
		float left
		width calc(100% - 54px)

		@media (min-width 500px)
			width calc(100% - 68px)

		> header
			display flex
			margin-bottom 2px
			white-space nowrap

			> .name
				display block
				margin 0 0.5em 0 0
				padding 0
				overflow hidden
				color isDark ? #fff : #607073
				font-size 1em
				font-weight 700
				text-align left
				text-decoration none
				text-overflow ellipsis

				&:hover
					text-decoration underline

			> .username
				text-align left
				margin 0
				color isDark ? #606984 : #d1d8da

			> .info
				margin-left auto
				font-size 0.9em

				> *
					color isDark ? #606984 : #b2b8bb

				> .mobile
					margin-right 6px

				> .visibility
					margin-left 6px

		> .body
			max-height 128px
			overflow hidden

			> .text
				cursor default
				margin 0
				padding 0
				font-size 1.1em
				color isDark ? #959ba7 : #717171

				pre
					max-height 120px
					font-size 80%

.sub[data-darkmode]
	root(true)

.sub:not([data-darkmode])
	root(false)

</style>
