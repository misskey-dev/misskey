<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<MkSelect v-model="sortModeSelect" :items="sortModeSelectDef">
		<template #label>{{ i18n.ts.sort }}</template>
	</MkSelect>
	<div v-if="!fetching">
		<MkPagination v-slot="{items}" :paginator="paginator">
			<div class="_gaps">
				<div
					v-for="file in items" :key="file.id"
					class="_button"
					@click="$event => onClick($event, file)"
					@contextmenu.stop="$event => onContextMenu($event, file)"
				>
					<div :class="$style.file">
						<div v-if="file.isSensitive" class="sensitive-label">{{ i18n.ts.sensitive }}</div>
						<MkDriveFileThumbnail :class="$style.fileThumbnail" :file="file" fit="contain"/>
						<div :class="$style.fileBody">
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
								<div :class="$style.meter"><div :class="$style.meterValue" :style="genUsageBar(file.size)"></div></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</MkPagination>
	</div>
	<div v-else>
		<MkLoading/>
	</div>
</div>
</template>

<script setup lang="ts">
import * as Misskey from 'misskey-js';
import { computed, markRaw, ref, watch } from 'vue';
import tinycolor from 'tinycolor2';
import type { StyleValue } from 'vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import MkPagination from '@/components/MkPagination.vue';
import MkDriveFileThumbnail from '@/components/MkDriveFileThumbnail.vue';
import { i18n } from '@/i18n.js';
import bytes from '@/filters/bytes.js';
import { definePage } from '@/page.js';
import MkSelect from '@/components/MkSelect.vue';
import { useMkSelect } from '@/composables/use-mkselect.js';
import { useGlobalEvent } from '@/events.js';
import { getDriveFileMenu } from '@/utility/get-drive-file-menu.js';
import { Paginator } from '@/utility/paginator.js';

const sortMode = ref<Misskey.entities.DriveFilesRequest['sort']>('+size');
const paginator = markRaw(new Paginator('drive/files', {
	limit: 10,
	computedParams: computed(() => ({ sort: sortMode.value })),
}));

const capacity = ref<number>(0);
const usage = ref<number>(0);
const fetching = ref(true);
const {
	model: sortModeSelect,
	def: sortModeSelectDef,
} = useMkSelect({
	items: [
		{ label: i18n.ts._drivecleaner.orderBySizeDesc, value: 'sizeDesc' },
		{ label: i18n.ts._drivecleaner.orderByCreatedAtAsc, value: 'createdAtAsc' },
	],
	initialValue: 'sizeDesc',
});

fetchDriveInfo();

watch(sortModeSelect, () => {
	switch (sortModeSelect.value) {
		case 'sizeDesc':
			sortMode.value = '+size';
			fetchDriveInfo();
			break;

		case 'createdAtAsc':
			sortMode.value = '-createdAt';
			fetchDriveInfo();
			break;
	}
});

function fetchDriveInfo(): void {
	fetching.value = true;
	misskeyApi('drive').then(info => {
		capacity.value = info.capacity;
		usage.value = info.usage;
		fetching.value = false;
	});
}

function genUsageBar(fsize: number): StyleValue {
	return {
		width: `${fsize / usage.value * 100}%`,
		background: tinycolor({ h: 180 - (fsize / usage.value * 180), s: 0.7, l: 0.5 }).toHslString(),
	};
}

function onClick(ev: PointerEvent, file: Misskey.entities.DriveFile) {
	os.popupMenu(getDriveFileMenu(file), (ev.currentTarget ?? ev.target ?? undefined) as HTMLElement | undefined);
}

function onContextMenu(ev: PointerEvent, file: Misskey.entities.DriveFile): void {
	os.contextMenu(getDriveFileMenu(file), ev);
}

useGlobalEvent('driveFilesDeleted', (files) => {
	for (const f of files) {
		paginator.removeItem(f.id);
	}
});

definePage(() => ({
	title: i18n.ts.drivecleaner,
	icon: 'ti ti-trash',
}));
</script>

<style lang="scss" module>
.file {
	display: flex;
	width: 100%;
	box-sizing: border-box;
	text-align: left;
	align-items: center;

	&:hover {
		color: var(--MI_THEME-accent);
	}
}

.fileThumbnail {
	width: 100px;
	height: 100px;
}

.fileBody {
	margin-left: 0.3em;
	padding: 8px;
	flex: 1;
}

.meter {
	margin-top: 8px;
	height: 12px;
	background: rgba(0, 0, 0, 0.1);
	overflow: clip;
	border-radius: 999px;
}

.meterValue {
	height: 100%;
}
</style>
