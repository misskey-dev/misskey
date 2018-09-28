<template>
<div>
	<mk-widget-container :show-header="false">
		<article class="dolfvtibguprpxxhfndqaosjitixjohx">
			<h1>%fa:heart%%i18n:@title%</h1>
			<p v-if="meta">
				{{ '%i18n:@text%'.substr(0, '%i18n:@text%'.indexOf('{')) }}
				<a :href="meta.maintainer.url">{{ meta.maintainer.name }}</a>
				{{ '%i18n:@text%'.substr('%i18n:@text%'.indexOf('}') + 1) }}
			</p>
		</article>
	</mk-widget-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
export default define({
	name: 'donation'
}).extend({
	data() {
		return {
			meta: null
		};
	},
	created() {
		(this as any).os.getMeta().then(meta => {
			this.meta = meta;
		});
	}
});
</script>

<style lang="stylus" scoped>
.dolfvtibguprpxxhfndqaosjitixjohx
	padding 20px
	background var(--donationBg)
	color var(--donationFg)

	> h1
		margin 0 0 5px 0
		font-size 1em

		> [data-fa]
			margin-right 0.25em

	> p
		display block
		z-index 1
		margin 0
		font-size 0.8em

</style>
