<template>
<div class="mkw-server">
	<ui-container :show-header="props.design == 0" :naked="props.design == 2">
		<template #header><fa icon="server"/>{{ $t('title') }}</template>

		<p :class="$style.fetching" v-if="fetching"><fa icon="spinner" pulse fixed-width/>{{ $t('@.loading') }}<mk-ellipsis/></p>
		<template v-if="!fetching">
			<x-info :connection="connection" :meta="meta"/>
		</template>
	</ui-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
import i18n from '../../../i18n';
import XInfo from './server.info.vue';

export default define({
	name: 'server',
	props: () => ({
		design: 0,
	})
}).extend({
	i18n: i18n('common/views/widgets/server.vue'),

	components: {
		XInfo
	},
	data() {
		return {
			fetching: true,
			meta: null,
			connection: null
		};
	},
	mounted() {
		this.$root.getMeta().then(meta => {
			this.meta = meta;
			this.fetching = false;
		});

		this.connection = this.$root.stream.useSharedConnection('serverStats');
	},
	beforeDestroy() {
		this.connection.dispose();
	},
	methods: {
		func() {
			if (this.props.design == 2) {
				this.props.design = 0;
			} else {
				this.props.design++;
			}
			this.save();
		}
	}
});
</script>

<style lang="stylus" module>
.fetching
	margin 0
	padding 16px
	text-align center
	color var(--text)

	> [data-icon]
		margin-right 4px

</style>
