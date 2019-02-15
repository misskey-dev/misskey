<template>
<div class="mkw-server">
	<ui-container :show-header="props.design == 0" :naked="props.design == 2">
		<template slot="header"><fa icon="server"/>{{ $t('title') }}</template>
		<button slot="func" @click="toggle" :title="$t('toggle')"><fa icon="sort"/></button>

		<p :class="$style.fetching" v-if="fetching"><fa icon="spinner" pulse fixed-width/>{{ $t('@.loading') }}<mk-ellipsis/></p>
		<template v-if="!fetching">
			<x-cpu-memory v-show="props.view == 0" :connection="connection"/>
			<x-cpu v-show="props.view == 1" :connection="connection" :meta="meta"/>
			<x-memory v-show="props.view == 2" :connection="connection"/>
			<x-disk v-show="props.view == 3" :connection="connection"/>
			<x-uptimes v-show="props.view == 4" :connection="connection"/>
			<x-info v-show="props.view == 5" :connection="connection" :meta="meta"/>
		</template>
	</ui-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
import i18n from '../../../i18n';
import XCpuMemory from './server.cpu-memory.vue';
import XCpu from './server.cpu.vue';
import XMemory from './server.memory.vue';
import XDisk from './server.disk.vue';
import XUptimes from './server.uptimes.vue';
import XInfo from './server.info.vue';

export default define({
	name: 'server',
	props: () => ({
		design: 0,
		view: 0
	})
}).extend({
	i18n: i18n('common/views/widgets/server.vue'),

	components: {
		XCpuMemory,
		XCpu,
		XMemory,
		XDisk,
		XUptimes,
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
		toggle() {
			if (this.props.view == 5) {
				this.props.view = 0;
			} else {
				this.props.view++;
			}
			this.save();
		},
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
