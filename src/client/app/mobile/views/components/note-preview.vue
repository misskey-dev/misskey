<template>
<div class="mk-note-preview" :class="{ smart: $store.state.device.postStyle == 'smart' }">
	<mk-avatar class="avatar" :user="note.user" v-if="$store.state.device.postStyle != 'smart'"/>
	<div class="main">
		<header>
			<mk-avatar class="avatar" :user="note.user" v-if="$store.state.device.postStyle == 'smart'"/>
			<router-link class="name" :to="note.user | userPage">{{ note.user | userName }}</router-link>
			<span class="is-admin" v-if="note.user.isAdmin">%i18n:@admin%</span>
			<span class="is-bot" v-if="note.user.isBot">%i18n:@bot%</span>
			<span class="is-cat" v-if="note.user.isCat">%i18n:@cat%</span>
			<span class="username"><mk-acct :user="note.user"/></span>
			<router-link class="time" :to="note | notePage">
				<mk-time :time="note.createdAt"/>
			</router-link>
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
	margin 0
	padding 0
	font-size 0.9em

	&:after
		content ""
		display block
		clear both

	&.smart
		> .main
			width 100%

			> header
				align-items center

	> .avatar
		display block
		float left
		margin 0 12px 0 0
		width 48px
		height 48px
		border-radius 8px

		@media (max-width 500px)
			margin 0 10px 0 0
			width 44px
			height 44px

	> .main
		float left
		width calc(100% - 60px)

		> header
			display flex
			align-items baseline
			margin-bottom 2px
			white-space nowrap

			> .avatar
				flex-shrink 0
				margin-right 8px
				width 18px
				height 18px
				border-radius 100%

			> .name
				display block
				margin 0 .5em 0 0
				padding 0
				overflow hidden
				color isDark ? #fff : #607073
				font-size 1em
				font-weight 700
				text-align left
				text-decoration none
				text-overflow ellipsis

			> .is-admin
			> .is-bot
			> .is-cat
				align-self center
				margin 0 0.5em 0 0
				padding 1px 6px
				font-size 10px
				color isDark ? #758188 : #aaa
				border solid 1px isDark ? #57616f : #ddd
				border-radius 3px

				&.is-admin
					border-color isDark ? #d42c41 : #f56a7b
					color isDark ? #d42c41 : #f56a7b

			> .username
				margin 0 .5em 0 0
				overflow hidden
				text-overflow ellipsis
				color isDark ? #606984 : #d1d8da

			> .time
				margin-left auto
				color isDark ? #606984 : #b2b8bb

		> .body

			> .text
				cursor default
				margin 0
				padding 0
				color isDark ? #959ba7 : #717171

.mk-note-preview[data-darkmode]
	root(true)

.mk-note-preview:not([data-darkmode])
	root(false)

</style>
