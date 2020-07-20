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

    __proxymer(obj, name) {
        Object.defineProperty(obj, Func.__subscribleVarName, {value: toMap({ set: toSet(), get: toSet(), del: toSet() })});
        const setProxy = (sourseObj, primaryProp, primaryObj) => {
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
                        const cashProxy = setProxy(Reflect.get(target, prop, receiver), primaryProp ?? prop, primaryObj ?? receiver);
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

        this[name] = setProxy(obj);
    }
}

class __DOMElement {
    constructor(selector, ...funcs) {
        this.elms = Array.from(document.querySelectorAll(selector));
        for (const func of funcs) 
            for (const node of this.elms)
                func(node);
    }

    splice (...arg) {
        this.elms.splice(...arg);
        return this;
    }

    bindStor = toMap();

    bind (obj, handler) {
        let wkey = [];
        let inclObj = obj;
        const setWkey = subj => { 
            return new Proxy(subj, {
                get: (tar, prop, ...args) => {
                    wkey.unshift(prop);
                    if (tar[prop] instanceof Object) {
                        inclObj = inclObj[prop]; 
                        return setWkey(Reflect.get(tar, prop, ...args));
                    }
                    return Reflect.get(tar, prop, ...args);
            }});
        }

        this.__subscribleProp(obj, 'set, del');
        
        const sobj = setWkey(obj); 
        let idx = 0
        for (const node of this.elms) {
            inclObj = obj;
            wkey = [];
            handler(this.__meta(node), sobj, node, idx);

            let [subj, key] = [inclObj, wkey[0]];
            let storI = idx;
            if (!this.bindStor.has(subj))
                this.bindStor.set(subj, toMap());
            this.bindStor.get(subj).getArr(key).push(() => handler(this.__meta(node), obj, node, storI));
            node.addEventListener('input', eve => subj[key] = eve.target.value);
            idx++;
        }
    }

    __outInStor = toMap();

    __funcAddNodes (parent, newNode, method, wrapHandler, sobj, k, count, adder) {
        parent.prepend(newNode);
        wrapHandler(newNode, count, sobj[k], k);

        count++;
        if (!newNode.isConnected) return;

        this.elms.push(newNode);

        adder[0].counter = count;
        return this.__outInStor.get(sobj).getArr(k).push([newNode, count]);
    };


    outIn (obj, handler) {
        const wrapHandler = (node, counter, val, key) => handler(this.__meta(node), val, key, node, counter);
        const __adder = [];
        this.__outInStor.set(obj, toMap({__wrapHandler: wrapHandler, __adder}));

        const elems = Array.from(this.elms);
        this.elms = [];
        let working = false;
        for (const node of elems) {
            let counter = 0;
            const parent = node.parentNode;
            __adder.unshift({primary: node, parent, counter: 0});
            for (const k in obj) {
                working = true;
                this.__funcAddNodes(parent, node.cloneNode(true), 'before', wrapHandler, obj, k, counter, __adder);
                this.__outInStor.get(obj).set('__wrapHandler', wrapHandler).set('__adder', __adder);
            }
            node.remove();
        }
        if (working)
            this.__subscribleProp(obj, 'set, del');
        return this;
    }

    __meta(node) { 
        return (...funcs) => funcs.callAll(node);
    }

    __subscribleProp (obj, events) { 
        return events.split(',').forEach(event => obj[Func.__subscribleVarName].get(event.trim()).add(this));
    }
	
	__deleteNode (node) {
		node.remove();
        this.elms = this.elms.filter(elm => elm != node);
	}

    __proxy_set(primaryObj, primaryProp, obj, prop, newValue) {
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
                for (const params of outInStor.get(primaryProp)) 
                    nodeHandler(params);
            }
            else { clog('add')
                const adder = outInStor.get('__adder');
                for (const {primary, parent, counter} of adder) 
                    this.__funcAddNodes(parent, primary.cloneNode(true), 'after', outInStor.get('__wrapHandler'), primaryObj, primaryProp, counter + 1, adder);
            }
        }

        this.bindStor.get(obj)?.get(prop)?.callAll();
    }

    __proxy_del(primaryProp, obj, primaryObj) {
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