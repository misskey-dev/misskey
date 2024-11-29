<template>
<div class="_gaps">
	<FormSection first>
		<template #label>{{ i18n.ts._hana.hanaMode }}</template>
		<HanaHanaModeSwitcher></HanaHanaModeSwitcher>
	</FormSection>
</div>
</template>

<script setup lang="ts">
import FormSection from '@/components/form/section.vue';
import HanaHanaModeSwitcher from '@/components/HanaHanaModeSwitcher.vue';

import { i18n } from '@/i18n.js';
</script>
