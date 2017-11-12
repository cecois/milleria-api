const Config = require("./Config.json")

var EXPRESS = require('express')
,REQUEST = require('request')
,ASYNC = require('async')
,__ = require('underscore')
,APP = EXPRESS();

APP.get('/geoms',(req,res)=>{


	return new Promise((resolve,rejectd)=>{

		var data = req.params
		resolve(data);

})//promise

}) //APP.get


APP.listen(Config.port)
console.log('running at http://localhost:'+Config.port+'/geoms');
exports = module.exports = APP;