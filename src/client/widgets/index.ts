import Vue from 'vue';

Vue.component('mkw-memo', () => import('./memo.vue').then(m => m.default));
Vue.component('mkw-notifications', () => import('./notifications.vue').then(m => m.default));
