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
const value = val => node => node.value = val;

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

        const setProxy = (sourseObj, sourseProp) => {
            Object.defineProperty(sourseObj, Func.__isProxyVarName, {value: true});
             return new Proxy(sourseObj, {
                set: (target, prop, value, ...args) => { 
                    let reflect = Reflect.set(target, prop, value, ...args);
                    if (!Func.__exceptedProps(prop)) 
                        obj[Func.__subscribleVarName].get('set').forEach(itm => itm.__proxy_set(sourseProp ?? prop, prop));
                    return reflect;
                },

                get: (target, prop, ...args) => {
                    if ((target[prop] instanceof Object) && (!target[prop][Func.__isProxyVarName]) && (!Func.__exceptedProps(prop)))
                        return setProxy(Reflect.get(target, prop, ...args), sourseProp ?? prop);
                    return Reflect.get(target, prop, ...args);
                },

                deleteProperty: (target, prop, ...args) => {
                    let reflect = Reflect.deleteProperty(target, prop, ...args);
                    if (!Func.__exceptedProps(prop)) 
                        obj[Func.__subscribleVarName].get('del').forEach(itm => itm.__proxy_del(prop));
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

    binding = toMap();

    valueBind (obj, handler) {
        let wkey;
        let inclObj = obj;
        const setWkey = subj => new Proxy(subj, {
            get: (tar, prop, ...args) => {
                if (tar[prop] instanceof Object) {
                    inclObj = (inclObj || tar)[prop];
                    return setWkey(Reflect.get(tar, prop, ...args));
                }
                wkey = prop;
                return Reflect.get(tar, prop, ...args);
            }
        });

        this.__subscribleProp(obj, 'set');
        const objValue = handler(setWkey(obj));
        this.binding.getArr(wkey).push(() => this.elms.forEach(node => node.value = handler(obj)));
        for (const node of this.elms) {
            node.addEventListener('input', eve => inclObj[wkey] = eve.target.value);
            node.value = objValue;
        }
    }

    __prop2node = toMap();

    outIn (obj, handler) {
        this.sobj = obj;
        this.wrapHandler;
        this.__lastSobjProp;

        for (const node of this.elms) { 
            this.elms = [];
            for (const k in this.sobj) { 
                let clone = node.cloneNode(true);
                if (this.sobj == null) continue;
                this.elms.push(clone);

                this.wrapHandler = (wnode, val, key) => handler(this.__meta(wnode), val, key);
                this.__prop2node.getArr(k).push(clone);
                this.__lastSobjProp = k;

                this.__subscribleProp(this.sobj, 'set', 'del');

                this.wrapHandler(clone, this.sobj[k], k);
                node.before(clone);
            }
            node.remove();
        }
        return this;
    }

    __meta(node) { 
        return (...funcs) => funcs.callAll(node);
    }

    __subscribleProp(obj, ...events) { 
        return events.forEach(event => obj[Func.__subscribleVarName].get(event).add(this));
    }

    __proxy_set(prop, incProp) {
        const nodes = this.__prop2node.get(prop);
        if (nodes)
            for (const node of nodes) 
                this.wrapHandler(node, this.sobj[prop], prop);
        else {
            let primaryNode = this.__prop2node.get(this.__lastSobjProp);
            if (primaryNode) {
                let cloneNodes = primaryNode.map(node => node.cloneNode(true));
                cloneNodes.forEach(newNode => this.wrapHandler(newNode, value, prop))

                primaryNode.forEach((node, i) => {
                    this.__prop2node.getArr(prop).push(cloneNodes[i]);
                    node.after(cloneNodes[i]); 
                });
            }
        }
        this.binding.get(incProp).callAll();
    }

    __proxy_del(prop) {
        let nodes = this.__prop2node.get(prop);
        if (nodes) 
            for (const node of nodes)
                node.remove();
    }
}

const el = (selector, ...funcs) => new __DOMElement(selector, ...funcs);