<template>
<div class="obdskegsannmntldydackcpzezagxqfy">
	<div v-if="stats" class="stats">
		<div>
			<div>
				<div>%fa:user%</div>
				<div>
					<span>%i18n:@accounts%</span>
					<b class="primary">{{ stats.originalUsersCount | number }}</b>
				</div>
			</div>
			<div>
				<span>%fa:home% %i18n:@this-instance%</span>
			</div>
		</div>
		<div>
			<div>
				<div>%fa:pencil-alt%</div>
				<div>
					<span>%i18n:@notes%</span>
					<b class="primary">{{ stats.originalNotesCount | number }}</b>
				</div>
			</div>
			<div>
				<span>%fa:home% %i18n:@this-instance%</span>
			</div>
		</div>
		<div>
			<div>
				<div>%fa:user%</div>
				<div>
					<span>%i18n:@accounts%</span>
					<b>{{ stats.usersCount | number }}</b>
				</div>
			</div>
			<div>
				<span>%fa:globe% %i18n:@federated%</span>
			</div>
		</div>
		<div>
			<div>
				<div>%fa:pencil-alt%</div>
				<div>
					<span>%i18n:@notes%</span>
					<b>{{ stats.notesCount | number }}</b>
				</div>
			</div>
			<div>
				<span>%fa:globe% %i18n:@federated%</span>
			</div>
		</div>
	</div>

	<div class="charts">
		<x-charts/>
	</div>

	<div class="cpu-memory">
		<x-cpu-memory :connection="connection"/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from "vue";
import XCpuMemory from "./cpu-memory.vue";
import XCharts from "./charts.vue";

export default Vue.extend({
	components: {
		XCpuMemory,
		XCharts
	},
	data() {
		return {
			stats: null,
			connection: null
		};
	},
	created() {
		this.connection = (this as any).os.stream.useSharedConnection('serverStats');

		(this as any).os.getMeta().then(meta => {
			this.disableRegistration = meta.disableRegistration;
			this.disableLocalTimeline = meta.disableLocalTimeline;
			this.bannerUrl = meta.bannerUrl;
		});

		(this as any).api('stats').then(stats => {
			this.stats = stats;
		});
	},
	beforeDestroy() {
		this.connection.dispose();
	}
});
</script>

<style lang="stylus" scoped>
.obdskegsannmntldydackcpzezagxqfy
	> .stats
		display flex
		justify-content space-between
		margin-bottom 16px

		> div
			flex 1
			max-width 300px
			margin-right 16px
			color var(--text)
			box-shadow 0 2px 4px rgba(0, 0, 0, 0.1)
			background var(--face)
			border-radius 8px

			&:last-child
				margin-right 0

			> div:first-child
				display flex
				align-items center
				text-align center

				&:last-child
					margin-right 0

				> div:first-child
					padding 16px 24px
					font-size 28px

				> div:last-child
					flex 1
					padding 16px 32px 16px 0
					text-align right

					> span
						font-size 70%
						opacity 0.7

					> b
						display block

						&.primary
							color var(--primary)

			> div:last-child
				padding 6px 16px
				border-top solid 1px #eee

				> span
					font-size 70%
					opacity 0.7

	> .charts
		margin-bottom 16px

	> .cpu-memory
		margin-bottom 16px

</style>
