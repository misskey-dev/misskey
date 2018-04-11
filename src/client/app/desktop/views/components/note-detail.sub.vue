<template>
<div class="sub" :title="title">
	<router-link class="avatar-anchor" :to="note.user | userPage">
		<img class="avatar" :src="`${note.user.avatarUrl}?thumbnail&size=64`" alt="avatar" v-user-preview="note.userId"/>
	</router-link>
	<div class="main">
		<header>
			<div class="left">
				<router-link class="name" :to="note.user | userPage" v-user-preview="note.userId">{{ note.user | userName }}</router-link>
				<span class="username">@{{ note.user | acct }}</span>
			</div>
			<div class="right">
				<router-link class="time" :to="note | notePage">
					<mk-time :time="note.createdAt"/>
				</router-link>
			</div>
		</header>
		<div class="body">
			<mk-note-html v-if="note.text" :text="note.text" :i="os.i" :class="$style.text"/>
			<div class="media" v-if="note.media > 0">
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
.sub
	margin 0
	padding 20px 32px
	background #fdfdfd

	&:after
		content ""
		display block
		clear both

	&:hover
		> .main > footer > button
			color #888

	> .avatar-anchor
		display block
		float left
		margin 0 16px 0 0

		> .avatar
			display block
			width 44px
			height 44px
			margin 0
			border-radius 4px
			vertical-align bottom

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
					color #777
					font-size 1em
					font-weight 700
					text-align left
					text-decoration none

					&:hover
						text-decoration underline

				> .username
					text-align left
					margin 0 0 0 8px
					color #ccc

			> .right
				float right

				> .time
					font-size 0.9em
					color #c0c0c0

</style>

<style lang="stylus" module>
.text
	cursor default
	display block
	margin 0
	padding 0
	overflow-wrap break-word
	font-size 1em
	color #717171
</style>
