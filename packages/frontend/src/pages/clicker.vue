<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<MkSpacer :content-max="800">
		<MkClickerGame/>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import MkClickerGame from '@/components/MkClickerGame.vue';
import { definePageMetadata } from '@/scripts/page-metadata';

definePageMetadata({
	title: '🍪👈',
	icon: 'ti ti-cookie',
});
</script>

<style lang="scss" module>

</style>
