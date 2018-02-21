<template>
<div class="mkw-server" :data-melt="props.design == 2">
	<template v-if="props.design == 0">
		<p class="title">%fa:server%%i18n:desktop.tags.mk-server-home-widget.title%</p>
		<button @click="toggle" title="%i18n:desktop.tags.mk-server-home-widget.toggle%">%fa:sort%</button>
	</template>
	<p class="fetching" v-if="fetching">%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
	<template v-if="!fetching">
		<x-cpu-memory v-show="props.view == 0" :connection="connection"/>
		<x-cpu v-show="props.view == 1" :connection="connection" :meta="meta"/>
		<x-memory v-show="props.view == 2" :connection="connection"/>
		<x-disk v-show="props.view == 3" :connection="connection"/>
		<x-uptimes v-show="props.view == 4" :connection="connection"/>
		<x-info v-show="props.view == 5" :connection="connection" :meta="meta"/>
	</template>
</div>
</template>

<script lang="ts">
import define from '../../../../common/define-widget';
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
			if (this.props.design == 5) {
				this.props.design = 0;
			} else {
				this.props.design++;
			}
		},
		func() {
			this.toggle();
		}
	}
});
</script>

<style lang="stylus" scoped>
.mkw-server
	background #fff
	border solid 1px rgba(0, 0, 0, 0.075)
	border-radius 6px

	&[data-melt]
		background transparent !important
		border none !important

	> .title
		z-index 1
		margin 0
		padding 0 16px
		line-height 42px
		font-size 0.9em
		font-weight bold
		color #888
		box-shadow 0 1px rgba(0, 0, 0, 0.07)

		> [data-fa]
			margin-right 4px

	> button
		position absolute
		z-index 2
		top 0
		right 0
		padding 0
		width 42px
		font-size 0.9em
		line-height 42px
		color #ccc

		&:hover
			color #aaa

		&:active
			color #999

	> .fetching
		margin 0
		padding 16px
		text-align center
		color #aaa

		> [data-fa]
			margin-right 4px

</style>
