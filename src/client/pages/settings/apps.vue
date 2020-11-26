<template>
<FormBase>
	<FormPagination :pagination="pagination" ref="list">
		<template #empty>
			<div class="_fullinfo">
				<img src="https://xn--931a.moe/assets/info.jpg" class="_ghost"/>
				<div>{{ $t('nothing') }}</div>
			</div>
		</template>
		<template #default="{items}">
			<div class="_formPanel bfomjevm" v-for="token in items" :key="token.id">
				<img class="icon" :src="token.iconUrl" alt="" v-if="token.iconUrl"/>
				<div class="body">
					<div class="name">{{ token.name }}</div>
					<div class="description">{{ token.description }}</div>
					<div class="_keyValue">
						<div>{{ $t('installedDate') }}:</div>
						<div><MkTime :time="token.createdAt"/></div>
					</div>
					<div class="_keyValue">
						<div>{{ $t('lastUsedDate') }}:</div>
						<div><MkTime :time="token.lastUsedAt"/></div>
					</div>
					<div class="actions">
						<button class="_button" @click="revoke(token)"><Fa :icon="faTrashAlt"/></button>
					</div>
					<details>
						<summary>{{ $t('details') }}</summary>
						<ul>
							<li v-for="p in token.permission" :key="p">{{ $t(`_permissions.${p}`) }}</li>
						</ul>
					</details>
				</div>
			</div>
		</template>
	</FormPagination>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faTrashAlt, faPlug } from '@fortawesome/free-solid-svg-icons';
import FormPagination from '@/components/form/pagination.vue';
import FormSelect from '@/components/form/select.vue';
import FormLink from '@/components/form/link.vue';
import FormBase from '@/components/form/base.vue';
import FormGroup from '@/components/form/group.vue';
import FormButton from '@/components/form/button.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		FormBase,
		FormPagination,
	},

	emits: ['info'],

	data() {
		return {
			INFO: {
				title: this.$t('installedApps'),
				icon: faPlug,
			},
			pagination: {
				endpoint: 'i/apps',
				limit: 100,
				params: {
					sort: '+lastUsedAt'
				}
			},
			faTrashAlt, faPlug
		};
	},

	mounted() {
		this.$emit('info', this.INFO);
	},

	methods: {
		revoke(token) {
			os.api('i/revoke-token', { tokenId: token.id }).then(() => {
				this.$refs.list.reload();
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.bfomjevm {
	display: flex;
	padding: 16px;

	> .icon {
		display: block;
		flex-shrink: 0;
		margin: 0 12px 0 0;
		width: 50px;
		height: 50px;
		border-radius: 8px;
	}

	> .body {
		width: calc(100% - 62px);
		position: relative;

		> .name {
			font-weight: bold;
		}
	}
}
</style>
