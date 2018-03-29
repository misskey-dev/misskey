<template>
<div class="mkw-server">
	<mk-widget-container :show-header="props.design == 0" :naked="props.design == 2">
		<template slot="header">%fa:server%%i18n:desktop.tags.mk-server-home-widget.title%</template>
		<button slot="func" @click="toggle" title="%i18n:desktop.tags.mk-server-home-widget.toggle%">%fa:sort%</button>

		<p :class="$style.fetching" v-if="fetching">%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
		<template v-if="!fetching">
			<x-cpu-memory v-show="props.view == 0" :connection="connection"/>
			<x-cpu v-show="props.view == 1" :connection="connection" :meta="meta"/>
			<x-memory v-show="props.view == 2" :connection="connection"/>
			<x-disk v-show="props.view == 3" :connection="connection"/>
			<x-uptimes v-show="props.view == 4" :connection="connection"/>
			<x-info v-show="props.view == 5" :connection="connection" :meta="meta"/>
		</template>
	</mk-widget-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
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
			connection: null,
			connectionId: null
		};
	},
	mounted() {
		(this as any).os.getMeta().then(meta => {
			this.meta = meta;
			this.fetching = false;
		});

		this.connection = (this as any).os.streams.serverStream.getConnection();
		this.connectionId = (this as any).os.streams.serverStream.use();
	},
	beforeDestroy() {
		(this as any).os.streams.serverStream.dispose(this.connectionId);
	},
	methods: {
		toggle() {
			if (this.props.view == 5) {
				this.props.view = 0;
			} else {
				this.props.view++;
			}
		},
		func() {
			if (this.props.design == 2) {
				this.props.design = 0;
			} else {
				this.props.design++;
			}
		}
	}
});
</script>

<style lang="stylus" module>
.fetching
	margin 0
	padding 16px
	text-align center
	color #aaa

	> [data-fa]
		margin-right 4px

</style>
