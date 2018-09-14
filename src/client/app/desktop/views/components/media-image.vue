<template>
<div class="ldwbgwstjsdgcjruamauqdrffetqudry" v-if="image.isSensitive && hide && !$store.state.device.alwaysShowNsfw" @click="hide = false">
	<div>
		<b>%fa:exclamation-triangle% %i18n:@sensitive%</b>
		<span>%i18n:@click-to-show%</span>
	</div>
</div>
<a class="lcjomzwbohoelkxsnuqjiaccdbdfiazy" v-else
	:href="image.url"
	@mousemove="onMousemove"
	@mouseleave="onMouseleave"
	@click.prevent="onClick"
	:style="style"
	:title="image.name"
></a>
</template>

<script lang="ts">
import Vue from 'vue';
import MkMediaImageDialog from './media-image-dialog.vue';

export default Vue.extend({
	props: {
		image: {
			type: Object,
			required: true
		},
		raw: {
			default: false
		},
		hide: {
			type: Boolean,
			default: true
		}
	},
	computed: {
		style(): any {
			return {
				'background-color': this.image.properties.avgColor && this.image.properties.avgColor.length == 3 ? `rgb(${this.image.properties.avgColor.join(',')})` : 'transparent',
				'background-image': this.raw ? `url(${this.image.url})` : `url(${this.image.thumbnailUrl})`
			};
		}
	},
	methods: {
		onMousemove(e) {
			const rect = this.$el.getBoundingClientRect();
			const mouseX = e.clientX - rect.left;
			const mouseY = e.clientY - rect.top;
			const xp = mouseX / this.$el.offsetWidth * 100;
			const yp = mouseY / this.$el.offsetHeight * 100;
			this.$el.style.backgroundPosition = `${xp}% ${yp}%`;
			this.$el.style.backgroundImage = `url("${this.image.url}")`;
		},

		onMouseleave() {
			this.$el.style.backgroundPosition = '';
		},

		onClick() {
			(this as any).os.new(MkMediaImageDialog, {
				image: this.image
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.lcjomzwbohoelkxsnuqjiaccdbdfiazy
	display block
	cursor zoom-in
	overflow hidden
	width 100%
	height 100%
	background-position center

	&:not(:hover)
		background-size cover

.ldwbgwstjsdgcjruamauqdrffetqudry
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
