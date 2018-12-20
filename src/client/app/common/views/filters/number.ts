import Vue from 'vue';

Vue.filter('number', n => n == null ? 'N/A' : n.toLocaleString());
