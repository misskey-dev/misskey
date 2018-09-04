<template>
<div class="ldwbgwstjsdgcjruamauqdrffetqudry" v-if="download.isSensitive && hide" @click="hide = false">
	<div>
		<b>%fa:exclamation-triangle% %i18n:@sensitive%</b>
		<span>%i18n:@click-to-show%</span>
	</div>
</div>
<a class="reiujibreakfastbreadbaconeggnuts" v-else
	:href="download.url"
	:style="style"
	:title="download.name"
	download="{{ download.name }}{{ download.ext }}"
>
	<div>
		<div>%fa:download%</div>
		<div>%i18n:@download%</div>
		<div>{{ download.name }}{{ download.ext }}</div>
	</div>
</a>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		download: {
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
				'background-color': this.download.properties.avgColor && this.download.properties.avgColor.length == 3 ? `rgb(${this.download.properties.avgColor.join(',')})` : 'transparent',
				'background-download': this.raw ? `url(${this.download.url})` : `url(${this.download.thumbnailUrl})`
			};
		}
	}
});
</script>

<style lang="stylus" scoped>
.reiujibreakfastbreadbaconeggnuts
	display flex
	justify-content center
	align-items center

	> div
		display table-cell
		text-align center
		font-size 12px

		> *
			display block

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

		> *
			display block

</style>
