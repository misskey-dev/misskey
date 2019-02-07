<template>
<div class="mk-note-card">
	<a :href="note | notePage">
		<header>
			<img :src="avator" alt="avatar"/>
			<h3><mk-user-name :user="note.user"/></h3>
		</header>
		<div>
			{{ text }}
		</div>
		<mk-time :time="note.createdAt"/>
	</a>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import summary from '../../../../../misc/get-note-summary';
import { getStaticImageUrl } from '../../../common/scripts/get-static-image-url';

export default Vue.extend({
	props: ['note'],
	computed: {
		text(): string {
			return summary(this.note);
		},
		avator(): string {
			return this.$store.state.device.disableShowingAnimatedImages
				? getStaticImageUrl(this.note.user.avatarUrl)
				: this.note.user.avatarUrl;
		},
	}
});
</script>

<style lang="stylus" scoped>
.mk-note-card
	display inline-block
	width 150px
	//height 120px
	font-size 12px
	background var(--face)
	border-radius 4px
	box-shadow 0 2px 8px rgba(0, 0, 0, 0.2)

	> a
		display block
		color var(--noteText)

		&:hover
			text-decoration none

		> header
			> img
				position absolute
				top 8px
				left 8px
				width 28px
				height 28px
				border-radius 6px

			> h3
				display inline-block
				overflow hidden
				width calc(100% - 45px)
				margin 8px 0 0 42px
				line-height 28px
				white-space nowrap
				text-overflow ellipsis
				font-size 12px

		> div
			padding 2px 8px 8px 8px
			height 60px
			overflow hidden
			white-space normal

			&:after
				content ""
				display block
				position absolute
				top 40px
				left 0
				width 100%
				height 20px
				background linear-gradient(to bottom, transparent 0%, var(--face) 100%)

		> .mk-time
			display inline-block
			padding 8px
			color var(--text)

</style>
