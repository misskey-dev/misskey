import { UAParser } from 'ua-parser-js';
const ua = new UAParser(navigator.userAgent);
export const isWebKit = () => ua.getEngine().name === 'WebKit';
