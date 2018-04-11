import Vue from 'vue';

Vue.filter('bytes', (v, digits = 0) => {
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	if (v == 0) return '0Byte';
	const i = Math.floor(Math.log(v) / Math.log(1024));
	return (v / Math.pow(1024, i)).toFixed(digits).replace(/\.0+$/, '') + sizes[i];
});
