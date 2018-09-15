<template>
<div class="qjewsnkgzzxlxtzncydssfbgjibiehcy" v-if="image.isSensitive && hide && !$store.state.device.alwaysShowNsfw" @click="hide = false">
	<div>
		<b>%fa:exclamation-triangle% %i18n:@sensitive%</b>
		<span>%i18n:@click-to-show%</span>
	</div>
</div>
<a class="gqnyydlzavusgskkfvwvjiattxdzsqlf" v-else :href="image.url" target="_blank" :style="style" :title="image.name"></a>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		image: {
			type: Object,
			required: true
		},
		raw: {
			default: false
		}
	},
	data() {
		return {
			hide: true
		};
	}
	computed: {
		style(): any {
			let url = `url(${this.image.thumbnailUrl})`;

			if (this.$store.state.device.loadRemoteMedia || this.$store.state.device.lightmode) {
				url = null;
			} else if (this.raw || this.$store.state.device.loadRawImages) {
				url = `url(${this.image.url})`;
			}

			return {
				'background-color': this.image.properties.avgColor && this.image.properties.avgColor.length == 3 ? `rgb(${this.image.properties.avgColor.join(',')})` : 'transparent',
				'background-image': url
			};
		}
	}
});
</script>

<style lang="stylus" scoped>
.gqnyydlzavusgskkfvwvjiattxdzsqlf
	display block
	overflow hidden
	width 100%
	height 100%
	background-position center
	background-size cover

.qjewsnkgzzxlxtzncydssfbgjibiehcy
	display flex
	justify-content center
	align-items center
	background #111
	color #fff

	> div
		display table-cell
		text-align center
		font-size 12px

		> *
			display block

</style>
