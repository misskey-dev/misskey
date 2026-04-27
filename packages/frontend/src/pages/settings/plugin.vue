<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/plugin" :label="i18n.ts.plugins" :keywords="['plugin', 'addon', 'extension']" icon="ti ti-plug">
	<div class="_gaps_m">
		<MkFeatureBanner icon="/client-assets/electric_plug_3d.png" color="#ffbb00">
			<SearchText>{{ i18n.ts._settings.pluginBanner }}</SearchText>
		</MkFeatureBanner>

		<MkInfo v-if="isSafeMode" warn>{{ i18n.ts.pluginsAreDisabledBecauseSafeMode }}</MkInfo>

		<FormLink v-else to="/settings/plugin/install"><template #icon><i class="ti ti-download"></i></template>{{ i18n.ts._plugin.install }}</FormLink>

		<FormSection>
			<template #label>{{ i18n.ts.manage }}</template>
			<div class="_gaps_s">
				<MkFolder v-for="plugin in plugins" :key="plugin.installId">
					<template #icon><i class="ti ti-plug"></i></template>
					<template #suffix>
						<i v-if="plugin.active" class="ti ti-player-play" style="color: var(--MI_THEME-success);"></i>
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
							<MkButton :disabled="!plugin.active" @click="reload(plugin)"><i class="ti ti-refresh"></i> {{ i18n.ts.reload }}</MkButton>
							<MkButton danger @click="uninstall(plugin)"><i class="ti ti-trash"></i> {{ i18n.ts.uninstall }}</MkButton>
							<MkButton v-if="plugin.config" style="margin-left: auto;" @click="config(plugin)"><i class="ti ti-settings"></i> {{ i18n.ts.settings }}</MkButton>
						</div>
					</template>

					<div class="_gaps_m">
						<div class="_gaps_s">
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
										<li v-for="permission in plugin.permissions" :key="permission">{{ i18n.ts._permissions[permission] ?? permission }}</li>
										<li v-if="!plugin.permissions || plugin.permissions.length === 0">{{ i18n.ts.none }}</li>
									</ul>
								</template>
							</MkKeyValue>
						</div>

						<div class="_gaps_s">
							<MkFolder>
								<template #icon><i class="ti ti-terminal-2"></i></template>
								<template #label>{{ i18n.ts.logs }}</template>

								<div>
									<div v-for="log in pluginLogs.get(plugin.installId)" :class="[$style.log, { [$style.isSystemLog]: log.isSystem }]">
										<div class="_monospace">{{ timeToHhMmSs(log.at) }} {{ log.message }}</div>
									</div>
								</div>
							</MkFolder>

							<MkFolder :withSpacer="false">
								<template #icon><i class="ti ti-code"></i></template>
								<template #label>{{ i18n.ts._plugin.viewSource }}</template>

								<div class="_gaps_s">
									<MkCode :code="plugin.src ?? ''" lang="ais"/>
								</div>
							</MkFolder>
						</div>
					</div>
				</MkFolder>
			</div>
		</FormSection>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { nextTick, ref, computed } from 'vue';
import { isSafeMode } from '@@/js/config.js';
import type { Plugin } from '@/plugin.js';
import FormLink from '@/components/form/link.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import FormSection from '@/components/form/section.vue';
import MkButton from '@/components/MkButton.vue';
import MkCode from '@/components/MkCode.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import MkFeatureBanner from '@/components/MkFeatureBanner.vue';
import MkInfo from '@/components/MkInfo.vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { changePluginActive, configPlugin, pluginLogs, uninstallPlugin, reloadPlugin } from '@/plugin.js';
import { prefer } from '@/preferences.js';
import * as os from '@/os.js';

const plugins = prefer.r.plugins;

async function uninstall(plugin: Plugin) {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.tsx.removeAreYouSure({ x: plugin.name }),
	});
	if (canceled) return;

	await uninstallPlugin(plugin);

	os.success();
}

function reload(plugin: Plugin) {
	reloadPlugin(plugin);
}

async function config(plugin: Plugin) {
	await configPlugin(plugin);
}

function changeActive(plugin: Plugin, active: boolean) {
	changePluginActive(plugin, active);
}

function timeToHhMmSs(unixtime: number) {
	return new Date(unixtime).toTimeString().split(' ')[0];
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.plugins,
	icon: 'ti ti-plug',
}));
</script>

<style module>
.log {
}

.isSystemLog {
	opacity: 0.5;
}
</style>
