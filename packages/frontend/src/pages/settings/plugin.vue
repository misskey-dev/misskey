<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/plugin" :label="i18n.ts.plugins" :keywords="['plugin']" icon="ti ti-plug">
	<div class="_gaps_m">
		<FormLink to="/settings/plugin/install"><template #icon><i class="ti ti-download"></i></template>{{ i18n.ts._plugin.install }}</FormLink>

		<FormSection>
			<template #label>{{ i18n.ts.manage }}</template>
			<div class="_gaps_s">
				<MkFolder v-for="plugin in plugins" :key="plugin.installId">
					<template #icon><i class="ti ti-plug"></i></template>
					<template #suffix>
						<i v-if="plugin.active" class="ti ti-player-play" style="color: var(--MI_THEME-accent);"></i>
						<i v-else class="ti ti-player-pause" style="opacity: 0.7;"></i>
					</template>
					<template #label>
						<div :style="plugin.active ? '' : 'opacity: 0.7;'">
							{{ plugin.name }}
							<span style="margin-left: 1em; opacity: 0.7;">v{{ plugin.version }}</span>
						</div>
					</template>
					<template #caption>
						{{ plugin.description }}
					</template>
					<template #footer>
						<div class="_buttons">
							<MkButton v-if="plugin.config" inline @click="config(plugin)"><i class="ti ti-settings"></i> {{ i18n.ts.settings }}</MkButton>
							<MkButton inline danger @click="uninstall(plugin)"><i class="ti ti-trash"></i> {{ i18n.ts.uninstall }}</MkButton>
						</div>
					</template>

					<div class="_gaps_m">
						<div class="_gaps_s">
							<span style="display: flex; align-items: center;"><b>{{ plugin.name }}</b><span style="margin-left: auto;">v{{ plugin.version }}</span></span>
							<MkSwitch :modelValue="plugin.active" @update:modelValue="changeActive(plugin, $event)">{{ i18n.ts.makeActive }}</MkSwitch>
						</div>

						<div class="_gaps_s">
							<MkKeyValue>
								<template #key>{{ i18n.ts.author }}</template>
								<template #value>{{ plugin.author }}</template>
							</MkKeyValue>
							<MkKeyValue>
								<template #key>{{ i18n.ts.description }}</template>
								<template #value>{{ plugin.description }}</template>
							</MkKeyValue>
							<MkKeyValue>
								<template #key>{{ i18n.ts.permission }}</template>
								<template #value>
									<ul style="margin-top: 0; margin-bottom: 0;">
										<li v-for="permission in plugin.permissions" :key="permission">{{ i18n.ts._permissions[permission] }}</li>
										<li v-if="!plugin.permissions || plugin.permissions.length === 0">{{ i18n.ts.none }}</li>
									</ul>
								</template>
							</MkKeyValue>
						</div>

						<MkFolder>
							<template #icon><i class="ti ti-terminal-2"></i></template>
							<template #label>{{ i18n.ts._plugin.viewLog }}</template>

							<div class="_gaps_s">
								<div class="_buttons">
									<MkButton inline @click="copy(pluginLogs.get(plugin.installId)?.join('\n'))"><i class="ti ti-copy"></i> {{ i18n.ts.copy }}</MkButton>
								</div>

								<MkCode :code="pluginLogs.get(plugin.installId)?.join('\n') ?? ''"/>
							</div>
						</MkFolder>

						<MkFolder>
							<template #icon><i class="ti ti-code"></i></template>
							<template #label>{{ i18n.ts._plugin.viewSource }}</template>

							<div class="_gaps_s">
								<div class="_buttons">
									<MkButton inline @click="copy(plugin.src)"><i class="ti ti-copy"></i> {{ i18n.ts.copy }}</MkButton>
								</div>

								<MkCode :code="plugin.src ?? ''" lang="ais"/>
							</div>
						</MkFolder>
					</div>
				</MkFolder>
			</div>
		</FormSection>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { nextTick, ref, computed } from 'vue';
import FormLink from '@/components/form/link.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import FormSection from '@/components/form/section.vue';
import MkButton from '@/components/MkButton.vue';
import MkCode from '@/components/MkCode.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import * as os from '@/os.js';
import { copyToClipboard } from '@/scripts/copy-to-clipboard.js';
import { unisonReload } from '@/scripts/unison-reload.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { changePluginActive, configPlugin, pluginLogs, uninstallPlugin } from '@/plugin.js';
import { prefer } from '@/preferences.js';

const plugins = prefer.r.plugins;

async function uninstall(plugin) {
	await uninstallPlugin(plugin);
	nextTick(() => {
		unisonReload();
	});
}

function copy(text) {
	copyToClipboard(text ?? '');
	os.success();
}

async function config(plugin) {
	await configPlugin(plugin);
	nextTick(() => {
		location.reload();
	});
}

function changeActive(plugin, active) {
	changePluginActive(plugin, active);
	nextTick(() => {
		location.reload();
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.plugins,
	icon: 'ti ti-plug',
}));
</script>
