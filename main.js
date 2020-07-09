"use strict"
///////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////

//let obj = {io: {h: -1} };
let obj ={class: "tyuiop", ll: 99, io: {h: -1}, gg: {h: 987}};

const app = new Func({mytest: obj});

//let yy = el('.p').outIn(app.mytest, (node, v, k) => node(content(v.h), id(k)))
el('.txt').bind(app.mytest, (exe, data, node, i) => (i%2)? exe(value(data.io.h)): exe(value(data.gg.h)));