<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only

📝 O'zbekcha izoh:
Bu sahifa - Oddiy xush kelibsiz sahifasi
Foydalanuvchi tizimga kirmagan vaqtda ko'rsatiladi
Dashboard va reklama fotosuratlarini ko'rsatadi
-->

<template>
<div v-if="meta" :class="$style.root">
	<!-- Fon surati - Tavsiya etilgan fotosuratlar -->
	<MkFeaturedPhotos :class="$style.bg"/>
	<!-- Logo shakli -->
	<div :class="$style.logoWrapper">
		<div :class="$style.poweredBy">Powered by</div>
		<img :src="misskeysvg" :class="$style.misskey"/>
	</div>
	<!-- Asosiy kontent - Foydalanuvchi boshqruvi paneli -->
	<div :class="$style.contents">
		<MkVisitorDashboard/>
	</div>
</div>
</template>

<script lang="ts" setup>
import MkFeaturedPhotos from '@/components/MkFeaturedPhotos.vue';
import misskeysvg from '/client-assets/misskey.svg';
import MkVisitorDashboard from '@/components/MkVisitorDashboard.vue';
import { instance as meta } from '@/instance.js';
</script>

<style lang="scss" module>
// Asosiy container - toq balandlik
.root {
	height: 100cqh;
	overflow: auto;
	overscroll-behavior: contain;
}

// Fon surati - to'liq ekran
.bg {
	position: fixed;
	top: 0;
	right: 0;
	width: 100vw;
	height: 100vh;
}

// Logo shakli - chumasi
.logoWrapper {
	position: fixed;
	top: 36px;
	left: 36px;
	flex: auto;
	color: #fff;
	user-select: none;
	pointer-events: none;
}

// "Powered By" matnini
.poweredBy {
	margin-bottom: 2px;
}

// Misskey logotipi
.misskey {
	width: 120px;

	// Mobil qurilmalar uchun
	@media (max-width: 450px) {
		width: 100px;
	}
}

// Asosiy kontent qismi - markaziylashtirilgan
.contents {
	position: relative;
	width: min(430px, calc(100% - 32px));
	margin: auto;
	padding: 100px 0 100px 0;
}
</style>
