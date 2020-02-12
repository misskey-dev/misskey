<template>
<div class="mmnnbwxb">
	<portal to="icon"><fa :icon="faInfoCircle"/></portal>
	<portal to="title">{{ $t('about') }}</portal>

	<section class="_card info" v-if="meta">
		<div class="_title"><fa :icon="faInfoCircle"/> {{ $t('instanceInfo') }}</div>
		<div class="_content" v-if="meta.description">
			<div v-html="meta.description"></div>
		</div>
		<div class="_content table">
			<div><b>{{ $t('administrator') }}</b><span>{{ meta.maintainerName }}</span></div>
			<div><b></b><span>{{ meta.maintainerEmail }}</span></div>
		</div>
		<div class="_content table" v-if="stats">
			<div><b>{{ $t('users') }}</b><span>{{ stats.originalUsersCount | number }}</span></div>
			<div><b>{{ $t('notes') }}</b><span>{{ stats.originalNotesCount | number }}</span></div>
		</div>
		<div class="_content table">
			<div><b>Misskey</b><span>v{{ version }}</span></div>
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
			stats: null,
			serverInfo: null,
			faInfoCircle
		}
	},

	computed: {
		meta() {
			return this.$store.state.instance.meta;
		},
	},

	created() {
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
