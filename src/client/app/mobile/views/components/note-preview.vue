<template>
<div class="mk-note-preview">
	<router-link class="avatar-anchor" :to="note.user | userPage">
		<img class="avatar" :src="`${note.user.avatarUrl}?thumbnail&size=64`" alt="avatar"/>
	</router-link>
	<div class="main">
		<header>
			<router-link class="name" :to="note.user | userPage">{{ note.user | userName }}</router-link>
			<span class="username">@{{ note.user | acct }}</span>
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

	> .avatar-anchor
		display block
		float left
		margin 0 12px 0 0

		> .avatar
			display block
			width 48px
			height 48px
			margin 0
			border-radius 8px
			vertical-align bottom

	> .main
		float left
		width calc(100% - 60px)

		> header
			display flex
			margin-bottom 4px
			white-space nowrap

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

				&:hover
					text-decoration underline

			> .username
				text-align left
				margin 0 .5em 0 0
				color isDark ? #606984 : #d1d8da

			> .time
				margin-left auto
				color isDark ? #606984 : #b2b8bb

		> .body

			> .text
				cursor default
				margin 0
				padding 0
				font-size 1.1em
				color isDark ? #959ba7 : #717171

.mk-note-preview[data-darkmode]
	root(true)

.mk-note-preview:not([data-darkmode])
	root(false)

</style>
