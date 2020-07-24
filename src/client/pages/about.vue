<template>
<div class="mmnnbwxb">
	<portal to="icon"><fa :icon="faInfoCircle"/></portal>
	<portal to="title" v-t="'about'"></portal>

	<section class="_card info" v-if="meta">
		<div class="_title"><fa :icon="faInfoCircle"/> {{ $t('instanceInfo') }}</div>
		<div class="_content" v-if="meta.description">
			<div v-html="meta.description"></div>
		</div>
		<div class="_content table">
			<div><b v-t="'administrator'"></b><span>{{ meta.maintainerName }}</span></div>
			<div><b></b><span>{{ meta.maintainerEmail }}</span></div>
		</div>
		<div class="_content table">
			<div><b>Misskey</b><span>v{{ version }}</span></div>
		</div>
	</section>

	<mk-instance-stats style="margin-top: var(--margin);"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { version } from '../config';
import MkInstanceStats from '../components/instance-stats.vue';

export default Vue.extend({
	metaInfo() {
		return {
			title: this.$t('instance') as string
		};
	},

	components: {
		MkInstanceStats
	},

	data() {
		return {
			version,
			serverInfo: null,
			faInfoCircle
		}
	},

	computed: {
		meta() {
			return this.$store.state.instance.meta;
		},
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
