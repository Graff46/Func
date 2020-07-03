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

class Func {
    constructor (inclData, callHandler) {
        toMap(inclData).forEach((dataUnit, name) => this.__proxymer(dataUnit, name), this);
        callHandler?.call(this, this);
    }

    static __subscribleVarName = '__subs';
    static __isProxyVarName = 'isProxy';
    static __exceptedProps(propName) {
        return Boolean(([Func.__isProxyVarName, Func.__subscribleVarName].includes(propName)) || (propName in Object.prototype));
    }

    __proxyHandler(methodName, shotName, wobj) {
        shotName = shotName ?? methodName;
        return (obj, prop, ...args) => {(Func.__exceptedProps(prop)) ? null: wobj[Func.__subscribleVarName].get(shotName).forEach(itm => itm.__metaExecs(prop));
        return Reflect[shotName](obj, prop, ...args)};
    }

    __proxymer(obj, name) {
        Object.defineProperty(obj, Func.__subscribleVarName, {value: toMap({ set: toSet(), get: toSet(), del: toSet() })});
        let self = this;

        const setProxy = (sourseObj) => {
             return new Proxy(sourseObj, {
                set: self.__proxyHandler('set', null, obj),
                get: (...args) => { 
                    if ((args[0][args[1]] instanceof Object) && (!Func.__exceptedProps(args[1])))
                        return setProxy(Reflect.get(...args));
                    return Reflect.get(...args);
                },
                deleteProperty: self.__proxyHandler('deleteProperty' ,'del'),
            });
            //Object.defineProperty(sourseObj, Func.__isProxyVarName, {value: true});
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

    outIn (obj, handler) {
        this.sobj = obj;
        this.wrapHandler;
        this.__prop2node = toMap();
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

                this.__subscribleProp('set', 'del');

                //Object.assign({}, this.sobj).proxymer();
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

    __subscribleProp(...events) { 
        return events.forEach(event => this.sobj[Func.__subscribleVarName].get(event).add(this));
    }

    __metaExecs (prop) {
        if (this.sobj[prop] == null)
            return this.__prop2node.get(prop).forEach(node => node.hidden = true);
        else {
            let nodes = this.__prop2node.get(prop);
            if (nodes)
                for (const node of nodes) {
                    if (node.hidden) node.hidden = false;
                    this.wrapHandler(node, this.sobj[prop], prop);
                }
            else {
                let primaryNode = this.__prop2node.get(this.__lastSobjProp);
                let cloneNodes = primaryNode.map(node => node.cloneNode(true));
                cloneNodes.forEach(newNode => this.wrapHandler(newNode, this.sobj[prop], prop))

                primaryNode.forEach((node, i) => {
                    this.__prop2node.getArr(prop).push(cloneNodes[i]);
                    node.after(cloneNodes[i]); 
                });
            }
        }
    }
}

const el = (selector, ...funcs) => new __DOMElement(selector, ...funcs);

///////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////

let obj = {io: {h: -1} };
//let obj ={class: "tyuiop", ll: 99, io: {h: -1}, gg: {h: 987}};

const app = new Func({mytest: obj});

let yy = el('.p').splice(1).outIn(app.mytest, (node, v, k) => node(content(v.h)));
