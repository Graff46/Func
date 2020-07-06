"use strict"
///////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////

//let obj = {io: {h: -1} };
let obj ={class: "tyuiop", ll: 99, io: {h: -1}, gg: {h: 987}};

const app = new Func({mytest: obj});

let yy = el('#txt').outIn(app.mytest, (node, v, k) => node( id(k))).bbind(app.mytest, data => data.class);