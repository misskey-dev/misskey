<template>
<div class="hyhctythnmwihguaaapnbrbszsjqxpio">
	<table>
		<thead>
			<tr>
				<th>%fa:exchange-alt% In/Out</th>
				<th>%fa:server% Host</th>
				<th>%fa:bolt% Activity</th>
				<th>%fa:user% Actor</th>
			</tr>
		</thead>
		<tbody>
			<tr v-for="log in logs" :key="log.id">
				<td :class="log.direction">{{ log.direction == 'in' ? '<' : '>' }} {{ log.direction }}</td>
				<td>{{ log.host }}</td>
				<td>{{ log.activity }}</td>
				<td>@{{ log.actor }}</td>
			</tr>
		</tbody>
	</table>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	data() {
		return {
			logs: [],
			connection: null
		};
	},

	mounted() {
		this.connection = (this as any).os.stream.useSharedConnection('apLog');
		this.connection.on('stats', this.onLog);
		this.connection.on('statsLog', this.onLogs);
		this.connection.send('requestLog', {
			id: Math.random().toString().substr(2, 8),
			length: 50
		});
	},

	beforeDestroy() {
		this.connection.dispose();
	},

	methods: {
		onLog(log) {
			log.id = Math.random();
			this.logs.unshift(log);
			if (this.logs.length > 50) this.logs.pop();
		},

		onLogs(logs) {
			logs.reverse().forEach(log => this.onLog(log));
		}
	}
});
</script>

<style lang="stylus" scoped>
.hyhctythnmwihguaaapnbrbszsjqxpio
	display block
	padding 16px
	height 250px
	overflow auto
	box-shadow 0 2px 4px rgba(0, 0, 0, 0.1)
	background var(--face)
	border-radius 8px

	> table
		width 100%
		max-width 100%
		overflow auto
		border-spacing 0
		border-collapse collapse
		color #555

		thead
			font-weight bold
			border-bottom solid 2px #eee

			tr
				th
					text-align left

		tbody
			tr
				&:nth-child(odd)
					background #fbfbfb

		th, td
			padding 8px 16px
			min-width 128px

		td.in
			color #d26755

		td.out
			color #55bb83

</style>
