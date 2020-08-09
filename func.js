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
	return this.querySelector(selector);
}

Node.prototype.findAll = function(selector, idxNode) {
	if (idxNode != null)
		return this.querySelectorAll(selector)[idxNode];
	return this.querySelectorAll(selector);
}

const noop = function(){};

const toMap = obj => obj ? new Map(Object.entries(obj)) : new Map();
const toSet = array => new Set(array);
const toTable = obj => Object.assign(Object.create(null), obj);

const clog = console.log;

const addClass = className => (node) => node.classList.add(className);
const child = selector => node => node.querySelector(selector);
const content = txt => node => node.innerText = String(txt);
const id = idName => node => node.id = idName;
const attrib = (attribName, attribValue) => node => node.setAttribute(attribName, attribValue);
const exis = exisCond => node => Boolean(exisCond) ? null: node.remove();
const style = styleObj => node => {for (const key in styleObj) node.style[key] = styleObj[key]};
const value = val => node => node.value = val;
const setProp = (propName, propValue) => node => node[propName] = propValue;

class Func {
	constructor (inclData, callHandler) {
		toMap(inclData).forEach((dataUnit, name) => this.__proxymer(dataUnit, name), this);
		callHandler?.call(this, this);
	}

	static __subscribleVarName = '__subs';
	static __isProxyVarName = '__isProxy';
	static __exceptedProps(propName) {
		return Boolean(([Func.__isProxyVarName, Func.__subscribleVarName].includes(propName)) || (propName in Object.prototype));
	}

	__setProxy = (sourseObj, primaryProp, primaryObj) => {
		return new Proxy(sourseObj, {
		   set: (target, prop, value, receiver) => {
			   let reflect = Reflect.set(target, prop, value, receiver);
			   if (!Func.__exceptedProps(prop)) 
				   obj[Func.__subscribleVarName].get('set').forEach(itm => itm.__proxy_set(primaryObj ?? receiver, primaryProp ?? prop, receiver, prop, value));
			   return reflect;
		   },

		   get: (target, prop, receiver) => {
			   if ((target[prop] instanceof Object) && (!Func.__exceptedProps(prop))) {
				   if (Func.__isProxyVarName in target[prop]) {
					   return target[prop][Func.__isProxyVarName];
				   }
				   const cashProxy = this.__setProxy(Reflect.get(target, prop, receiver), primaryProp ?? prop, primaryObj ?? receiver);
				   Object.defineProperty(target[prop], Func.__isProxyVarName, {value: cashProxy});
				   return cashProxy;
			   }

			   return Reflect.get(target, prop, receiver);
		   },

		   deleteProperty: (target, prop) => {
			   let reflect = Reflect.deleteProperty(target, prop);
			   if (!Func.__exceptedProps(prop))
				   obj[Func.__subscribleVarName].get('del').forEach(itm => itm.__proxy_del(primaryProp ?? prop, target, primaryObj ?? target));
			   return reflect;
		   },
	   });
   };

	__proxymer(obj, name) {
		Object.defineProperty(obj, Func.__subscribleVarName, {value: toMap({ set: toSet(), get: toSet(), del: toSet() })});
		this[name] = this.__setProxy(obj);
	}
}

class __DOMElement {
	constructor(selector, ...funcs) {
		if (selector instanceof Node) 
			this.elms = [selector];
		else if (selector instanceof NodeList)
			this.elms = Array.from(selector);
		else
			this.elms = Array.from(document.querySelectorAll(selector));

		for (const func of funcs) 
			this.elms.forEach((...params) => func(...params));
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

	__outInStor = toMap();

	__funcAddNodes (referenceNode, newNode, wrapHandler, obj, key, count, adder, nodeHandler) {
		referenceNode.before(newNode);

		let currNode = newNode;
		if (nodeHandler)
			currNode = nodeHandler(currNode);
		wrapHandler(currNode, count, obj[key], key);

		count++;
		if (!currNode.isConnected) return;

		this.elms.push(currNode);

		adder[0].counter = count;
		return this.__outInStor.get(obj).getArr(key).push([currNode, count]);
	};

	repeat (obj, handler, nodeHandler) {
		const h = function(obj, handler, nodeHandler) {
			this.proxyCalls = false;
			const wrapHandler = (node, counter, val, key) => handler(this.__meta(node), val, key, node, counter);
			const __adder = [];
			this.__outInStor.set(obj, toMap({__wrapHandler: wrapHandler, __adder}));
	
			const elems = Array.from(this.elms);
			this.elms = [];
			let working = false;
			for (let node of elems) {
				let counter = 0;
				__adder.unshift({primary: node, counter: 0});
				for (const key in obj) { 
					working = true;
					this.__funcAddNodes(node, node.cloneNode(true), wrapHandler, obj, key, counter, __adder, nodeHandler);
					this.__outInStor.get(obj).set('__wrapHandler', wrapHandler).set('__adder', __adder);
					counter++;
				}
				const referenceNode = document.createElement('meta');
				referenceNode.setAttribute('func', '');
				node.after(referenceNode);
				node.remove();
				__adder[0].referenceNode = referenceNode;
			}
			if (working)
				this.__subscribleProp(obj, 'set, del');
			return this;
		} 
		return new Proxy({repeat: (nodes, ...args) => el(nodes).repeat(...args)}, {apply(target, thisArg, args) {() => h.apply(thisArg, args)} }); 
	}

	repeatIn (selector, obj, handler, nodeHandler) {
		if (this.proxyCalls) return;

		const incl = el(selector).repeat(obj, handler, nodeHandler);
		this.__outInStor.set(obj, incl.__outInStor.get(obj));
	}

	__meta(node) { 
		return (...funcs) => funcs.callAll(node);
	}

	__subscribleProp (obj, events) { 
		return events.split(',').forEach(event => obj[Func.__subscribleVarName]?.get(event.trim()).add(this));
	}
	
	__deleteNode (node) {
		node.remove();
		this.elms = this.elms.filter(elm => elm != node);
	}

	__proxy_set(primaryObj, primaryProp, obj, prop, newValue) {
		this.proxyCalls = true;
		let outInStor = this.__outInStor.get(primaryObj);
		if (outInStor) {
			if (outInStor.get(primaryProp)) {
				let nodeHandler;
				if (newValue == null)
					nodeHandler = params => {
						this.__deleteNode(params[0]);
						outInStor.delete(primaryProp);
					};
				else
					nodeHandler = params => outInStor.get('__wrapHandler')(...params, primaryObj[primaryProp], primaryProp);
				outInStor.get(primaryProp).forEach(params => nodeHandler(params));
			}
			else { 
				const adder = outInStor.get('__adder');
				for (const {primary, counter, referenceNode} of adder) 
					this.__funcAddNodes(referenceNode, primary.cloneNode(true), outInStor.get('__wrapHandler'), primaryObj, primaryProp, counter + 1, adder);
			}
		}

		this.bindStor.get(obj)?.get(prop)?.callAll();

		if (this.__outInStor.get(obj))
			this.__proxy_set(obj, prop, obj[prop], prop, newValue);
	}

	__proxy_del(primaryProp, obj, primaryObj) {
		this.proxyCalls = true;
		let outInStor = this.__outInStor.get(primaryObj);  
		let paramsArr;
		if ((outInStor) && (paramsArr = outInStor.get(primaryProp))) {
			for (const params of paramsArr) {
				this.__deleteNode(params[0]);
				outInStor.delete(primaryProp);
			}
		}
	}
}

const el = (selector, ...funcs) => new __DOMElement(selector, ...funcs);