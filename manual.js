const CONFIG = require("./Config.json")
,ASYNC = require('async')
,MONGO = require('mongodb').MongoClient
,__ = require('underscore')
,FS = require('fs')
,MOMENT = require('moment')
,BODYPARSER = require('body-parser')
;

var get_geom = async (path)=>{

return new Promise((resolve, reject)=>{

FS.readFile(path,'ascii',(err,data)=>{

if(err){reject(err)}

	resolve(data);

})//readfile

});//promise

}

var main = async ()=>{
	if(typeof process.argv[2] == 'undefined'){
		console.log("no path/file.ext, dying");
		process.exit();
	} else {
		var fi = process.argv[2]
	}

var geom = await get_geom(fi);
console.log(geom);

}
main();