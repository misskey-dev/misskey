<template>
<mk-window ref="window" width="750px" height="500px" @closed="$destroy" name="TaskManager">
	<span slot="header" :class="$style.header">%fa:stethoscope%タスクマネージャ</span>
	<el-tabs :class="$style.content">
		<el-tab-pane label="Requests">
			<el-table
				:data="os.requests"
				style="width: 100%"
				:default-sort="{prop: 'date', order: 'descending'}"
			>
				<el-table-column type="expand">
					<template slot-scope="props">
						<pre>{{ props.row.data }}</pre>
						<pre>{{ props.row.res }}</pre>
					</template>
				</el-table-column>

				<el-table-column
					label="Requested at"
					prop="date"
					sortable
				>
					<template slot-scope="scope">
						<b style="margin-right: 8px">{{ scope.row.date.getTime() }}</b>
						<span>(<mk-time :time="scope.row.date"/>)</span>
					</template>
				</el-table-column>

				<el-table-column
					label="Name"
				>
					<template slot-scope="scope">
						<b>{{ scope.row.name }}</b>
					</template>
				</el-table-column>

				<el-table-column
					label="Status"
				>
					<template slot-scope="scope">
						<span>{{ scope.row.status || '(pending)' }}</span>
					</template>
				</el-table-column>
			</el-table>
		</el-tab-pane>

		<el-tab-pane label="Streams">
			<el-table
				:data="os.connections"
				style="width: 100%"
			>
				<el-table-column
					label="Uptime"
				>
					<template slot-scope="scope">
						<mk-timer v-if="scope.row.connectedAt" :time="scope.row.connectedAt"/>
						<span v-else>-</span>
					</template>
				</el-table-column>

				<el-table-column
					label="Name"
				>
					<template slot-scope="scope">
						<b>{{ scope.row.name == '' ? '[Home]' : scope.row.name }}</b>
					</template>
				</el-table-column>

				<el-table-column
					label="User"
				>
					<template slot-scope="scope">
						<span>{{ scope.row.user || '(anonymous)' }}</span>
					</template>
				</el-table-column>

				<el-table-column
					prop="state"
					label="State"
				/>

				<el-table-column
					prop="in"
					label="In"
				/>

				<el-table-column
					prop="out"
					label="Out"
				/>
			</el-table>
		</el-tab-pane>

		<el-tab-pane label="Streams (Inspect)">
			<el-tabs type="card" style="height:50%">
				<el-tab-pane v-for="c in os.connections" :label="c.name == '' ? '[Home]' : c.name" :key="c.id" :name="c.id" ref="connectionsTab">
					<el-table
						:data="c.inout"
						style="width: 100%"
						:default-sort="{prop: 'at', order: 'descending'}"
					>
						<el-table-column type="expand">
							<template slot-scope="props">
								<pre>{{ props.row.data }}</pre>
							</template>
						</el-table-column>

						<el-table-column
							label="Date"
							prop="at"
							sortable
						>
							<template slot-scope="scope">
								<b style="margin-right: 8px">{{ scope.row.at.getTime() }}</b>
								<span>(<mk-time :time="scope.row.at"/>)</span>
							</template>
						</el-table-column>

						<el-table-column
							label="Type"
						>
							<template slot-scope="scope">
								<span>{{ getMessageType(scope.row.data) }}</span>
							</template>
						</el-table-column>

						<el-table-column
							label="Incoming / Outgoing"
							prop="type"
						/>
					</el-table>
				</el-tab-pane>
			</el-tabs>
		</el-tab-pane>

		<el-tab-pane label="Windows">
			<el-table
				:data="Array.from(os.windows.windows)"
				style="width: 100%"
			>
				<el-table-column
					label="Name"
				>
					<template slot-scope="scope">
						<b>{{ scope.row.name || '(unknown)' }}</b>
					</template>
				</el-table-column>

				<el-table-column
					label="Operations"
				>
					<template slot-scope="scope">
						<el-button size="mini" type="danger" @click="scope.row.close">Close</el-button>
					</template>
				</el-table-column>
			</el-table>
		</el-tab-pane>
	</el-tabs>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	mounted() {
		(this as any).os.windows.on('added', this.onWindowsChanged);
		(this as any).os.windows.on('removed', this.onWindowsChanged);
	},
	beforeDestroy() {
		(this as any).os.windows.off('added', this.onWindowsChanged);
		(this as any).os.windows.off('removed', this.onWindowsChanged);
	},
	methods: {
		getMessageType(data): string {
			return data.type ? data.type : '-';
		},
		onWindowsChanged() {
			this.$forceUpdate();
		}
	}
});
</script>

<style lang="stylus" module>
.header
	> [data-fa]
		margin-right 4px

.content
	height 100%
	overflow auto

</style>

<style>
.el-tabs__header {
	margin-bottom: 0 !important;
}

.el-tabs__item {
	padding: 0 20px !important;
}
</style>
