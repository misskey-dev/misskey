<template>
<div class="abunaiaudionankasirankedoichioux" v-if="audio.isSensitive && hide" @click="hide = false">
	<div>
		<b>%fa:exclamation-triangle% %i18n:@sensitive%</b>
		<span>%i18n:@click-to-show%</span>
	</div>
</div>
<div class="komeijiokayusabanomisoniohitashi" v-else>
	<audio class="audio"
		:src="audio.url"
		:title="audio.name"
		controls
		ref="audio" />
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		audio: {
			type: Object,
			required: true
		},
		inlinePlayable: {
			default: false
		},
		hide: {
			type: Boolean,
			default: true
		}
	},
	computed: {
		imageStyle(): any {
			return {
				'background-image': `url(${this.audio.url})`
			};
		}
	}
})
</script>

<style lang="stylus" scoped>
.komeijiokayusabanomisoniohitashi
	.audio
		display block
		width 100%
		height 100%
		border-radius 4px

.abunaiaudionankasirankedoichioux
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
