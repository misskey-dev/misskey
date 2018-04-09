<template>
<div class="mkw-profile"
	:data-compact="props.design == 1 || props.design == 2"
	:data-melt="props.design == 2"
>
	<div class="banner"
		:style="os.i.bannerUrl ? `background-image: url(${os.i.bannerUrl}?thumbnail&size=256)` : ''"
		title="クリックでバナー編集"
		@click="os.apis.updateBanner"
	></div>
	<img class="avatar"
		:src="`${os.i.avatarUrl}?thumbnail&size=96`"
		@click="os.apis.updateAvatar"
		alt="avatar"
		title="クリックでアバター編集"
		v-user-preview="os.i.id"
	/>
	<router-link class="name" :to="os.i | userPage">{{ os.i | userName }}</router-link>
	<p class="username">@{{ os.i | acct }}</p>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';

export default define({
	name: 'profile',
	props: () => ({
		design: 0
	})
}).extend({
	methods: {
		func() {
			if (this.props.design == 2) {
				this.props.design = 0;
			} else {
				this.props.design++;
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
.mkw-profile
	overflow hidden
	background #fff
	border solid 1px rgba(0, 0, 0, 0.075)
	border-radius 6px

	&[data-compact]
		> .banner:before
			content ""
			display block
			width 100%
			height 100%
			background rgba(0, 0, 0, 0.5)

		> .avatar
			top ((100px - 58px) / 2)
			left ((100px - 58px) / 2)
			border none
			border-radius 100%
			box-shadow 0 0 16px rgba(0, 0, 0, 0.5)

		> .name
			position absolute
			top 0
			left 92px
			margin 0
			line-height 100px
			color #fff
			text-shadow 0 0 8px rgba(0, 0, 0, 0.5)

		> .username
			display none

	&[data-melt]
		background transparent !important
		border none !important

		> .banner
			visibility hidden

		> .avatar
			box-shadow none

		> .name
			color #666
			text-shadow none

	> .banner
		height 100px
		background-color #f5f5f5
		background-size cover
		background-position center
		cursor pointer

	> .avatar
		display block
		position absolute
		top 76px
		left 16px
		width 58px
		height 58px
		margin 0
		border solid 3px #fff
		border-radius 8px
		vertical-align bottom
		cursor pointer

	> .name
		display block
		margin 10px 0 0 84px
		line-height 16px
		font-weight bold
		color #555

	> .username
		display block
		margin 4px 0 8px 84px
		line-height 16px
		font-size 0.9em
		color #999

</style>
