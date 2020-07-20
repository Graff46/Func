"use strict"
///////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////

//let obj = {io: {h: {l:-1}, p: 'str'} };
let obj = {class: "tyuiop", ll: 99, io: {h: -1}, gg: {h: 987}};

const app = new Func({mytest: obj});

el('.p').outIn(app.mytest, (exe, v, k, node) => exe(content(v.h || v)))
//el('.txt').bind(app.mytest, (exe, data, node, i) => (i%2)? exe(value(data.io.h)): exe(value(data.gg.h)));