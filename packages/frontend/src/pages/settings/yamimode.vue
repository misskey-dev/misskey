<template>
<div class="_gaps">
	<FormSection first>
		<template #label>{{ i18n.ts._yami.yamiMode }}</template>
		<YamiModeSwitcher></YamiModeSwitcher>
	</FormSection>
</div>
</template>

<script setup lang="ts">
import FormSection from '@/components/form/section.vue';
import YamiModeSwitcher from '@/components/YamiModeSwitcher.vue';

import { i18n } from '@/i18n.js';
</script>
