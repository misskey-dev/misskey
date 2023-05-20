<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="800">
		<MkNotes class="" :pagination="pagination"/>
	</MkSpacer>
	<template v-if="$i" #footer>
		<div :class="$style.footer">
			<MkSpacer :contentMax="800" :marginMin="16" :marginMax="16">
				<MkButton rounded primary :class="$style.button" @click="post()"><i class="ti ti-pencil"></i>{{ i18n.ts.postToHashTag }}</MkButton>
			</MkSpacer>
		</div>
	</template>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkNotes from '@/components/MkNotes.vue';
import MkButton from '@/components/MkButton.vue';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';
import { $i } from '@/account';
import { defaultStore } from '@/store';
import * as os from '@/os';

const props = defineProps<{
	tag: string;
}>();

const pagination = {
	endpoint: 'notes/search-by-tag' as const,
	limit: 10,
	params: computed(() => ({
		tag: props.tag,
	})),
};

const post = async () => {
	defaultStore.makeGetterSetter('postFormHashtags').set(props.tag);
	defaultStore.makeGetterSetter('postFormWithHashtags').set(true);
	await os.post();
	defaultStore.makeGetterSetter('postFormHashtags').set('');
	defaultStore.makeGetterSetter('postFormWithHashtags').set(false);
	location.reload();
};

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => ({
	title: props.tag,
	icon: 'ti ti-hash',
})));
</script>
<style lang="scss" module>
.footer {
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
	border-top: solid 0.5px var(--divider);
	display: flex;
}

.button {
		margin: 0 auto var(--margin) auto;
}
</style>
