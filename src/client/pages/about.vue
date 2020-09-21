<template>
<div class="mmnnbwxb">
	<portal to="header"><Fa :icon="faInfoCircle"/>{{ $t('about') }}</portal>

	<section class="_card info" v-if="meta">
		<div class="_title"><Fa :icon="faInfoCircle"/> {{ $t('instanceInfo') }}</div>
		<div class="_content" v-if="meta.description">
			<div v-html="meta.description"></div>
		</div>
		<div class="_content table">
			<div><b>{{ $t('administrator') }}</b><span>{{ meta.maintainerName }}</span></div>
			<div><b></b><span>{{ meta.maintainerEmail }}</span></div>
		</div>
		<div class="_content table">
			<div><b>Misskey</b><span>v{{ version }}</span></div>
		</div>
	</section>

	<MkInstanceStats style="margin-top: var(--margin);"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { version } from '@/config';
import MkInstanceStats from '@/components/instance-stats.vue';
import * as os from '@/os';

export default defineComponent({
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
