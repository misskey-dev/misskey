const NProgress = require('nprogress');
NProgress.configure({
	trickleSpeed: 500,
	showSpinner: false
});

const root = document.getElementsByTagName('html')[0];

export default {
	start: () => {
		root.classList.add('progress');
		NProgress.start();
	},
	done: () => {
		root.classList.remove('progress');
		NProgress.done();
	},
	set: val => {
		NProgress.set(val);
	}
};
