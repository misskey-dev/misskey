import Vue from 'vue';

Vue.filter('number', (n) => {
	if (n == null) return 'N/A';
	return n.toLocaleString();
});
