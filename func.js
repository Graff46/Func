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
	}

	static __subscribleVarName = '__subs';
	static __isProxyVarName = '__isProxy';

	static __exceptedProps(propName) {
		return Boolean(([Func.__isProxyVarName, Func.__subscribleVarName].includes(propName)) || (propName in Object.prototype));
	}

	__setProxy = (sourseObj, primaryProp, primaryObj) => {
		var proxy = new Proxy(sourseObj, {
			set: (target, prop, value, receiver) => {
				if (!Func.__exceptedProps(prop)) {
					this.storProxyCalls.get('set').forEach(itm => itm.__proxy_set(primaryObj ?? receiver, primaryProp ?? prop, receiver, prop, value));
				}
				return Reflect.set(target, prop, value, receiver);
			},

			get: (target, prop, receiver) => {
				if ((target[prop] instanceof Object) && (!Func.__exceptedProps(prop))) {
					const valueProxy = this.maskProxy.get(target[prop]);
					if (Boolean(valueProxy)) {
						return valueProxy;
					}
					const cashProxy = this.__setProxy(Reflect.get(target, prop, receiver), primaryProp ?? prop, primaryObj ?? receiver);
					this.maskProxy.set(target[prop], cashProxy);
					return cashProxy;
				}
				return Reflect.get(target, prop, receiver);
			},

			deleteProperty: (target, prop) => {
				let reflect = Reflect.deleteProperty(target, prop);
				if (!Func.__exceptedProps(prop))
					proxy[Func.__subscribleVarName].get('del').forEach(itm => itm.__proxy_del(primaryProp ?? prop, target, primaryObj ?? target));
				return reflect;
			}
		});
		return proxy;
	};
}

class __DOMElement {
	constructor(selector, __app) {
		if (selector instanceof Node) 
			this.elms = [selector];
		else if (selector instanceof NodeList)
			this.elms = Array.from(selector);
		else
			this.elms = Array.from(document.querySelectorAll(selector));

			this.app = __app;
	}

	splice (...arg) {
		this.elms.splice(...arg);
		return this;
	}

	bindStor = toMap();

	bind (obj, handler) {
		let lastKey = [];
		let lastObj = obj;
		const setWkey = subj => { 
			return new Proxy(subj, {
				get: (tar, prop, ...args) => {
					lastKey = prop;
					if (tar[prop] instanceof Object) {
						lastObj = lastObj[prop]; 
						return setWkey(Reflect.get(tar, prop, ...args));
					}
					return Reflect.get(tar, prop, ...args);
			}});
		}

		this.__subscribleProp(obj, 'set, del');
		
		const sobj = setWkey(obj); 
		let idx = 0
		for (const node of this.elms) {
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

	__repeatStor = toMap();

	__funcAddNodes (parentNode, newNode, wrapHandler, obj, key, count) {
		parentNode.append(newNode);

		let currNode = newNode;
		wrapHandler(currNode, count, obj[key], key);

		count++;
		if (!currNode.isConnected) return;

		this.elms.push(currNode);

		//adder[0].counter = count;
		//return this.__repeatStor.get(obj).getArr(key).push([currNode, count]);
	};

	repeat (obj, handler) {
		if (obj instanceof Func) {
			if (!Boolean(this.app)) {
				this.app = obj
			}
			obj = this.app.data;
		}

		this.proxyCalls = false;
		const wrapHandler = (node, counter, val, key) => handler(this.__meta(node), val, key, node, counter);

		const elems = Array.from(this.elms);
		this.elms = [];
		let working = false;
		for (let node of elems) {
			let counter = 0;
			const key2node = new Map();
			for (const key in obj) {
				working = true;
				key2node.set(key, node);
				this.__funcAddNodes(node.parentNode, node.cloneNode(true), wrapHandler, obj, key, counter);
				counter++;
			}
			this.__repeatStor.set(obj, toMap({wrapHandler, primary: node, counter, key2node}));
			node.remove();
		}
		if (working) {
			this.__subscribleProp(obj, 'set, del');
		}
		return this;
	}

	__meta(node) { 
		return (...funcs) => {
			funcs.callAll(node);
			return {el: selector => new __DOMElement(node.find(selector), this.app)};
		};
	}

	__subscribleProp (obj, events) { 
		return events.split(',').forEach(event => this.app.storProxyCalls.get(event.trim()).add(this));
	}
	
	__deleteNode (node) {
		node.remove();
		this.elms = this.elms.filter(elm => elm != node);
	}

	__proxy_set(primaryObj, primaryProp, obj, prop, newValue) {
		this.proxyCalls = true;
		const repeatStor = this.__repeatStor.get(primaryObj);
		const nodeList = repeatStor.get('key2node');
		if (repeatStor) {
			if (nodeList.has(primaryProp)) {
				const nodeHandler = (newValue == null) ? 
					() => {
						this.__deleteNode(nodeList.get(primaryProp));
						nodeList.delete(primaryProp);
					} : 
					() => repeatStor.get('wrapHandler')(nodeList.get(primaryProp), repeatStor.get('counter'), primaryObj[primaryProp], primaryProp);
				return nodeHandler();
				}
			}
			else {clog(22)
				this.__funcAddNodes(repeatStor.get('parentNode'), repeatStor.get('primary').cloneNode(true), repeatStor.get('wrapHandler'),
					primaryObj, primaryProp, repeatStor.get('counter'));
		}

		this.bindStor.get(obj)?.get(prop)?.callAll();

		if (this.__repeatStor.get(obj))
			this.__proxy_set(obj, prop, obj[prop], prop, newValue);
	}

	__proxy_del(primaryProp, obj, primaryObj) { clog(primaryProp, obj, primaryObj)
		this.proxyCalls = true;
		let repeatStor = this.__repeatStor.get(primaryObj);  
		let paramsArr;
		if ((repeatStor) && (paramsArr = repeatStor.get(primaryProp))) {
			for (const params of paramsArr) {
				this.__deleteNode(params[0]);
				repeatStor.delete(primaryProp);
			}
		}
	}
}

const el = (selector, ...funcs) => new __DOMElement(selector, ...funcs);