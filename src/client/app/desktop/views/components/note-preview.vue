<template>
<div class="mk-note-preview" :title="title">
	<mk-avatar class="avatar" :user="note.user"/>
	<div class="main">
		<header>
			<router-link class="name" :to="note.user | userPage" v-user-preview="note.userId">{{ note.user | userName }}</router-link>
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
import dateStringify from '../../../common/scripts/date-stringify';

export default Vue.extend({
	props: ['note'],
	computed: {
		title(): string {
			return dateStringify(this.note.createdAt);
		}
	}
});
</script>

<style lang="stylus" scoped>
root(isDark)
	font-size 0.9em

	&:after
		content ""
		display block
		clear both

	> .avatar
		display block
		float left
		margin 0 12px 0 0
		width 48px
		height 48px
		border-radius 8px

	> .main
		float left
		width calc(100% - 68px)

		> header
			display flex
			align-items baseline
			white-space nowrap

			> .name
				margin 0 .5em 0 0
				padding 0
				overflow hidden
				color isDark ? #fff : #607073
				font-size 1em
				font-weight bold
				text-decoration none
				text-overflow ellipsis

				&:hover
					text-decoration underline

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
