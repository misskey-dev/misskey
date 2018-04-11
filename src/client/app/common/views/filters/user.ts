import Vue from 'vue';
import getAcct from '../../../../../acct/render';
import getUserName from '../../../../../renderers/get-user-name';

Vue.filter('acct', user => {
	return getAcct(user);
});

Vue.filter('userName', user => {
	return getUserName(user);
});

Vue.filter('userPage', (user, path?) => {
	return '/@' + Vue.filter('acct')(user) + (path ? '/' + path : '');
});
