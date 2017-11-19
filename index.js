const Config = require("./Config.json")

var EXPRESS = require('express')
,REQUEST = require('request')
,ASYNC = require('async')
,MONGO = require('mongodb').MongoClient
,__ = require('underscore')
,APP = EXPRESS();

APP.get('/geoms/:app',(req,res)=>{
	console.log('req');
	console.log(req);
	res.setHeader('Content-Type', 'application/json');
	if(typeof req.query.q == 'undefined' || req.query.q.indexOf(":")<0){
		var o = {success:false,msg:"missing or invalid q param"}
		res.send(JSON.stringify(o))
	} else {

		if(req.params.app == 'cbb'){
			var clauses = __.map(req.query.q.split(","),(p)=>{

				var pa = p.split(":")
				,pat = '';

				switch (pa[0]) {
					case 'point':
					pat='Point'
					break;
					case 'poly':
					pat='Polygon'
					break;
					case 'line':
					pat='Line'
					break;
					default:
							// statements_def
							break;
						}

						var qt = { "geometry.type": {"$regex":".*"+pat+".*"} }
						var qv = { "properties.cartodb_id": parseInt(pa[1]) }
						return { $and: [ qt, qv ] }

			});//map

			var query = {$or:clauses}

		// Connection URL
		// var url = 'mongodb://app:7GT8Cdl*fq4Z@cl00-shard-00-00-uacod.mongodb.net:27017,cl00-shard-00-01-uacod.mongodb.net:27017,cl00-shard-00-02-uacod.mongodb.net:27017/cbb?authSource=admin&replicaSet=CL00-shard-0&ssl=true';
		var url = (Config.mode=='T')?'mongodb://localhost:27017/cbb':'mongodb://app:7GT8Cdl*fq4Z@cl00-shard-00-00-uacod.mongodb.net:27017,cl00-shard-00-01-uacod.mongodb.net:27017,cl00-shard-00-02-uacod.mongodb.net:27017/cbb?authSource=admin&replicaSet=CL00-shard-0&ssl=true';
		// Use connect method to connect to the Server
		MONGO.connect(url,(err, db)=>{
			console.log("Connected correctly to server");

			var col = db.collection('geo');

			col.find(query).limit(999999).toArray((err, docs)=>{
				if(err){res.send(JSON.stringify(err));}else{
					// res.send(JSON.stringify(docs));
					res.jsonp(docs);
					db.close();}
		    });//.find.toarray

		});//.connect
	}//test of app==cbb (no others for now but later maybe)


}//else of params test
}) //APP.get


APP.listen(Config.port)
console.log('running at http://localhost:'+Config.port+'/geoms');
exports = module.exports = APP;
