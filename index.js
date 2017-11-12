const Config = require("./Config.json")

var EXPRESS = require('express')
,REQUEST = require('request')
,ASYNC = require('async')
,__ = require('underscore')
,APP = EXPRESS();

APP.get('/geoms/:q?',(req,res)=>{

console.log(req);
if(typeof req.params.q == 'undefined' || req.params.q.indexOf(":")<0){
	var o = {success:false,msg:"missing or invalid q param"}
	res.send(JSON.stringify(o))
} else {
	var clauses = __.map(req.params.q.split(","),(p)=>{

var pa = p.split(":");

return '{ $and: [ { "geometry.type": '+pa[0]+' }, { "properties.cartodb_id": '+pa[1]+' } ] }'

	});//map

// { $or: [ { <expression1> }, { <expression2> }, ... , { <expressionN> } ] }
// { $and: [ { price: { $ne: 1.99 } }, { price: { $exists: true } } ] }
var query = {$or:[clauses.join(",")]}

res.send(JSON.stringify(query))}

}) //APP.get


APP.listen(Config.port)
console.log('running at http://localhost:'+Config.port+'/geoms');
exports = module.exports = APP;
