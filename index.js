const Config = require("./Config.json")

var EXPRESS = require('express')
,REQUEST = require('request')
,ASYNC = require('async')
,MONGO = require('mongodb').MongoClient
,__ = require('underscore')
,FS = require('fs')
,APP = EXPRESS();

APP.get('/geocode/:loc',(req,res)=>{

	res.setHeader('Content-Type', 'application/json');
	var Q = {incoming:req.params.loc}
	var R = {
		Q:Q.incoming.replace(",","")
		,QR:Q.incoming
	} //~empty response obj

	// QUITE a sketchy way to test for an address v. placename string
	R.type=(isNaN(Q.incoming[0])==false)?'address':'other';

	var options = (R.type=='address')?
	{ method: 'GET',
	url: 'http://nominatim.openstreetmap.org/search',
	qs:
	{ q: R.Q,
		format: 'json',
		addressdetails: '1' },
		headers: { 'cache-control': 'no-cache' } }
		:
		{ method: 'GET',
		url: 'http://nominatim.openstreetmap.org/search.php',
		qs: { limit: '10', format: 'jsonv2', dedupe: '1', q: R.Q },
		headers: { 'cache-control': 'no-cache' } };


		REQUEST(options, (error, resp, body)=>{
			console.log("in request")
			console.log("resp",resp)
			if (error) {
				throw new Error(error);
				console.log(error)
				R.success='false';
				R.error=error;
				res.jsonp(R);
			}//if.error
			else {
				var B = JSON.parse(body)
				R.body= B
				R.nomin = {bbox:B.boundingbox,osm_type:B.osm_type}
				R.geom_type="point|poly|line"
			// console.log(body);
			res.jsonp(R);
		} //if.error.else
	});



})//.get/geocode

APP.get('/geoms/:app',(req,res)=>{
	console.log('req');
	console.log(req);
	res.setHeader('Content-Type', 'application/json');
	if(typeof req.query.q == 'undefined' || req.query.q.indexOf(":")<0){
		var o = {success:false,msg:"missing or invalid q param"}
		res.send(JSON.stringify(o))
	} else {

		if(req.params.app == 'offline'){
			FS.readFile('./offline/geojson.geojson',(e,d)=>{

				if(e) throw Error(e);
				var J = JSON.parse(d);
				console.log(J)
				res.jsonp(J.features);
			})
		}//if.offlien

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
console.log('running at http://localhost:'+Config.port);
exports = module.exports = APP;
