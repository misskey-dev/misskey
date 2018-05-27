<template>
<div class="sub" :title="title">
	<mk-avatar class="avatar" :user="note.user"/>
	<div class="main">
		<header>
			<div class="left">
				<router-link class="name" :to="note.user | userPage" v-user-preview="note.userId">{{ note.user | userName }}</router-link>
				<span class="username"><mk-acct :user="note.user"/></span>
			</div>
			<div class="right">
				<router-link class="time" :to="note | notePage">
					<mk-time :time="note.createdAt"/>
				</router-link>
			</div>
		</header>
		<div class="body">
			<div class="text">
				<span v-if="note.isHidden" style="opacity: 0.5">%i18n:@private%</span>
				<mk-note-html v-if="note.text" :text="note.text" :i="$store.state.i"/>
			</div>
			<div class="media" v-if="note.mediaIds.length > 0">
				<mk-media-list :media-list="note.media"/>
			</div>
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
	margin 0
	padding 20px 32px
	background isDark ? #21242d : #fdfdfd

	&:after
		content ""
		display block
		clear both

	&:hover
		> .main > footer > button
			color #888

	> .avatar
		display block
		float left
		margin 0 16px 0 0
		width 44px
		height 44px
		border-radius 4px

	> .main
		float left
		width calc(100% - 60px)

		> header
			margin-bottom 4px
			white-space nowrap

			&:after
				content ""
				display block
				clear both

			> .left
				float left

				> .name
					display inline
					margin 0
					padding 0
					color isDark ? #fff : #777
					font-size 1em
					font-weight 700
					text-align left
					text-decoration none

					&:hover
						text-decoration underline

				> .username
					text-align left
					margin 0 0 0 8px
					color isDark ? #606984 : #ccc

			> .right
				float right

				> .time
					font-size 0.9em
					color isDark ? #606984 : #c0c0c0

		> .body
			> .text
				cursor default
				display block
				margin 0
				padding 0
				overflow-wrap break-word
				font-size 1em
				color isDark ? #959ba7 : #717171

.sub[data-darkmode]
	root(true)

.sub:not([data-darkmode])
	root(false)

</style>
