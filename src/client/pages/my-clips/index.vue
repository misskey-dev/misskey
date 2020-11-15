<template>
<div class="_section">
	<MkButton @click="create" primary class="add"><Fa :icon="faPlus"/> {{ $t('add') }}</MkButton>

	<div class="_content">
		<MkPagination :pagination="pagination" #default="{items}" ref="list">
			<MkA v-for="item in items" :key="item.id" :to="`/clips/${item.id}`">{{ item.name }}</MkA>
		</MkPagination>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPlus, faPaperclip } from '@fortawesome/free-solid-svg-icons';
import MkPagination from '@/components/ui/pagination.vue';
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkPagination,
		MkButton,
	},

	data() {
		return {
			INFO: {
				title: this.$t('clip'),
				icon: faPaperclip,
				action: {
					icon: faPlus,
					handler: this.create
				}
			},
			pagination: {
				endpoint: 'clips/list',
				limit: 10,
			},
			draft: null,
			faPlus
		};
	},

	methods: {
		async create() {
			const { canceled, result } = await os.form(this.$t('createNewClip'), {
				name: {
					type: 'string',
					label: this.$t('name')
				},
				description: {
					type: 'string',
					required: false,
					multiline: true,
					label: this.$t('description')
				},
				isPublic: {
					type: 'boolean',
					label: this.$t('public')
				}
			});
			if (canceled) return;

			os.apiWithDialog('clips/create', result);
		},

		onClipCreated() {
			this.$refs.list.reload();
			this.draft = null;
		},

		onClipDeleted() {
			this.$refs.list.reload();
		},
	}
});
</script>
