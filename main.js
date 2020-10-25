"use strict"
///////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////

//let obj = {io: {h: -1} };
let obj ={io: {l: {f: 88}, ll: {ff: 888}}, gg: {h: {v: 55}, hh: {vv: 5555}}};

const app = new Func(obj);

// var r = el('ol>li').repeat(app, (exe, v, k, node, i) => {
// 	exe(addClass(k), content(v.h || v.l))//.el('p').repeat(v, (exe2, v, k) => exe2(content(v)));
// 	//el(node.find('p')).repeat(v, (exe2, k)=>exe2(content(k)));
// })

el('.li').repeat(app, (exe, v, k) => exe(id(k)))
('div', (exe, v, k) => exe(id(k)))
('p', (exe, v, k) => exe(content(v)))();

// TODO 
//el('.li').repeat(app, (exe, v, k) => exe(content(k))).inRepeat('.li>.itm', ()=>_);

//el('.txt').bind(app, (exe, data, node, i) => (i%2)? exe(value(data.io.l)): exe(value(data.gg.h)));
