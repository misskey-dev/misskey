<template>
<FormBase>
	<MkTab v-model:value="tab" style="margin-bottom: var(--margin);">
		<option value="mute">{{ $ts.mutedUsers }}</option>
		<option value="block">{{ $ts.blockedUsers }}</option>
	</MkTab>
	<div v-if="tab === 'mute'">
		<MkPagination :pagination="mutingPagination" class="muting">
			<template #empty><MkInfo>{{ $ts.noUsers }}</MkInfo></template>
			<template #default="{items}">
				<FormGroup>
					<FormLink v-for="mute in items" :key="mute.id" :to="userPage(mute.mutee)">
						<MkAcct :user="mute.mutee"/>
					</FormLink>
				</FormGroup>
			</template>
		</MkPagination>
	</div>
	<div v-if="tab === 'block'">
		<MkPagination :pagination="blockingPagination" class="blocking">
			<template #empty><MkInfo>{{ $ts.noUsers }}</MkInfo></template>
			<template #default="{items}">
				<FormGroup>
					<FormLink v-for="block in items" :key="block.id" :to="userPage(block.blockee)">
						<MkAcct :user="block.blockee"/>
					</FormLink>
				</FormGroup>
			</template>
		</MkPagination>
	</div>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faBan } from '@fortawesome/free-solid-svg-icons';
import MkPagination from '@/components/ui/pagination.vue';
import MkTab from '@/components/tab.vue';
import MkInfo from '@/components/ui/info.vue';
import FormLink from '@/components/form/link.vue';
import FormBase from '@/components/form/base.vue';
import FormGroup from '@/components/form/group.vue';
import { userPage } from '@/filters/user';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkPagination,
		MkTab,
		MkInfo,
		FormBase,
		FormGroup,
		FormLink,
	},

	emits: ['info'],

	data() {
		return {
			INFO: {
				title: this.$ts.muteAndBlock,
				icon: faBan
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
