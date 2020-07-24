<template>
<section class="rrfwjxfl _card">
	<div class="_title"><fa :icon="faBan"/> {{ $t('muteAndBlock') }}</div>
	<div class="_content">
		<span>{{ $t('mutedUsers') }}</span>
		<mk-pagination :pagination="mutingPagination" class="muting">
			<template #empty><span>{{ $t('noUsers') }}</span></template>
			<template #default="{items}">
				<div class="user" v-for="(mute, i) in items" :key="mute.id">
					<router-link class="name" :to="mute.mutee | userPage">
						<mk-acct :user="mute.mutee"/>
					</router-link>
				</div>
			</template>
		</mk-pagination>
	</div>
	<div class="_content">
		<span>{{ $t('blockedUsers') }}</span>
		<mk-pagination :pagination="blockingPagination" class="blocking">
			<template #empty><span>{{ $t('noUsers') }}</span></template>
			<template #default="{items}">
				<div class="user" v-for="(block, i) in items" :key="block.id">
					<router-link class="name" :to="block.blockee | userPage">
						<mk-acct :user="block.blockee"/>
					</router-link>
				</div>
			</template>
		</mk-pagination>
	</div>
</section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faBan } from '@fortawesome/free-solid-svg-icons';
import MkPagination from '../../components/ui/pagination.vue';

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
