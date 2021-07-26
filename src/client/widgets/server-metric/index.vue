<template>
<MkContainer :show-header="props.showHeader" :naked="props.transparent">
	<template #header><i class="fas fa-server"></i>{{ $ts._widgets.serverMetric }}</template>
	<template #func><button @click="toggleView()" class="_button"><i class="fas fa-sort"></i></button></template>

	<div class="mkw-serverMetric" v-if="meta">
		<XCpuMemory v-if="props.view === 0" :connection="connection" :meta="meta"/>
		<XNet v-if="props.view === 1" :connection="connection" :meta="meta"/>
		<XCpu v-if="props.view === 2" :connection="connection" :meta="meta"/>
		<XMemory v-if="props.view === 3" :connection="connection" :meta="meta"/>
		<XDisk v-if="props.view === 4" :connection="connection" :meta="meta"/>
	</div>
</MkContainer>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import define from '../define';
import MkContainer from '@client/components/ui/container.vue';
import XCpuMemory from './cpu-mem.vue';
import XNet from './net.vue';
import XCpu from './cpu.vue';
import XMemory from './mem.vue';
import XDisk from './disk.vue';
import * as os from '@client/os';

const widget = define({
	name: 'serverMetric',
	props: () => ({
		showHeader: {
			type: 'boolean',
			default: true,
		},
		transparent: {
			type: 'boolean',
			default: false,
		},
		view: {
			type: 'number',
			default: 0,
			hidden: true,
		},
	})
});

export default defineComponent({
	extends: widget,
	components: {
		MkContainer,
		XCpuMemory,
		XNet,
		XCpu,
		XMemory,
		XDisk,
	},
	data() {
		return {
			meta: null,
			connection: null,
		};
	},
	created() {
		os.api('server-info', {}).then(res => {
			this.meta = res;
		});
		this.connection = markRaw(os.stream.useChannel('serverStats'));
	},
	unmounted() {
		this.connection.dispose();
	},
	methods: {
		toggleView() {
			if (this.props.view == 4) {
				this.props.view = 0;
			} else {
				this.props.view++;
			}
			this.save();
		},
	}
});
</script>
