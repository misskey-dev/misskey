import Vue from 'vue';

Vue.filter('number', (n) => {
	return n.toLocaleString();
});
