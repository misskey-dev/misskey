<template>
<XWindow ref="window" :initial-width="650" :initial-height="420" :can-resize="true" @closed="$emit('closed')">
	<template #header>
		<Fa :icon="faTerminal" style="margin-right: 0.5em;"/>Task Manager
	</template>
	<div class="qljqmnzj">
		<MkTab v-model:value="tab" :items="[{ label: 'Windows', value: 'windows', }, { label: 'Stream', value: 'stream', }, { label: 'Stream (Pool)', value: 'streamPool', }, { label: 'API', value: 'api', }]" style="border-bottom: solid 1px var(--divider);"/>

		<div class="content">
			<div v-if="tab === 'windows'" class="windows" v-follow>
				<div class="header">
					<div>#ID</div>
					<div>Component</div>
					<div>Action</div>
				</div>
				<div v-for="p in popups">
					<div>#{{ p.id }}</div>
					<div>{{ p.component.name ? p.component.name : '<anonymous>' }}</div>
					<div><button class="_textButton" @click="killPopup(p)">Kill</button></div>
				</div>
			</div>
			<div v-if="tab === 'stream'" class="stream" v-follow>
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
			<div v-if="tab === 'streamPool'" class="streamPool" v-follow>
				<div class="header">
					<div>#ID</div>
					<div>Ch</div>
					<div>Users</div>
				</div>
				<div v-for="p in pools">
					<div>#{{ p.id }}</div>
					<div>{{ p.channel }}</div>
					<div>{{ p.users }}</div>
				</div>
			</div>
			<div v-if="tab === 'api'" class="api" v-follow>
				<div class="header">
					<div>#ID</div>
					<div>Endpoint</div>
					<div>State</div>
				</div>
				<div v-for="req in apiRequests" @click="showReq(req)">
					<div>#{{ req.id }}</div>
					<div>{{ req.endpoint }}</div>
					<div class="state" :class="req.state">{{ req.state }}</div>
				</div>
			</div>
		</div>

		<footer>
			<div><span class="label">Windows</span>{{ popups.length }}</div>
			<div><span class="label">Stream</span>{{ connections.length }}</div>
			<div><span class="label">Stream (Pool)</span>{{ pools.length }}</div>
		</footer>
	</div>
</XWindow>
</template>

<script lang="ts">
import { defineComponent, markRaw, onBeforeUnmount, ref, shallowRef } from 'vue';
import { faTerminal } from '@fortawesome/free-solid-svg-icons';
import XWindow from '@/components/ui/window.vue';
import MkTab from '@/components/tab.vue';
import MkButton from '@/components/ui/button.vue';
import follow from '@/directives/follow-append';
import * as os from '@/os';

export default defineComponent({
	components: {
		XWindow,
		MkTab,
		MkButton,
	},

	directives: {
		follow
	},

	props: {
	},

	emits: ['closed'],

	setup() {
		const connections = shallowRef([]);
		const pools = shallowRef([]);
		const refreshStreamInfo = () => {
			console.log(os.stream.sharedConnectionPools, os.stream.sharedConnections, os.stream.nonSharedConnections);
			const conn = os.stream.sharedConnections.map(c => ({
				id: c.id, name: c.name, channel: c.channel, users: c.pool.users, in: c.inCount, out: c.outCount,
			})).concat(os.stream.nonSharedConnections.map(c => ({
				id: c.id, name: c.name, channel: c.channel, users: null, in: c.inCount, out: c.outCount,
			})));
			conn.sort((a, b) => (a.id > b.id) ? 1 : -1);
			connections.value = conn;
			pools.value = os.stream.sharedConnectionPools;
		};
		const interval = setInterval(refreshStreamInfo, 1000);
		onBeforeUnmount(() => {
			clearInterval(interval);
		});

		const killPopup = p => {
			os.popups.value = os.popups.value.filter(x => x !== p);
		};

		const showReq = async req => {
			os.popup(await import('./taskmanager.api-window.vue'), {
				req: req
			}, {
			}, 'closed');
		};

		return {
			tab: ref('stream'),
			popups: os.popups,
			apiRequests: os.apiRequests,
			connections,
			pools,
			killPopup,
			showReq,
			faTerminal,
		};
	},
});
</script>

<style lang="scss" scoped>
.qljqmnzj {
	display: flex;
	flex-direction: column;
	height: 100%;
	font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;

	> .content {
		flex: 1;
		overflow: auto;

		> div {
			display: table;
			width: 100%;
			padding: 16px;
			box-sizing: border-box;

			> div {
				display: table-row;

				&:nth-child(even) {
					//background: rgba(0, 0, 0, 0.1);
				}

				&.header {
					opacity: 0.7;
				}

				> div {
					display: table-cell;
					white-space: nowrap;

					&:not(:last-child) {
						padding-right: 8px;
					}
				}
			}

			&.api {
				> div {
					> .state {
						&.pending {
							color: var(--warn);
						}

						&.success {
							color: var(--success);
						}

						&.failed {
							color: var(--error);
						}
					}
				}
			}
		}
	}

	> footer {
		display: flex;
		width: 100%;
		padding: 8px 16px;
		box-sizing: border-box;
		border-top: solid 1px var(--divider);
		font-size: 0.9em;

		> div {
			flex: 1;

			> .label {
				opacity: 0.7;
				margin-right: 0.5em;

				&:after {
					content: ":";
				}
			}
		}
	}
}
</style>
