"use strict"

Object.defineProperty(Map.prototype, 'getArr', {value:
    function(key) {
        let elm = this.has(key);
        if (!elm)
            this.set(key, []);
        return this.get(key);
    }
});

Object.defineProperty(Array.prototype, 'callAll', {value:
    function(...arg) {
        for (const item of this)
            item(...arg);
    }
});

Object.defineProperty(Object.prototype, 'proxymer', {value: 
    function (mixins, before) {
        let handlers = Object.create(null);
        let pattern = (event, ...args) => {
            let reflect = Reflect[event](...args);
            mixins[event](...args);
            return reflect;
        };
        if (before)
            pattern = (event, ...args) => {
                mixins[event](...args);
                return Reflect[event](...args);
            };
        for (const event in mixins) {
            handlers[event] = (...args) => pattern(event, ...args);
        }
        return new Proxy(this, handlers);
    }
});

Node.prototype.find = function(selector) {
	return this.querySelectorAll(selector);
}

const empty = function(){};

const toMap = obj => obj ? new Map(Object.entries(obj)) : new Map();
const toSet = array => new Set(array);
const toTable = obj => Object.assign(Object.create(null), obj);

const clog = console.log;

const addClass = className => (node) => node.classList.add(className);
const child = selector => node => node.querySelector(selector);
const content = txt => node => node.innerText = txt ?? '';
const id = idName => node => node.id = idName;
const attrib = (attribName, attribValue) => node => node.setAttribute(attribName, attribValue);
const exis = exisCond => node => Boolean(exisCond) ? null: node.remove();
const style = styleObj => node => {for (const key in styleObj) node.style[key] = styleObj[key]};
const value = val => node => node.value = val ?? '';
const setProp = (propName, propValue) => node => node[propName] = propValue;

class Func {
	constructor (inclData, callHandler) {
		this.source = inclData;
		this.data = this.__setProxy(inclData);
		this.maskProxy = new WeakMap();
		this.storProxyCalls = toMap({ set: toSet(), get: toSet(), del: toSet() });

		callHandler?.call(this, this);

		return new Proxy(this, {
			get: (target, prop, receiver) => {
				if (prop in target) {
					return Reflect.get(target, prop, receiver);
				} else {
					return Reflect.get(this.data, prop, receiver)
				}
			}
		});
	}

	static __subscribleVarName = '__subs';
	static __isProxyVarName = '__isProxy';

	static __exceptedProps(propName) {
		return Boolean(([Func.__isProxyVarName, Func.__subscribleVarName].includes(propName)) || (propName in Object.prototype));
	}

	__setProxy = (sourseObj, primaryProp, primaryObj) => {
		var proxy = new Proxy(sourseObj, {
			set: (target, prop, value, receiver) => {
				const reflect = Reflect.set(target, prop, value, receiver);
				if (!Func.__exceptedProps(prop)) {
					this.storProxyCalls.get('set').forEach(itm => itm.__proxy_set(primaryObj ?? receiver, primaryProp ?? prop, receiver, prop, value));
				}
				return reflect;
			},

			get: (target, prop, receiver) => {
				const value = Reflect.get(target, prop, receiver);
				if ((value instanceof Object) && (!Func.__exceptedProps(prop))) {
					const valueProxy = this.maskProxy.get(value);
					if (Boolean(valueProxy)) {
						return valueProxy;
					}
					const cashProxy = this.__setProxy(Reflect.get(target, prop, receiver), primaryProp ?? prop, primaryObj ?? receiver);
					this.maskProxy.set(value, cashProxy);
					return cashProxy;
				}
				return value
			},

			deleteProperty: (target, prop) => {
				let reflect = Reflect.deleteProperty(target, prop);
				if (!Func.__exceptedProps(prop)) {
					this.storProxyCalls.get('del').forEach(itm => itm.__proxy_del(primaryProp ?? prop, target, primaryObj ?? target));
				}
				return reflect;
			}
		});
		return proxy;
	};
}

class __DOMElement {
	constructor(selector, __app) {
		if (selector instanceof Node) 
			this.elements = [selector];
		else if (selector instanceof NodeList)
			this.elements = Array.from(selector);
		else
			this.elements = Array.from(document.querySelectorAll(selector));

			this.app = __app;
	}

	splice (...arg) {
		this.elements.splice(...arg);
		return this;
	}

	bindStor = toMap();

	bind (obj, handler) {
		if (obj instanceof Func) {
			if (!Boolean(this.app)) {
				this.app = obj
			}
			obj = this.app.data;
		}

		let lastKey = [];
		let lastObj = obj;
		const proxy = xobj => { 
			return new Proxy(xobj, {
				get: (target, prop, receiver) => {
					lastKey = prop;
					if (target[prop] instanceof Object) {
						lastObj = lastObj[prop]; 
						return proxy(Reflect.get(target, prop, receiver));
					}
					return Reflect.get(target, prop, receiver);
			}});
		}

		this.__subscribleProp('set, del');
		
		const sobj = proxy(obj); 
		let idx = 0
		for (const node of this.elements) {
			lastObj = obj;
			handler(this.__meta(node), sobj, node, idx);

			let [currentObj, currentKey] = [lastObj, lastKey];
			let storI = idx;
			if (!this.bindStor.has(currentObj))
				this.bindStor.set(currentObj, toMap());
			this.bindStor.get(currentObj).getArr(currentKey).push(() => handler(this.__meta(node), obj, node, storI));
			node.addEventListener('input', eve => currentObj[currentKey] = eve.target.value);
			idx++;
		}
	}

	__funcAddNodes (parentNode, newNode, wrapHandler, obj, key, count) {
		parentNode.append(newNode);
		wrapHandler(newNode, count, obj[key], key);
		if (!newNode.isConnected) return;
		this.elements.push(newNode);
	};

	__repeatStor = toMap();

	repeat (obj, handler, prs) {
		if (obj instanceof Func) {
			this.app = obj;
			obj = this.app.data;
		}

		this.proxyCalls = false;
		const wrapHandler = (node, counter, val, key) => handler(this.__meta(node), val, key, node, counter);

		const elems = Array.from(this.elements);
		this.elements = [];
		let working = false;
		let newNode;
		let nestedHandler = empty;
		const accum = prs || [];

		const main = () => {
			const nextSliceProps = accum.slice(1);
			for (let node of elems) {
				let counter = 0;
				const key2node = new Map();
				for (const key in obj) {
					working = true;
					newNode = node.cloneNode(true);
					key2node.set(key, newNode);
					this.__funcAddNodes(node.parentNode, newNode, wrapHandler, obj, key, counter);

					nestedHandler(newNode, obj[key], accum[0], nextSliceProps);
					counter++;
				}
				this.__repeatStor.set(obj, toMap({wrapHandler, primary: node, counter, parent: node.parentNode, key2node}));
				node.remove();
			}

			if (working) this.__subscribleProp('set, del');
			return this;
		};

		const tailCallback = (elems, callback) => {
			if (Boolean(elems) && Boolean(callback)) {
				accum.push({elems, callback});

				return tailCallback;
			} else {
				nestedHandler = (node, data, nextProps, follwn) => Boolean(nextProps) ?
					new __DOMElement(node.find(nextProps.elems)).repeat(new Func(data), nextProps.callback, follwn)() : null;
				};
				return main();
			}

		return tailCallback;
	};

	__meta(node) { 
		return (...funcs) => {
			funcs.callAll(node);
			return {el: selector => new __DOMElement(node.find(selector), this.app)};
		};
	}

	__subscribleProp (events) {
		return events.split(',').forEach(event => this.app.storProxyCalls.get(event.trim()).add(this));
	}
	
	__deleteNode (node) {
		node.remove();
		this.elements = this.elements.filter(elm => elm != node);
	}

	__proxy_set(primaryObj, primaryProp, obj, prop, newValue) {clog(this)
		this.proxyCalls = true;
		const repeatStor = this.__repeatStor.get(primaryObj);

		if (repeatStor) {
			const nodeList = repeatStor.get('key2node');
			if (nodeList.has(primaryProp)) {
				const nodeHandler = (newValue == null) ? 
					() => {
						this.__deleteNode(nodeList.get(primaryProp));
						nodeList.delete(primaryProp);
					} : 
					() => repeatStor.get('wrapHandler')(nodeList.get(primaryProp), repeatStor.get('counter'), primaryObj[primaryProp], primaryProp);
				return nodeHandler();
			} else {
				const counter = repeatStor.get('counter');
				this.__funcAddNodes(repeatStor.get('parent'), repeatStor.get('primary').cloneNode(true), repeatStor.get('wrapHandler'),
					primaryObj, primaryProp, counter);
				repeatStor.set('counter', counter++);
			}
		}

		this.bindStor.get(obj)?.get(prop)?.callAll();
	}

	__proxy_del(primaryProp, obj, primaryObj) {
		this.proxyCalls = true;
		const repeatStor = this.__repeatStor.get(primaryObj);
		const nodeList = repeatStor.get('key2node');  
		const node = nodeList.get(primaryProp);
		if (Boolean(repeatStor) && Boolean(node)) {
			this.__deleteNode(node);
			nodeList.delete(primaryProp);
		}
	}
}

const el = (selector, ...funcs) => new __DOMElement(selector, ...funcs);