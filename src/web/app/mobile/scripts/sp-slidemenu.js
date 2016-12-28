/**
 * sp-slidemenu.js
 *
 * @version  0.1.0
 * @url https://github.com/be-hase/sp-slidemenu
 *
 * Copyright 2013 be-hase.com, Inc.
 * Licensed under the MIT License:
 * http://www.opensource.org/licenses/mit-license.php
 */

/**
 * CUSTOMIZED BY SYUILO
 */

; (function(window, document, undefined) {
	"use strict";
	var div, PREFIX, support, gestureStart, EVENTS, ANIME_SPEED, SLIDE_STATUS, SCROLL_STATUS, THRESHOLD, EVENT_MOE_TIME, rclass, ITEM_CLICK_CLASS_NAME;
	div = document.createElement('div');
	PREFIX = ['webkit', 'moz', 'o', 'ms'];
	support = SpSlidemenu.support = {};
	support.transform3d = hasProp([
		'perspectiveProperty',
		'WebkitPerspective',
		'MozPerspective',
		'OPerspective',
		'msPerspective'
	]);
	support.transform = hasProp([
		'transformProperty',
		'WebkitTransform',
		'MozTransform',
		'OTransform',
		'msTransform'
	]);
	support.transition = hasProp([
		'transitionProperty',
		'WebkitTransitionProperty',
		'MozTransitionProperty',
		'OTransitionProperty',
		'msTransitionProperty'
	]);
	support.addEventListener = 'addEventListener' in window;
	support.msPointer = window.navigator.msPointerEnabled;
	support.cssAnimation = (support.transform3d || support.transform) && support.transition;
	support.touch = 'ontouchend' in window;
	EVENTS = {
		start: {
			touch: 'touchstart',
			mouse: 'mousedown'
		},
		move: {
			touch: 'touchmove',
			mouse: 'mousemove'
		},
		end: {
			touch: 'touchend',
			mouse: 'mouseup'
		}
	};
	gestureStart = false;
	if (support.addEventListener) {
		document.addEventListener('gesturestart', function() {
			gestureStart = true;
		});
		document.addEventListener('gestureend', function() {
			gestureStart = false;
		});
	}
	ANIME_SPEED = {
		slider: 200,
		scrollOverBack: 400
	};
	SLIDE_STATUS = {
		close: 0,
		open: 1,
		progress: 2
	};
	THRESHOLD = 10;
	EVENT_MOE_TIME = 50;
	rclass = /[\t\r\n\f]/g;
	ITEM_CLICK_CLASS_NAME = 'menu-item';
	/*
	[MEMO]
	SpSlidemenu properties which is not function is ...
	-- element --
	element: main
	element: slidemenu
	element: button
	element: slidemenuBody
	element: slidemenuContent
	element: slidemenuHeader
	-- options --
	bool: disableCssAnimation
	bool: disabled3d
	-- animation --
	bool: useCssAnimation
	bool: use3d
	-- slide --
	int: slideWidth
	string: htmlOverflowX
	string: bodyOverflowX
	int: buttonStartPageX
	int: buttonStartPageY
	-- scroll --
	bool: scrollTouchStarted
	bool: scrollMoveReady
	int: scrollStartPageX
	int: scrollStartPageY
	int: scrollBasePageY
	int: scrollTimeForVelocity
	int: scrollCurrentY
	int: scrollMoveEventCnt
	int: scrollAnimationTimer
	int: scrollOverTimer
	int: scrollMaxY
	*/
	function SpSlidemenu(main, slidemenu, button, options) {
		if (this instanceof SpSlidemenu) {
			return this.init(main, slidemenu, button, options);
		} else {
			return new SpSlidemenu(main, slidemenu, button, options);
		}
	}
	SpSlidemenu.prototype.init = function(main, slidemenu, button, options) {
		var _this = this;
		// find and set element.
		_this.setElement(main, slidemenu, button);
		if (!_this.main || !_this.slidemenu || !_this.button || !_this.slidemenuBody || !_this.slidemenuContent) {
			throw new Error('Element not found. Please set correctly.');
		}
		// options
		options = options || {};
		_this.disableCssAnimation = (options.disableCssAnimation === undefined) ? false : options.disableCssAnimation;
		_this.disable3d = (options.disable3d === undefined) ? false : options.disable3d;
		_this.direction = 'left';
		if (options.direction === 'right') {
			_this.direction = 'right';
		}
		// animation
		_this.useCssAnimation = support.cssAnimation;
		if (_this.disableCssAnimation === true) {
			_this.useCssAnimation = false;
		}
		_this.use3d = support.transform3d;
		if (_this.disable3d === true) {
			_this.use3d = false;
		}
		// slide
		_this.slideWidth = (getDimentions(_this.slidemenu)).width;
		_this.main.SpSlidemenuStatus = SLIDE_STATUS.close;
		_this.htmlOverflowX = '';
		_this.bodyOverflowX = '';
		// scroll
		_this.scrollCurrentY = 0;
		_this.scrollAnimationTimer = false;
		_this.scrollOverTimer = false;
		// set default style.
		_this.setDefaultStyle();
		// bind some method for callback.
		_this.bindMethods();
		// add event
		addTouchEvent('start', _this.button, _this.buttonTouchStart, false);
		addTouchEvent('move', _this.button, blockEvent, false);
		addTouchEvent('end', _this.button, _this.buttonTouchEnd, false);
		addTouchEvent('start', _this.slidemenuContent, _this.scrollTouchStart, false);
		addTouchEvent('move', _this.slidemenuContent, _this.scrollTouchMove, false);
		addTouchEvent('end', _this.slidemenuContent, _this.scrollTouchEnd, false);
		_this.slidemenuContent.addEventListener('click', _this.itemClick, false);
		// window size change
		window.addEventListener('resize', debounce(_this.setHeight, 100), false);
		return _this;
	};
	SpSlidemenu.prototype.bindMethods = function() {
		var _this, funcs;
		_this = this;
		funcs = [
			'setHeight',
			'slideOpen', 'slideOpenEnd', 'slideClose', 'slideCloseEnd',
			'buttonTouchStart', 'buttonTouchEnd', 'mainTouchStart',
			'scrollTouchStart', 'scrollTouchMove', 'scrollTouchEnd', 'scrollInertiaMove', 'scrollOverBack', 'scrollOver',
			'itemClick'
		];
		funcs.forEach(function(func) {
			_this[func] = bind(_this[func], _this);
		});
	};
	SpSlidemenu.prototype.setElement = function(main, slidemenu, button) {
		var _this = this;
		_this.main = main;
		if (typeof main === 'string') {
			_this.main = document.querySelector(main);
		}
		_this.slidemenu = slidemenu;
		if (typeof slidemenu === 'string') {
			_this.slidemenu = document.querySelector(slidemenu);
		}
		_this.button = button;
		if (typeof button === 'string') {
			_this.button = document.querySelector(button);
		}
		if (!_this.slidemenu) {
			return;
		}
		_this.slidemenuBody = _this.slidemenu.querySelector('.body');
		_this.slidemenuContent = _this.slidemenu.querySelector('.content');
		_this.slidemenuHeader = _this.slidemenu.querySelector('.header');
	};
	SpSlidemenu.prototype.setDefaultStyle = function() {
		var _this = this;
		if (support.msPointer) {
			_this.slidemenuContent.style.msTouchAction = 'none';
		}
		_this.setHeight();
		if (_this.useCssAnimation) {
			setStyles(_this.main, {
				transitionProperty: getCSSName('transform'),
				transitionTimingFunction: 'ease-in-out',
				transitionDuration: ANIME_SPEED.slider + 'ms',
				transitionDelay: '0ms',
				transform: _this.getTranslateX(0)
			});
			setStyles(_this.slidemenu, {
				transitionProperty: 'visibility',
				transitionTimingFunction: 'linear',
				transitionDuration: '0ms',
				transitionDelay: ANIME_SPEED.slider + 'ms'
			});
			setStyles(_this.slidemenuContent, {
				transitionProperty: getCSSName('transform'),
				transitionTimingFunction: 'ease-in-out',
				transitionDuration: '0ms',
				transitionDelay: '0ms',
				transform: _this.getTranslateY(0)
			});
		} else {
			setStyles(_this.main, {
				position: 'relative',
				left: '0px'
			});
			setStyles(_this.slidemenuContent, {
				top: '0px'
			});
		}
	};
	SpSlidemenu.prototype.setHeight = function(event) {
		var _this, browserHeight;
		_this = this;
		browserHeight = getBrowserHeight();
		setStyles(_this.main, {
			minHeight: browserHeight + 'px'
		});
		setStyles(_this.slidemenu, {
			height: browserHeight + 'px'
		});
	};
	SpSlidemenu.prototype.buttonTouchStart = function(event) {
		var _this = this;
		event.preventDefault();
		event.stopPropagation();
		switch (_this.main.SpSlidemenuStatus) {
			case SLIDE_STATUS.progress:
				break;
			case SLIDE_STATUS.open:
			case SLIDE_STATUS.close:
				_this.buttonStartPageX = getPage(event, 'pageX');
				_this.buttonStartPageY = getPage(event, 'pageY');
				break;
		}
	};
	SpSlidemenu.prototype.buttonTouchEnd = function(event) {
		var _this = this;
		event.preventDefault();
		event.stopPropagation();
		if (_this.shouldTrigerNext(event)) {
			switch (_this.main.SpSlidemenuStatus) {
				case SLIDE_STATUS.progress:
					break;
				case SLIDE_STATUS.open:
					_this.slideClose(event);
					break;
				case SLIDE_STATUS.close:
					_this.slideOpen(event);
					break;
			}
		}
	};
	SpSlidemenu.prototype.mainTouchStart = function(event) {
		var _this = this;
		event.preventDefault();
		event.stopPropagation();
		_this.slideClose(event);
	};
	SpSlidemenu.prototype.shouldTrigerNext = function(event) {
		var _this = this,
			buttonEndPageX = getPage(event, 'pageX'),
			buttonEndPageY = getPage(event, 'pageY'),
			deltaX = Math.abs(buttonEndPageX - _this.buttonStartPageX),
			deltaY = Math.abs(buttonEndPageY - _this.buttonStartPageY);
		return deltaX < 20 && deltaY < 20;
	};
	SpSlidemenu.prototype.slideOpen = function(event) {
		var _this = this, toX;

		/// Misskey Original
		document.body.setAttribute('data-nav-open', 'true');

		if (_this.direction === 'left') {
			toX = _this.slideWidth;
		} else {
			toX = -_this.slideWidth;
		}
		_this.main.SpSlidemenuStatus = SLIDE_STATUS.progress;
		//set event
		addTouchEvent('move', document, blockEvent, false);
		// change style
		_this.htmlOverflowX = document.documentElement.style['overflowX'];
		_this.bodyOverflowX = document.body.style['overflowX'];
		document.documentElement.style['overflowX'] = document.body.style['overflowX'] = 'hidden';
		if (_this.useCssAnimation) {
			setStyles(_this.main, {
				transform: _this.getTranslateX(toX)
			});
			setStyles(_this.slidemenu, {
				transitionProperty: 'z-index',
				visibility: 'visible',
				zIndex: '1'
			});
		} else {
			animate(_this.main, _this.direction, toX, ANIME_SPEED.slider);
			setStyles(_this.slidemenu, {
				visibility: 'visible'
			});
		}
		// set callback
		setTimeout(_this.slideOpenEnd, ANIME_SPEED.slider + EVENT_MOE_TIME);
	};
	SpSlidemenu.prototype.slideOpenEnd = function() {
		var _this = this;
		_this.main.SpSlidemenuStatus = SLIDE_STATUS.open;
		// change style
		if (_this.useCssAnimation) {
		} else {
			setStyles(_this.slidemenu, {
				zIndex: '1'
			});
		}
		// add event
		addTouchEvent('start', _this.main, _this.mainTouchStart, false);
	};
	SpSlidemenu.prototype.slideClose = function(event) {
		var _this = this;
		_this.main.SpSlidemenuStatus = SLIDE_STATUS.progress;

		/// Misskey Original
		document.body.setAttribute('data-nav-open', 'false');

		//event
		removeTouchEvent('start', _this.main, _this.mainTouchStart, false);
		// change style
		if (_this.useCssAnimation) {
			setStyles(_this.main, {
				transform: _this.getTranslateX(0)
			});
			setStyles(_this.slidemenu, {
				transitionProperty: 'visibility',
				visibility: 'hidden',
				zIndex: '-1'
			});
		} else {
			animate(_this.main, _this.direction, 0, ANIME_SPEED.slider);
			setStyles(_this.slidemenu, {
				zIndex: '-1'
			});
		}
		// set callback
		setTimeout(_this.slideCloseEnd, ANIME_SPEED.slider + EVENT_MOE_TIME);
	};
	SpSlidemenu.prototype.slideCloseEnd = function() {
		var _this = this;
		_this.main.SpSlidemenuStatus = SLIDE_STATUS.close;
		// change style
		document.documentElement.style['overflowX'] = _this.htmlOverflowX;
		document.body.style['overflowX'] = _this.bodyOverflowX;
		if (_this.useCssAnimation) {
		} else {
			setStyles(_this.slidemenu, {
				visibility: 'hidden'
			});
		}
		// set event
		removeTouchEvent('move', document, blockEvent, false);
	};
	SpSlidemenu.prototype.scrollTouchStart = function(event) {
		var _this = this;
		if (gestureStart) {
			return;
		}
		if (_this.scrollOverTimer !== false) {
			clearTimeout(_this.scrollOverTimer);
		}
		_this.scrollCurrentY = _this.getScrollCurrentY();
		if (_this.useCssAnimation) {
			setStyles(_this.slidemenuContent, {
				transitionTimingFunction: 'ease-in-out',
				transitionDuration: '0ms',
				transform: _this.getTranslateY(_this.scrollCurrentY)
			});
		} else {
			_this.stopScrollAnimate();
			setStyles(_this.slidemenuContent, {
				top: _this.scrollCurrentY + 'px'
			});
		}
		_this.scrollOverTimer = false;
		_this.scrollAnimationTimer = false;
		_this.scrollTouchStarted = true;
		_this.scrollMoveReady = false;
		_this.scrollMoveEventCnt = 0;
		_this.scrollMaxY = _this.calcMaxY();
		_this.scrollStartPageX = getPage(event, 'pageX');
		_this.scrollStartPageY = getPage(event, 'pageY');
		_this.scrollBasePageY = _this.scrollStartPageY;
		_this.scrollTimeForVelocity = event.timeStamp;
		_this.scrollPageYForVelocity = _this.scrollStartPageY;
		_this.slidemenuContent.removeEventListener('click', blockEvent, true);
	};
	SpSlidemenu.prototype.scrollTouchMove = function(event) {
		var _this, pageX, pageY, distY, newY, deltaX, deltaY;
		_this = this;
		if (!_this.scrollTouchStarted || gestureStart) {
			return;
		}
		pageX = getPage(event, 'pageX');
		pageY = getPage(event, 'pageY');
		if (_this.scrollMoveReady) {
			event.preventDefault();
			event.stopPropagation();
			distY = pageY - _this.scrollBasePageY;
			newY = _this.scrollCurrentY + distY;
			if (newY > 0 || newY < _this.scrollMaxY) {
				newY = Math.round(_this.scrollCurrentY + distY / 3);
			}
			_this.scrollSetY(newY);
			if (_this.scrollMoveEventCnt % THRESHOLD === 0) {
				_this.scrollPageYForVelocity = pageY;
				_this.scrollTimeForVelocity = event.timeStamp;
			}
			_this.scrollMoveEventCnt++;
		} else {
			deltaX = Math.abs(pageX - _this.scrollStartPageX);
			deltaY = Math.abs(pageY - _this.scrollStartPageY);
			if (deltaX > 5 || deltaY > 5) {
				_this.scrollMoveReady = true;
				_this.slidemenuContent.addEventListener('click', blockEvent, true);
			}
		}
		_this.scrollBasePageY = pageY;
	};
	SpSlidemenu.prototype.scrollTouchEnd = function(event) {
		var _this, speed, deltaY, deltaTime;
		_this = this;
		if (!_this.scrollTouchStarted) {
			return;
		}
		_this.scrollTouchStarted = false;
		_this.scrollMaxY = _this.calcMaxY();
		if (_this.scrollCurrentY > 0 || _this.scrollCurrentY < _this.scrollMaxY) {
			_this.scrollOverBack();
			return;
		}
		deltaY = getPage(event, 'pageY') - _this.scrollPageYForVelocity;
		deltaTime = event.timeStamp - _this.scrollTimeForVelocity;
		speed = deltaY / deltaTime;
		if (Math.abs(speed) >= 0.01) {
			_this.scrollInertia(speed);
		}
	};
	SpSlidemenu.prototype.scrollInertia = function(speed) {
		var _this, directionToTop, maxTo, distanceMaxTo, stopTime, canMove, to, duration, speedAtboundary, nextTo;
		_this = this;
		if (speed > 0) {
			directionToTop = true;
			maxTo = 0;
		} else {
			directionToTop = false;
			maxTo = _this.scrollMaxY;
		}
		distanceMaxTo = Math.abs(_this.scrollCurrentY - maxTo);
		speed = Math.abs(750 * speed);
		if (speed > 1000) {
			speed = 1000;
		}
		stopTime = speed / 500;
		canMove = (speed * stopTime) - ((500 * Math.pow(stopTime, 2)) / 2);
		if (canMove <= distanceMaxTo) {
			if (directionToTop) {
				to = _this.scrollCurrentY + canMove;
			} else {
				to = _this.scrollCurrentY - canMove;
			}
			duration = stopTime * 1000;
			_this.scrollInertiaMove(to, duration, false);
		} else {
			to = maxTo;
			speedAtboundary = Math.sqrt((2 * 500 * distanceMaxTo) + Math.pow(speed, 2));
			duration = (speedAtboundary - speed) / 500 * 1000;
			_this.scrollInertiaMove(to, duration, true, speedAtboundary, directionToTop);
		}
	};
	SpSlidemenu.prototype.scrollInertiaMove = function(to, duration, isOver, speed, directionToTop) {
		var _this = this, stopTime, canMove;
		_this.scrollCurrentY = to;
		if (_this.useCssAnimation) {
			setStyles(_this.slidemenuContent, {
				transitionTimingFunction: 'cubic-bezier(0.33, 0.66, 0.66, 1)',
				transitionDuration: duration + 'ms',
				transform: _this.getTranslateY(to)
			});
		} else {
			_this.scrollAnimate(to, duration);
		}
		if (!isOver) {
			return;
		}
		stopTime = speed / 7500;
		canMove = (speed * stopTime) - ((7500 * Math.pow(stopTime, 2)) / 2);
		if (directionToTop) {
			to = _this.scrollCurrentY + canMove;
		} else {
			to = _this.scrollCurrentY - canMove;
		}
		duration = stopTime * 1000;
		_this.scrollOver(to, duration);
	};
	SpSlidemenu.prototype.scrollOver = function(to, duration) {
		var _this;
		_this = this;
		_this.scrollCurrentY = to;
		if (_this.useCssAnimation) {
			setStyles(_this.slidemenuContent, {
				transitionTimingFunction: 'cubic-bezier(0.33, 0.66, 0.66, 1)',
				transitionDuration: duration + 'ms',
				transform: _this.getTranslateY(to)
			});
		} else {
			_this.scrollAnimate(to, duration);
		}
		_this.scrollOverTimer = setTimeout(_this.scrollOverBack, duration);
	};
	SpSlidemenu.prototype.scrollOverBack = function() {
		var _this, to;
		_this = this;
		if (_this.scrollCurrentY >= 0) {
			to = 0;
		} else {
			to = _this.scrollMaxY;
		}
		_this.scrollCurrentY = to;
		if (_this.useCssAnimation) {
			setStyles(_this.slidemenuContent, {
				transitionTimingFunction: 'ease-out',
				transitionDuration: ANIME_SPEED.scrollOverBack + 'ms',
				transform: _this.getTranslateY(to)
			});
		} else {
			_this.scrollAnimate(to, ANIME_SPEED.scrollOverBack);
		}
	};
	SpSlidemenu.prototype.scrollSetY = function(y) {
		var _this = this;
		_this.scrollCurrentY = y;
		if (_this.useCssAnimation) {
			setStyles(_this.slidemenuContent, {
				transitionTimingFunction: 'ease-in-out',
				transitionDuration: '0ms',
				transform: _this.getTranslateY(y)
			});
		} else {
			_this.slidemenuContent.style.top = y + 'px';
		}
	};
	SpSlidemenu.prototype.scrollAnimate = function(to, transitionDuration) {
		var _this = this;
		_this.stopScrollAnimate();
		_this.scrollAnimationTimer = animate(_this.slidemenuContent, 'top', to, transitionDuration);
	};
	SpSlidemenu.prototype.stopScrollAnimate = function() {
		var _this = this;
		if (_this.scrollAnimationTimer !== false) {
			clearInterval(_this.scrollAnimationTimer);
		}
	};
	SpSlidemenu.prototype.itemClick = function(event) {
		var elem = event.target || event.srcElement;
		if (hasClass(elem, ITEM_CLICK_CLASS_NAME)) {
			this.slideClose();
		}
	};
	SpSlidemenu.prototype.calcMaxY = function(x) {
		var _this, contentHeight, bodyHeight, headerHeight;
		_this = this;
		contentHeight = _this.slidemenuContent.offsetHeight;
		bodyHeight = _this.slidemenuBody.offsetHeight;
		headerHeight = 0;
		if (_this.slidemenuHeader) {
			headerHeight = _this.slidemenuHeader.offsetHeight;
		}
		if (contentHeight > bodyHeight) {
			return -(contentHeight - bodyHeight + headerHeight);
		} else {
			return 0;
		}
	};
	SpSlidemenu.prototype.getScrollCurrentY = function() {
		var ret = 0;
		if (this.useCssAnimation) {
			getStyle(window.getComputedStyle(this.slidemenuContent, ''), 'transform').split(',').forEach(function(value) {
				var number = parseInt(value, 10);
				if (!isNaN(number) && number !== 0 && number !== 1) {
					ret = number;
				}
			});
		} else {
			var number = parseInt(getStyle(window.getComputedStyle(this.slidemenuContent, ''), 'top'), 10);
			if (!isNaN(number) && number !== 0 && number !== 1) {
				ret = number;
			}
		}
		return ret;
	};
	SpSlidemenu.prototype.getTranslateX = function(x) {
		var _this = this;
		return _this.use3d ? 'translate3d(' + x + 'px, 0px, 0px)' : 'translate(' + x + 'px, 0px)';
	};
	SpSlidemenu.prototype.getTranslateY = function(y) {
		var _this = this;
		return _this.use3d ? 'translate3d(0px, ' + y + 'px, 0px)' : 'translate(0px, ' + y + 'px)';
	};
	//Utility Function
	function hasProp(props) {
		return some(props, function(prop) {
			return div.style[prop] !== undefined;
		});
	}
	function upperCaseFirst(str) {
		return str.charAt(0).toUpperCase() + str.substr(1);
	}
	function some(ary, callback) {
		var i, len;
		for (i = 0, len = ary.length; i < len; i++) {
			if (callback(ary[i], i)) {
				return true;
			}
		}
		return false;
	}
	function setStyle(elem, prop, val) {
		var style = elem.style;
		if (!setStyle.cache) {
			setStyle.cache = {};
		}
		if (setStyle.cache[prop] !== undefined) {
			style[setStyle.cache[prop]] = val;
			return;
		}
		if (style[prop] !== undefined) {
			setStyle.cache[prop] = prop;
			style[prop] = val;
			return;
		}
		some(PREFIX, function(_prefix) {
			var _prop = upperCaseFirst(_prefix) + upperCaseFirst(prop);
			if (style[_prop] !== undefined) {
				//setStyle.cache[prop] = _prop;
				style[_prop] = val;
				return true;
			}
		});
	}
	function setStyles(elem, styles) {
		var style, prop;
		for (prop in styles) {
			if (styles.hasOwnProperty(prop)) {
				setStyle(elem, prop, styles[prop]);
			}
		}
	}
	function getStyle(style, prop) {
		var ret;
		if (style[prop] !== undefined) {
			return style[prop];
		}
		some(PREFIX, function(_prefix) {
			var _prop = upperCaseFirst(_prefix) + upperCaseFirst(prop);
			if (style[_prop] !== undefined) {
				ret = style[_prop];
				return true;
			}
		});
		return ret;
	}
	function getCSSName(prop) {
		var ret;
		if (!getCSSName.cache) {
			getCSSName.cache = {};
		}
		if (getCSSName.cache[prop] !== undefined) {
			return getCSSName.cache[prop];
		}
		if (div.style[prop] !== undefined) {
			getCSSName.cache[prop] = prop;
			return prop;
		}
		some(PREFIX, function(_prefix) {
			var _prop = upperCaseFirst(_prefix) + upperCaseFirst(prop);
			if (div.style[_prop] !== undefined) {
				ret = '-' + _prefix + '-' + prop;
				return true;
			}
		});
		getCSSName.cache[prop] = ret;
		return ret;
	}
	function bind(func, context) {
		var nativeBind, slice, args;
		nativeBind = Function.prototype.bind;
		slice = Array.prototype.slice;
		if (func.bind === nativeBind && nativeBind) {
			return nativeBind.apply(func, slice.call(arguments, 1));
		}
		args = slice.call(arguments, 2);
		return function() {
			return func.apply(context, args.concat(slice.call(arguments)));
		};
	}
	function blockEvent(event) {
		event.preventDefault();
		event.stopPropagation();
	}
	function getDimentions(element) {
		var previous, key, properties, result;
		previous = {};
		properties = {
			position: 'absolute',
			visibility: 'hidden',
			display: 'block'
		};
		for (key in properties) {
			previous[key] = element.style[key];
			element.style[key] = properties[key];
		}
		result = {
			width: element.offsetWidth,
			height: element.offsetHeight
		};
		for (key in properties) {
			element.style[key] = previous[key];
		}
		return result;
	}
	function getPage(event, page) {
		return event.changedTouches ? event.changedTouches[0][page] : event[page];
	}
	function addTouchEvent(eventType, element, listener, useCapture) {
		useCapture = useCapture || false;
		if (support.touch) {
			element.addEventListener(EVENTS[eventType].touch, listener, { passive: useCapture });
		} else {
			element.addEventListener(EVENTS[eventType].mouse, listener, { passive: useCapture });
		}
	}
	function removeTouchEvent(eventType, element, listener, useCapture) {
		useCapture = useCapture || false;
		if (support.touch) {
			element.removeEventListener(EVENTS[eventType].touch, listener, useCapture);
		} else {
			element.removeEventListener(EVENTS[eventType].mouse, listener, useCapture);
		}
	}
	function hasClass(elem, className) {
		className = " " + className + " ";
		if (elem.nodeType === 1 && (" " + elem.className + " ").replace(rclass, " ").indexOf(className) >= 0) {
			return true;
		}
		return false;
	}
	function animate(elem, prop, to, transitionDuration) {
		var begin, from, duration, easing, timer;
		begin = +new Date();
		from = parseInt(elem.style[prop], 10);
		to = parseInt(to, 10);
		duration = parseInt(transitionDuration, 10);
		easing = function(time, duration) {
			return -(time /= duration) * (time - 2);
		};
		timer = setInterval(function() {
			var time, pos, now;
			time = new Date() - begin;
			if (time > duration) {
				clearInterval(timer);
				now = to;
			} else {
				pos = easing(time, duration);
				now = pos * (to - from) + from;
			}
			elem.style[prop] = now + 'px';
		}, 10);
		return timer;
	}
	function getBrowserHeight() {
		if (window.innerHeight) {
			return window.innerHeight;
		}
		else if (document.documentElement && document.documentElement.clientHeight !== 0) {
			return document.documentElement.clientHeight;
		}
		else if (document.body) {
			return document.body.clientHeight;
		}
		return 0;
	}
	function debounce(func, wait, immediate) {
		var timeout, result;
		return function() {
			var context = this, args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) result = func.apply(context, args);
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) result = func.apply(context, args);
			return result;
		};
	}
	window.SpSlidemenu = SpSlidemenu;
})(window, window.document);
