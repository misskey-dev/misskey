<!--
SPDX-FileCopyrightText: syuilo and misskey-project , Type4ny-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<div v-if="!loading" class="_gaps">
		<MkInfo>{{ i18n.tsx._profile.avatarDecorationMax({ max: $i.policies.avatarDecorationLimit }) }} ({{ i18n.tsx.remainingN({ n: $i.policies.avatarDecorationLimit - $i.avatarDecorations.length }) }})</MkInfo>

		<MkAvatar :class="$style.avatar" :user="$i" forceShowDecoration/>

		<div v-if="$i.avatarDecorations.length > 0" v-panel :class="$style.current" class="_gaps_s">
			<div>{{ i18n.ts.inUse }}</div>

			<div :class="$style.decorations">
				<XDecoration
					v-for="(avatarDecoration, i) in $i.avatarDecorations"
					:decoration="avatarDecorations.find(d => d.id === avatarDecoration.id)"
					:angle="avatarDecoration.angle"
					:flipH="avatarDecoration.flipH"
					:offsetX="avatarDecoration.offsetX"
					:offsetY="avatarDecoration.offsetY"
					:active="true"
					@click="openDecoration(avatarDecoration, i)"
				/>
			</div>

			<MkButton danger @click="detachAllDecorations">{{ i18n.ts.detachAll }}</MkButton>
		</div>
		<MkInput v-model="q" :placeholder="i18n.ts.search"/>
		<div v-if="searchResult.length > 0" :class="$style.decorations">
			<span> {{ i18n.ts.searchResult }}</span><br>
			<XDecoration
				v-for="avatarDecoration in searchResult"
				:key="avatarDecoration.name"
				:decoration="avatarDecoration"
				@click="openDecoration(avatarDecoration)"
			/>
		</div>
		<div v-for="category in categories">
			<MkFoldableSection :expanded="false">
				<template #header> {{ (category !== '') ? category : i18n.ts.other }}</template>
				<div :class="$style.decorations">
					<div v-for="avatarDecoration in avatarDecorations.filter(ad => ad.category === category)">
						<XDecoration
							:key="avatarDecoration.id"
							:decoration="avatarDecoration"
							@click="openDecoration(avatarDecoration)"
						/>
					</div>
				</div>
			</MkFoldableSection>
		</div>
	</div>
	<div v-else>
		<MkLoading/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, defineAsyncComponent, computed, watch } from 'vue';
import * as Misskey from 'misskey-js';
import XDecoration from './avatar-decoration.decoration.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { signinRequired } from '@/account.js';
import MkInfo from '@/components/MkInfo.vue';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import MkInput from '@/components/MkInput.vue';

const $i = signinRequired();
const searchResult = ref([]);
const loading = ref(true);
const avatarDecorations = ref<Misskey.entities.GetAvatarDecorationsResponse & { category:string }>([]);
const q = ref<string>('');
watch(() => q.value, () => {
	const searchCustom = () => {
		const max = 100;
		const matches = new Set();
		const decos = avatarDecorations.value;
		const exactMatch = decos.find(avatarDecoration => avatarDecoration.name === q.value);
		if (exactMatch) matches.add(exactMatch);

		if (decos.includes(' ')) { // AND検索
			const keywords = q.value.split(' ');

			// 名前にキーワードが含まれている
			for (const deco of decos) {
				if (keywords.every(keyword => deco.name.includes(keyword))) {
					matches.add(deco);
					if (matches.size >= max) break;
				}
			}
			if (matches.size >= max) return matches;

			// 名前またはエイリアスにキーワードが含まれている
			for (const deco of decos) {
				if (keywords.every(keyword => deco.name.includes(keyword))) {
					matches.add(deco);
					if (matches.size >= max) break;
				}
			}
		} else {
			for (const deco of decos) {
				if (deco.name.startsWith(q.value)) {
					matches.add(deco);
					if (matches.size >= max) break;
				}
			}
			if (matches.size >= max) return matches;

			for (const deco of decos) {
				if (deco.name.includes(q.value)) {
					matches.add(deco);
					if (matches.size >= max) break;
				}
			}
			if (matches.size >= max) return matches;
		}

		return matches;
	};
	searchResult.value = Array.from(searchCustom());
});
misskeyApi('get-avatar-decorations').then(_avatarDecorations => {
	avatarDecorations.value = _avatarDecorations;
	loading.value = false;
});
const categories = computed(() => {
	const allCategories = avatarDecorations.value.map(ad => ad.category);
	const uniqueCategories = [...new Set(allCategories)];
	return uniqueCategories.sort();
});

function openDecoration(avatarDecoration, index?: number) {
	const { dispose } = os.popup(defineAsyncComponent(() => import('./avatar-decoration.dialog.vue')), {
		decoration: avatarDecoration,
		usingIndex: index,
	}, {
		'attach': async (payload) => {
			const decoration = {
				id: avatarDecoration.id,
				angle: payload.angle,
				flipH: payload.flipH,
				offsetX: payload.offsetX,
				offsetY: payload.offsetY,
			};
			const update = [...$i.avatarDecorations, decoration];
			await os.apiWithDialog('i/update', {
				avatarDecorations: update,
			});
			$i.avatarDecorations = update;
		},
		'update': async (payload) => {
			const decoration = {
				id: avatarDecoration.id,
				angle: payload.angle,
				flipH: payload.flipH,
				offsetX: payload.offsetX,
				offsetY: payload.offsetY,
			};
			const update = [...$i.avatarDecorations];
			update[index] = decoration;
			await os.apiWithDialog('i/update', {
				avatarDecorations: update,
			});
			$i.avatarDecorations = update;
		},
		'detach': async () => {
			const update = [...$i.avatarDecorations];
			update.splice(index, 1);
			await os.apiWithDialog('i/update', {
				avatarDecorations: update,
			});
			$i.avatarDecorations = update;
		},
		closed: () => dispose(),
	});
}

function detachAllDecorations() {
	os.confirm({
		type: 'warning',
		text: i18n.ts.areYouSure,
	}).then(async ({ canceled }) => {
		if (canceled) return;
		await os.apiWithDialog('i/update', {
			avatarDecorations: [],
		});
		$i.avatarDecorations = [];
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.avatarDecorations,
	icon: 'ti ti-sparkles',
}));
</script>

<style lang="scss" module>
.avatar {
	display: inline-block;
	width: 72px;
	height: 72px;
	margin: 16px auto;
}

.current {
	padding: 16px;
	border-radius: var(--radius);
}

.decorations {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
	grid-gap: 12px;
}
</style>
