<template>
<section class="rrfwjxfl _section">
	<MkTab v-model:value="tab" :items="[{ label: $t('mutedUsers'), value: 'mute' }, { label: $t('blockedUsers'), value: 'block' }]" style="margin-bottom: var(--margin);"/>
	<div class="_content" v-if="tab === 'mute'">
		<MkPagination :pagination="mutingPagination" class="muting">
			<template #empty><MkInfo>{{ $t('noUsers') }}</MkInfo></template>
			<template #default="{items}">
				<div class="user" v-for="mute in items" :key="mute.id">
					<router-link class="name" :to="userPage(mute.mutee)">
						<MkAcct :user="mute.mutee"/>
					</router-link>
				</div>
			</template>
		</MkPagination>
	</div>
	<div class="_content" v-if="tab === 'block'">
		<MkPagination :pagination="blockingPagination" class="blocking">
			<template #empty><MkInfo>{{ $t('noUsers') }}</MkInfo></template>
			<template #default="{items}">
				<div class="user" v-for="block in items" :key="block.id">
					<router-link class="name" :to="userPage(block.blockee)">
						<MkAcct :user="block.blockee"/>
					</router-link>
				</div>
			</template>
		</MkPagination>
	</div>
</section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faBan } from '@fortawesome/free-solid-svg-icons';
import MkPagination from '@/components/ui/pagination.vue';
import MkTab from '@/components/tab.vue';
import MkInfo from '@/components/ui/info.vue';
import { userPage } from '@/filters/user';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkPagination,
		MkTab,
		MkInfo,
	},

	emits: ['info'],

	data() {
		return {
			INFO: {
				header: [{
					title: this.$t('muteAndBlock'),
					icon: faBan
				}]
			},
			tab: 'mute',
			mutingPagination: {
				endpoint: 'mute/list',
				limit: 10,
			},
			blockingPagination: {
				endpoint: 'blocking/list',
				limit: 10,
			},
		}
	},

	mounted() {
		this.$emit('info', this.INFO);
	},

	methods: {
		userPage
	}
});
</script>

<style lang="scss" scoped>
.rrfwjxfl {
	> ._content {
		max-height: 350px;
		overflow: auto;

		> .muting,
		> .blocking {
			> .empty {
				opacity: 0.5 !important;
			}
		}
	}
}
</style>
