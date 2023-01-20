<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<MkSpacer :content-max="1200">
		<MkAchievements :user="$i"/>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import MkAchievements from '@/components/MkAchievements.vue';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { $i } from '@/account';

definePageMetadata({
	title: i18n.ts.achievements,
	icon: 'ti ti-military-award',
});
</script>

<style lang="scss" module>

</style>
