<template>
<SearchMarker path="/settings/hanamode" :label="i18n.ts._hana.hanaMode" :keywords="['hana', 'mode']" icon="ti ti-hanamisskey-hanamode">
	<div class="_gaps">
		<FormSection first>
			<template #label>{{ i18n.ts._hana.hanaMode }}</template>
			<HanaHanaModeSwitcher></HanaHanaModeSwitcher>
		</FormSection>
	</div>
</SearchMarker>
</template>

<script setup lang="ts">
import FormSection from '@/components/form/section.vue';
import HanaHanaModeSwitcher from '@/components/HanaHanaModeSwitcher.vue';

import { i18n } from '@/i18n.js';
</script>
