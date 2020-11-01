<template>
<XWindow ref="window" :initial-width="650" :initial-height="420" :can-resize="true" @closed="$emit('closed')">
	<template #header>
		<Fa :icon="faTerminal" style="margin-right: 0.5em;"/>Task Manager
	</template>
	<div class="qljqmnzj">
		<MkTab v-model:value="tab" :items="[{ label: 'Stream', value: 'stream', }, { label: 'API', value: 'api', }]"/>
		<div v-if="tab === 'stream'" class="stream">
			<div class="header">
				<div>#ID</div>
				<div>Ch</div>
				<div>Handle</div>
				<div>In</div>
				<div>Out</div>
			</div>
			<div v-for="c in connections">
				<div>#{{ c.id }}</div>
				<div>{{ c.channel }}</div>
				<div v-if="c.users !== null">(shared)<span v-if="c.name">{{ ' ' + c.name }}</span></div>
				<div v-else>{{ c.name ? c.name : '<anonymous>' }}</div>
				<div>{{ c.in }}</div>
				<div>{{ c.out }}</div>
			</div>
		</div>
	</div>
</XWindow>
</template>

<script lang="ts">
import { defineComponent, markRaw, onBeforeUnmount, ref } from 'vue';
import { faTerminal } from '@fortawesome/free-solid-svg-icons';
import XWindow from '@/components/ui/window.vue';
import MkTab from '@/components/tab.vue';
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		XWindow,
		MkTab,
		MkButton,
	},

	props: {
	},

	emits: ['closed'],

	setup() {
		const connections = ref([]);
		const refreshStreamInfo = () => {
			console.log(os.stream.sharedConnections, os.stream.nonSharedConnections);
			connections.value = markRaw(os.stream.sharedConnections.map(c => ({
				id: c.id, name: c.name, channel: c.channel, users: c.pool.users, in: c.inCount, out: c.outCount,
			})).concat(os.stream.nonSharedConnections.map(c => ({
				id: c.id, name: c.name, channel: c.channel, users: null, in: c.inCount, out: c.outCount,
			}))));
			connections.value.sort((a, b) => (a.id > b.id) ? 1 : -1);
		};
		const interval = setInterval(refreshStreamInfo, 1000);
		onBeforeUnmount(() => {
			clearInterval(interval);
		});

		return {
			tab: 'stream',
			connections,
			faTerminal,
		};
	},
});
</script>

<style lang="scss" scoped>
.qljqmnzj {
	> .stream {
		display: table;
		width: 100%;
		padding: 8px;
		box-sizing: border-box;

		> div {
			display: table-row;
			font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;

			&.header {
				opacity: 0.7;
			}

			> * {
				display: table-cell;
			}
		}
	}
}
</style>
