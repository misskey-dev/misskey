<template>
<div>
	<MkPagination v-slot="{items}" :pagination="pagination" class="urempief" :class="{ grid: viewMode === 'grid' }">
		<MkA
			v-for="file in items"
			:key="file.id"
			v-tooltip.mfm="`${file.type}\n${bytes(file.size)}\n${new Date(file.createdAt).toLocaleString()}\nby ${file.user ? '@' + Acct.toString(file.user) : 'system'}`"
			:to="`/admin/file/${file.id}`"
			class="file _button"
		>
			<MkDriveFileThumbnail class="thumbnail" :file="file" fit="contain"/>
			<div v-if="viewMode === 'list'" class="body">
				<div>
					<small style="opacity: 0.7;">{{ file.name }}</small>
				</div>
				<div>
					<MkAcct v-if="file.user" :user="file.user"/>
					<div v-else>{{ $ts.system }}</div>
				</div>
				<div>
					<span style="margin-right: 1em;">{{ file.type }}</span>
					<span>{{ bytes(file.size) }}</span>
				</div>
				<div>
					<span>{{ $ts.registeredDate }}: <MkTime :time="file.createdAt" mode="detail"/></span>
				</div>
			</div>
		</MkA>
	</MkPagination>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Acct from 'misskey-js/built/acct';
import MkSwitch from '@/components/ui/switch.vue';
import MkPagination from '@/components/ui/pagination.vue';
import MkDriveFileThumbnail from '@/components/drive-file-thumbnail.vue';
import bytes from '@/filters/bytes';
import * as os from '@/os';
import { i18n } from '@/i18n';

const props = defineProps<{
	pagination: any;
	viewMode: 'grid' | 'list';
}>();
</script>

<style lang="scss" scoped>
.urempief {
	margin-top: var(--margin);

	&.list {
		> .file {
			display: flex;
			width: 100%;
			box-sizing: border-box;
			text-align: left;
			align-items: center;

			&:hover {
				color: var(--accent);
			}

			> .thumbnail {
				width: 128px;
				height: 128px;
			}

			> .body {
				margin-left: 0.3em;
				padding: 8px;
				flex: 1;

				@media (max-width: 500px) {
					font-size: 14px;
				}
			}
		}
	}

	&.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		grid-gap: 12px;
		margin: var(--margin) 0;

		> .file {
			aspect-ratio: 1;
		
			> .thumbnail {
				width: 100%;
				height: 100%;
			}
		}
	}
}
</style>
