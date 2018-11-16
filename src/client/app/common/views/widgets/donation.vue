<template>
<div>
	<mk-widget-container :show-header="false">
		<article class="dolfvtibguprpxxhfndqaosjitixjohx">
			<h1><fa icon="heart"/>{{ $t('title') }}</h1>
			<p v-if="meta">
				{{ this.$t('text').substr(0, this.$t('text').indexOf('{')) }}
				<a :href="'mailto:' + meta.maintainer.email">{{ meta.maintainer.name }}</a>
				{{ this.$t('text').substr(this.$t('text').indexOf('}') + 1) }}
			</p>
		</article>
	</mk-widget-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
import i18n from '../../../i18n';

export default define({
	name: 'donation'
}).extend({
	i18n: i18n('common/views/widgets/donation.vue'),
	data() {
		return {
			meta: null
		};
	},
	created() {
		this.$root.getMeta().then(meta => {
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

		> [data-icon]
			margin-right 0.25em

	> p
		display block
		z-index 1
		margin 0
		font-size 0.8em

</style>
