<template>
<div class="icozogqfvdetwohsdglrbswgrejoxbdj" v-if="video.isSensitive && hide" @click="hide = false">
	<div>
		<b>%fa:exclamation-triangle% %i18n:@sensitive%</b>
		<span>%i18n:@click-to-show%</span>
	</div>
</div>
<a class="kkjnbbplepmiyuadieoenjgutgcmtsvu" v-else
	:href="video.url"
	target="_blank"
	:style="imageStyle"
	:title="video.name"
>
	%fa:R play-circle%
</a>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		video: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			hide: true
		};
	},
	computed: {
		imageStyle(): any {
			return {
				'background-image': null // TODO `url(${this.video.thumbnailUrl})`
			};
		}
	}
});
</script>

<style lang="stylus" scoped>
.kkjnbbplepmiyuadieoenjgutgcmtsvu
	display flex
	justify-content center
	align-items center

	font-size 3.5em
	overflow hidden
	background-position center
	background-size cover
	width 100%
	height 100%

.icozogqfvdetwohsdglrbswgrejoxbdj
	display flex
	justify-content center
	align-items center
	background #111
	color #fff

	> div
		display table-cell
		text-align center
		font-size 12px

		> b
			display block

</style>
