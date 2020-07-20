"use strict"
///////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////

//let obj = {io: {h: {l:-1}, p: 'str'} };
let obj = {class: 8, ll: 55};

const app = new Func({mytest: obj});

el('ol>li').outIn(app.mytest, noop)
//     (exe, v, k, node, i) => { 
//         content(k)(node.findAll('p', 0));
//         content(v)(node.findAll('p', 1));
// });

///el('.txt').bind(app.mytest, (exe, data, node, i) => (i%2)? exe(value(data.io.h)): exe(value(data.gg.h)));