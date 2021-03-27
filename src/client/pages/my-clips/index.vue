<template>
<div class="_section qtcaoidl">
	<MkButton @click="create" primary class="add"><Fa :icon="faPlus"/> {{ $ts.add }}</MkButton>

	<div class="_content">
		<MkPagination :pagination="pagination" #default="{items}" ref="list" class="list">
			<MkA v-for="item in items" :key="item.id" :to="`/clips/${item.id}`" class="item _panel _vMargin">
				<b>{{ item.name }}</b>
				<div v-if="item.description" class="description">{{ item.description }}</div>
			</MkA>
		</MkPagination>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPlus, faPaperclip } from '@fortawesome/free-solid-svg-icons';
import MkPagination from '@client/components/ui/pagination.vue';
import MkButton from '@client/components/ui/button.vue';
import * as os from '@client/os';

export default defineComponent({
	components: {
		MkPagination,
		MkButton,
	},

	data() {
		return {
			INFO: {
				title: this.$ts.clip,
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
			const { canceled, result } = await os.form(this.$ts.createNewClip, {
				name: {
					type: 'string',
					label: this.$ts.name
				},
				description: {
					type: 'string',
					required: false,
					multiline: true,
					label: this.$ts.description
				},
				isPublic: {
					type: 'boolean',
					label: this.$ts.public,
					default: false
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

<style lang="scss" scoped>
.qtcaoidl {
	> .add {
		margin: 0 auto 16px auto;
	}

	> ._content {
		> .list {
			> .item {
				display: block;
				padding: 16px;

				> .description {
					margin-top: 8px;
					padding-top: 8px;
					border-top: solid 1px var(--divider);
				}
			}
		}
	}
}
</style>
