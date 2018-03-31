import queue from '../queue';
import http from './http';

/*
	256 is the default concurrency limit of Mozilla Firefox and Google
	Chromium.

	a8af215e691f3a2205a3758d2d96e9d328e100ff - chromium/src.git - Git at Google
	https://chromium.googlesource.com/chromium/src.git/+/a8af215e691f3a2205a3758d2d96e9d328e100ff
	Network.http.max-connections - MozillaZine Knowledge Base
	http://kb.mozillazine.org/Network.http.max-connections
*/
export default () => queue.process('http', 256, http);
