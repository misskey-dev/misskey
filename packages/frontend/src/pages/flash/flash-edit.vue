<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="700">
		<div class="_gaps_m">
			<MkInput v-model="title">
				<template #label>{{ i18n.ts._play.title }}</template>
			</MkInput>
			<MkTextarea v-model="summary">
				<template #label>{{ i18n.ts._play.summary }}</template>
			</MkTextarea>
			<MkTextarea v-model="script" class="_monospace" tall spellcheck="false">
				<template #label>{{ i18n.ts._play.script }}</template>
			</MkTextarea>
			<div class="_buttons">
				<MkButton primary @click="save"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
				<MkButton @click="show"><i class="ti ti-eye"></i> {{ i18n.ts.show }}</MkButton>
			</div>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, onDeactivated, onUnmounted, Ref, ref, watch } from 'vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os';
import { url } from '@/config';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import MkTextarea from '@/components/MkTextarea.vue';
import MkInput from '@/components/MkInput.vue';
import { useRouter } from '@/router';

const router = useRouter();

const props = defineProps<{
	id?: string;
}>();

let flash = $ref(null);

if (props.id) {
	flash = await os.api('flash/show', {
		flashId: props.id,
	});
}

let title = $ref(flash?.title ?? 'New Play');
let summary = $ref(flash?.summary ?? '');
let permissions = $ref(flash?.permissions ?? []);
let script = $ref(flash?.script ?? `/// @ 0.12.2

var name = ""

Ui:render([
	Ui:C:textInput({
		label: "Your name"
		onInput: @(v) { name = v }
	})
	Ui:C:button({
		text: "Hello"
		onClick: @() {
			Mk:dialog(null \`Hello, {name}!\`)
		}
	})
])
`);

async function save() {
	if (flash) {
		os.apiWithDialog('flash/update', {
			flashId: props.id,
			title,
			summary,
			permissions,
			script,
		});
	} else {
		const created = await os.apiWithDialog('flash/create', {
			title,
			summary,
			permissions,
			script,
		});
		router.push('/play/' + created.id + '/edit');
	}
}

function show() {
	if (flash == null) {
		os.alert({
			text: 'Please save',
		});
	} else {
		os.pageWindow(`/play/${flash.id}`);
	}
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => flash ? {
	title: i18n.ts._play.edit + ': ' + flash.title,
} : {
	title: i18n.ts._play.new,
}));
</script>

<style lang="scss" scoped>

</style>
