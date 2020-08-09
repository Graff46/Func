"use strict"
///////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////

//let obj = {io: {h: {l:-1}, p: 'str'} };
let obj = {class: 8, ll: 55};

const app = new Func({mytest: obj});

var r = el('ol>li').repeat(app.mytest, (exe, v, k, node, i) => {
	exe(content(k));
	//el(node.find('p')).repeat(v, (exe2, k)=>exe2(content(k)));
})

//el('.txt').bind(app.mytest, (exe, data, node, i) => (i%2)? exe(value(data.io.h)): exe(value(data.gg.h)));