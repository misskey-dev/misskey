<template>
<MkSelect v-model="sortModeSelect">
	<template #label>{{ i18n.ts.sort }}</template>
	<option v-for="x in sortOptions" :key="x.value" :value="x.value">{{ x.displayName }}</option>
</MkSelect>
<br>
<div v-if="!fetching" class="_gap_m">
	<MkPagination v-slot="{items}" :pagination="pagination" class="driveitem list">
		<div
			v-for="file in items"
			:key="file.id"
		>
			<MkA
				v-tooltip.mfm="`${file.type}\n${bytes(file.size)}\n${dateString(file.createdAt)}`"
				class="_button"
				:to="`${file.url}`"
				behavior="browser"
				@contextmenu.stop="$event => onContextMenu($event, file.id)"
			>
				<div class="file">
					<div v-if="file.isSensitive" class="sensitive-label">{{ i18n.ts.sensitive }}</div>
					<MkDriveFileThumbnail class="thumbnail" :file="file" fit="contain"/>
					<div class="body">
						<div style="margin-bottom: 4px;">
							{{ file.name }}
						</div>
						<div>
							<span style="margin-right: 1em;">{{ file.type }}</span>
							<span>{{ bytes(file.size) }}</span>
						</div>
						<div>
							<span>{{ i18n.ts.registeredDate }}: <MkTime :time="file.createdAt" mode="detail"/></span>
						</div>
						<div v-if="sortModeSelect === 'sizeDesc'">
							<div class="uawsfosz">
								<div class="meter"><div :style="genUsageBar(file.size)"></div></div>
							</div>
						</div>
					</div>
				</div>
			</MkA>
		</div>
	</MkPagination>
</div>
<div v-else class="gap_m">
	{{ i18n.ts.checking }} <MkEllipsis/>
</div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import tinycolor from 'tinycolor2';
import * as os from '@/os';
import MkPagination from '@/components/MkPagination.vue';
import MkDriveFileThumbnail from '@/components/MkDriveFileThumbnail.vue';
import { i18n } from '@/i18n';
import bytes from '@/filters/bytes';
import { dateString } from '@/filters/date';
import { definePageMetadata } from '@/scripts/page-metadata';
import MkSelect from '@/components/MkSelect.vue';

let sortMode = '+size';
const pagination = {
	endpoint: 'drive/files' as const,
	limit: 10,
	params: { sort: sortMode },
};

const sortOptions = [
	{ value: 'sizeDesc', displayName: i18n.ts._drivecleaner.orderBySizeDesc },
	{ value: 'createdAtAsc', displayName: i18n.ts._drivecleaner.orderByCreatedAtAsc },
];

const capacity = ref<number>(0);
const usage = ref<number>(0);
const fetching = ref(true);
const sortModeSelect = ref('sizeDesc');

fetchDriveInfo();

watch(fetching, () => {
	if (fetching.value) {
		fetchDriveInfo();
	}
});

watch(sortModeSelect, () => {
	switch (sortModeSelect.value) {
		case 'sizeDesc':
			sortMode = '+size';
			fetching.value = true;
			break;
		
		case 'createdAtAsc':
			sortMode = '-createdAt';
			fetching.value = true;
			break;
	}
});

function fetchDriveInfo(): void {
	os.api('drive').then(info => {
		capacity.value = info.capacity;
		usage.value = info.usage;
		fetching.value = false;
	});
}

function genUsageBar(fsize: number): object {
	return {
		width: `${fsize / usage.value * 100}%`,
		background: tinycolor({ h: 180 - (fsize / usage.value * 180), s: 0.7, l: 0.5 }),
	};
}

function onContextMenu(ev: MouseEvent, fileId: string): void {
	const target = ev.target as HTMLElement;
	const items = [
		{
			text: i18n.ts.delete,
			icon: 'ti ti-trash-x',
			danger: true,
			action: async (): Promise<void> => {
				const res = await os.confirm({
					type: 'warning',
					title: i18n.ts.delete,
					text: i18n.ts.deleteConfirm,
				});
				if (!res.canceled) {
					await os.apiWithDialog('drive/files/delete', { fileId: fileId });
					fetching.value = true;
				}
			},
		},
	];
	ev.preventDefault();
	os.popupMenu(items, target, {
		viaKeyboard: false,
	});
}

definePageMetadata({
	title: i18n.ts.drivecleaner,
	icon: 'ti ti-trash',
});
</script>

<style lang="scss" scoped>

@use "sass:math";

.file {
	display: flex;
	width: 100%;
	box-sizing: border-box;
	text-align: left;
	align-items: center;
	margin-bottom: 16px;

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

.uawsfosz {
	> .meter {
		$size: 12px;
		background: rgba(0, 0, 0, 0.1);
		border-radius: math.div($size, 2);
		overflow: hidden;

		> div {
			height: $size;
			border-radius: math.div($size, 2);
		}
	}
}
</style>
