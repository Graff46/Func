"use strict"
///////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////

//let obj = {io: {h: -1} };
let obj ={io: {l: -1}, gg: {h: 987}};

const app = new Func(obj);

var r = el('ol>li').repeat(app, (exe, v, k, node, i) => {
	exe(addClass(k), content(v.h || v.l))//.el('p').repeat(v, (exe2, v, k) => exe2(content(v)));
	//el(node.find('p')).repeat(v, (exe2, k)=>exe2(content(k)));
})

//el('.txt').bind(app.mytest, (exe, data, node, i) => (i%2)? exe(value(data.io.h)): exe(value(data.gg.h)));
