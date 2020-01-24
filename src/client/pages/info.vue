<template>
<div v-if="meta" class="mmnnbwxb">
	<portal to="icon"><fa :icon="faServer"/></portal>
	<portal to="title">{{ $t('instance') }}</portal>

	<section class="_section info">
		<div class="_title"><fa :icon="faInfoCircle"/> {{ $t('instanceInfo') }}</div>
		<div class="_content table" v-if="stats">
			<div><b>{{ $t('users') }}</b><span>{{ stats.originalUsersCount | number }}</span></div>
			<div><b>{{ $t('notes') }}</b><span>{{ stats.originalNotesCount | number }}</span></div>
		</div>
		<div class="_content table">
			<div><b>Misskey</b><span>v{{ version }}</span></div>
		</div>
		<div class="_content table" v-if="serverInfo">
			<div><b>Node.js</b><span>{{ serverInfo.node }}</span></div>
			<div><b>PostgreSQL</b><span>v{{ serverInfo.psql }}</span></div>
			<div><b>Redis</b><span>v{{ serverInfo.redis }}</span></div>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { version } from '../config';
import i18n from '../i18n';

export default Vue.extend({
	i18n,

	metaInfo() {
		return {
			title: this.$t('instance') as string
		};
	},

	data() {
		return {
			version,
			meta: null,
			stats: null,
			serverInfo: null,
			faInfoCircle
		}
	},

	created() {
		this.$root.getMeta().then(meta => {
			this.meta = meta;
		});

		this.$root.api('stats').then(res => {
			this.stats = res;
		});
	},
});
</script>

<style lang="scss" scoped>
.mmnnbwxb {
	> .info {
		> .table {
			> div {
				display: flex;

				> * {
					flex: 1;
				}
			}
		}
	}
}
</style>
