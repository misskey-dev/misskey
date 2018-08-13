<template>
<div>
	<nav>
		<ul>
			<li @click="nav('dashboard')" :class="{ active: page == 'dashboard' }">%i18n:@dashboard%</li>
			<li @click="nav('drive')" :class="{ active: page == 'drive' }">%i18n:@drive%</li>
			<li @click="nav('users')" :class="{ active: page == 'users' }">%i18n:@users%</li>
			<li @click="nav('update')" :class="{ active: page == 'update' }">%i18n:@update%</li>
		</ul>
	</nav>
	<main>
		<div v-if="page == 'dashboard'">
			<x-dashboard/>
		</div>
		<div v-if="page == 'drive'"></div>
		<div v-if="page == 'users'">
			<x-suspend-user/>
		</div>
		<div v-if="page == 'update'"></div>
	</main>
</div>
</template>

<script lang="ts">
import Vue from "vue";
import XDashboard from "./admin.dashboard.vue";
import XSuspendUser from "./admin.suspend-user.vue";

export default Vue.extend({
	components: {
		XDashboard,
		XSuspendUser
	}
});
</script>
