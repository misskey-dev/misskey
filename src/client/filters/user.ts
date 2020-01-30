import Vue from 'vue';
import getAcct from '../../misc/acct/render';
import getUserName from '../../misc/get-user-name';
import { url } from '../config';

Vue.filter('acct', user => {
	return getAcct(user);
});

Vue.filter('userName', user => {
	return getUserName(user);
});

Vue.filter('userPage', (user, path?, absolute = false) => {
	return `${absolute ? url : ''}/@${Vue.filter('acct')(user)}${(path ? `/${path}` : '')}`;
});
