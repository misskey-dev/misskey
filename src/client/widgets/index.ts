import Vue from 'vue';

Vue.component('mkw-memo', () => import('./memo.vue').then(m => m.default));
