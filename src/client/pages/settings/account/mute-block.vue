<template>
<section class="rrfwjxfl _section">
	<div class="_title"><Fa :icon="faBan"/> {{ $t('muteAndBlock') }}</div>
	<div class="_content">
		<span>{{ $t('mutedUsers') }}</span>
		<MkPagination :pagination="mutingPagination" class="muting">
			<template #empty><span>{{ $t('noUsers') }}</span></template>
			<template #default="{items}">
				<div class="user" v-for="(mute, i) in items" :key="mute.id">
					<router-link class="name" :to="userPage(mute.mutee)">
						<MkAcct :user="mute.mutee"/>
					</router-link>
				</div>
			</template>
		</MkPagination>
	</div>
	<div class="_content">
		<span>{{ $t('blockedUsers') }}</span>
		<MkPagination :pagination="blockingPagination" class="blocking">
			<template #empty><span>{{ $t('noUsers') }}</span></template>
			<template #default="{items}">
				<div class="user" v-for="(block, i) in items" :key="block.id">
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
import { userPage } from '@/filters/user';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkPagination,
	},

	data() {
		return {
			mutingPagination: {
				endpoint: 'mute/list',
				limit: 10,
			},
			blockingPagination: {
				endpoint: 'blocking/list',
				limit: 10,
			},
			faBan
		}
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
