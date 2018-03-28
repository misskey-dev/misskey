<template>
<div class="mkw-profile">
	<mk-widget-container>
		<div :class="$style.banner"
			:style="os.i.banner_url ? `background-image: url(${os.i.banner_url}?thumbnail&size=256)` : ''"
		></div>
		<img :class="$style.avatar"
			:src="`${os.i.avatar_url}?thumbnail&size=96`"
			alt="avatar"
		/>
		<router-link :class="$style.name" :to="`/@${os.i.username}`">{{ os.i.name }}</router-link>
	</mk-widget-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
export default define({
	name: 'profile'
});
</script>

<style lang="stylus" module>
.banner
	height 100px
	background-color #f5f5f5
	background-size cover
	background-position center
	cursor pointer

.banner:before
	content ""
	display block
	width 100%
	height 100%
	background rgba(0, 0, 0, 0.5)

.avatar
	display block
	position absolute
	width 58px
	height 58px
	margin 0
	vertical-align bottom
	top ((100px - 58px) / 2)
	left ((100px - 58px) / 2)
	border none
	border-radius 100%
	box-shadow 0 0 16px rgba(0, 0, 0, 0.5)

.name
	display block
	position absolute
	top 0
	left 92px
	margin 0
	line-height 100px
	color #fff
	font-weight bold
	text-shadow 0 0 8px rgba(0, 0, 0, 0.5)

</style>
