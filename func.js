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

        const setProxy = (sourseObj, sourseProp, stackKeys) => {
             return new Proxy(sourseObj, {
                set: (target, prop, value, ...args) => { 
                    let reflect = Reflect.set(target, prop, value, ...args);
                    Object.defineProperty(sourseObj, Func.__isProxyVarName, {value: true});
                    if (!Func.__exceptedProps(prop)) 
                        obj[Func.__subscribleVarName].get('set').forEach(itm => itm.__proxy_set(sourseProp ?? prop, [prop].concat(stackKeys) ));
                    return reflect;
                },

                get: (target, prop, ...args) => {
                    stackKeys = [];
                    if ((target[prop] instanceof Object) && (!Func.__exceptedProps(prop))) {
                        stackKeys.unshift(prop);
                        return setProxy(Reflect.get(target, prop, ...args), sourseProp ?? prop, stackKeys);
                    }

                    return Reflect.get(target, prop, ...args);
                },

                deleteProperty: (target, prop, ...args) => {
                    let reflect = Reflect.deleteProperty(target, prop, ...args);
                    stackKeys.unshift(prop);
                    Object.defineProperty(sourseObj, Func.__isProxyVarName, {value: true});
                    if (!Func.__exceptedProps(prop)) 
                        obj[Func.__subscribleVarName].get('del').forEach(itm => itm.__proxy_del(prop, [prop].concat(stackKeys)));
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
    bindEventListenerStor = toMap();

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

        this.__subscribleProp(obj, 'set');
        
        const sobj = setWkey(obj); 
        let idx = 0;
        for (const node of this.elms) {
            inclObj = obj;
            wkey = [];
            handler(this.__meta(node), sobj, node, idx);

            let [subj, key] = [inclObj, wkey[0]];
            let storI = idx;
            this.bindStor.getArr(wkey.join()).push(() => handler(this.__meta(node), obj, node, storI));
            const EventListener = eve => subj[key] = eve.target.value;
            this.bindEventListenerStor.set(node, {type: 'input', listener: EventListener});
            node.addEventListener('input', EventListener);
            idx++;
        }
    }

    unbindAll () {
        for (const [node, eventHandlerData] of this.bindEventListenerStor)
            node.removeEventListener(eventHandlerData.get('type'), eventHandlerData.get('listener'));
    }

    unbind (node) {
        let eventHandlerData = this.bindEventListenerStor.get(node);
        if (eventHandlerData)
            node.removeEventListener(eventHandlerData.get('type'), eventHandlerData.get('listener'));
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

    __proxy_set(primaryProp, stackKeys) { 
        const nodes = this.__prop2node.get(primaryProp);
        if (nodes)
            for (const node of nodes) 
                this.wrapHandler(node, this.sobj[primaryProp], primaryProp);
        else {
            let primaryNode = this.__prop2node.get(this.__lastSobjProp);
            if (primaryNode) {
                let cloneNodes = primaryNode.map(node => node.cloneNode(true));
                cloneNodes.forEach(newNode => this.wrapHandler(newNode, value, primaryProp))

                primaryNode.forEach((node, i) => {
                    this.__prop2node.getArr(primaryProp).push(cloneNodes[i]);
                    node.after(cloneNodes[i]); 
                });
            }
        }
        this.bindStor.get(stackKeys.join())?.callAll();
    }

    __proxy_del(primaryProp) {
        let nodes = this.__prop2node.get(primaryProp);
        if (nodes) 
            for (const node of nodes)
                node.remove();
    }
}

const el = (selector, ...funcs) => new __DOMElement(selector, ...funcs);