<template>
<div class="obdskegsannmntldydackcpzezagxqfy">
	<header v-if="meta">
		<p><b>Misskey</b><span>{{ meta.version }}</span></p>
		<p><b>Machine</b><span>{{ meta.machine }}</span></p>
		<p><b>OS</b><span>{{ meta.os }}</span></p>
		<p><b>Node</b><span>{{ meta.node }}</span></p>
		<p>{{ $t('@.ai-chan-kawaii') }}</p>
	</header>

	<div v-if="stats" class="stats">
		<div>
			<div>
				<div><fa icon="user"/></div>
				<div>
					<span>{{ $t('accounts') }}</span>
					<b class="primary">{{ stats.originalUsersCount | number }}</b>
				</div>
			</div>
			<div>
				<span><fa icon="home"/> {{ $t('this-instance') }}</span>
				<span @click="setChartSrc('users')"><fa :icon="['far', 'chart-bar']"/></span>
			</div>
		</div>
		<div>
			<div>
				<div><fa icon="pencil-alt"/></div>
				<div>
					<span>{{ $t('notes') }}</span>
					<b class="primary">{{ stats.originalNotesCount | number }}</b>
				</div>
			</div>
			<div>
				<span><fa icon="home"/> {{ $t('this-instance') }}</span>
				<span @click="setChartSrc('notes')"><fa :icon="['far', 'chart-bar']"/></span>
			</div>
		</div>
		<div>
			<div>
				<div><fa icon="database"/></div>
				<div>
					<span>{{ $t('drive') }}</span>
					<b>{{ stats.driveUsageLocal | bytes }}</b>
				</div>
			</div>
			<div>
				<span><fa icon="home"/> {{ $t('this-instance') }}</span>
				<span @click="setChartSrc('drive')"><fa :icon="['far', 'chart-bar']"/></span>
			</div>
		</div>
		<div>
			<div>
				<div><fa :icon="['far', 'hdd']"/></div>
				<div>
					<span>{{ $t('instances') }}</span>
					<b>{{ stats.instances | number }}</b>
				</div>
			</div>
			<div>
				<span><fa icon="globe"/> {{ $t('federated') }}</span>
				<span @click="setChartSrc('federation-instances-total')"><fa :icon="['far', 'chart-bar']"/></span>
			</div>
		</div>
	</div>

	<div class="charts">
		<x-charts ref="charts"/>
	</div>

	<div class="cpu-memory">
		<x-cpu-memory :connection="connection"/>
	</div>

	<div class="ap">
		<x-ap-log/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';
import XCpuMemory from "./cpu-memory.vue";
import XCharts from "./charts.vue";
import XApLog from "./ap-log.vue";

export default Vue.extend({
	i18n: i18n('admin/views/dashboard.vue'),
	components: {
		XCpuMemory,
		XCharts,
		XApLog
	},

	data() {
		return {
			stats: null,
			connection: null,
			meta: null
		};
	},

	created() {
		this.connection = this.$root.stream.useSharedConnection('serverStats');

		this.$root.getMeta().then(meta => {
			this.meta = meta;
		});

		this.$root.api('stats').then(stats => {
			this.stats = stats;
		});
	},

	beforeDestroy() {
		this.connection.dispose();
	},

	methods: {
		setChartSrc(src) {
			this.$refs.charts.setSrc(src);
		}
	}
});
</script>

<style lang="stylus" scoped>
.obdskegsannmntldydackcpzezagxqfy
	padding 16px

	@media (min-width 500px)
		padding 32px

	> header
		display flex
		margin-bottom 16px
		padding-bottom 16px
		border-bottom solid 1px var(--adminDashboardHeaderBorder)
		color var(--adminDashboardHeaderFg)
		font-size 14px
		white-space nowrap

		@media (max-width 1000px)
			display none

		> p
			display block
			margin 0 32px 0 0
			overflow hidden
			text-overflow ellipsis

			> b
				&:after
					content ':'
					margin-right 8px

			&:last-child
				margin-left auto
				margin-right 0

	> .stats
		display flex
		justify-content space-between
		margin-bottom 16px

		> div
			flex 1
			margin-right 16px
			color var(--adminDashboardCardFg)
			box-shadow 0 2px 4px rgba(0, 0, 0, 0.1)
			background var(--adminDashboardCardBg)
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
				display flex
				padding 6px 16px
				border-top solid 1px var(--adminDashboardCardDivider)

				> span
					font-size 70%
					opacity 0.7

					&:last-child
						margin-left auto
						cursor pointer

		@media (max-width 900px)
			display grid
			grid-template-columns 1fr 1fr
			grid-template-rows 1fr 1fr
			gap 16px

			> div
				margin-right 0

		@media (max-width 500px)
			display block

			> div:not(:last-child)
				margin-bottom 16px

	> .charts
		margin-bottom 16px

	> .cpu-memory
		margin-bottom 16px

</style>
