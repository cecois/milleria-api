const CONFIG = require("./Config.json")

const EXPRESS = require('express')
,REQUEST = require('request')
,ASYNC = require('async')
,MONGO = require('mongodb').MongoClient
,__ = require('underscore')
,FS = require('fs')
,APP = EXPRESS()
,MOMENT = require('moment')
,BODYPARSER = require('body-parser')
;

APP.use(BODYPARSER({limit: '50000mb',extended:true,parameterLimit: 1000000000}));
APP.use(BODYPARSER.json({limit: '50000mb',extended:true,parameterLimit: 1000000000})); // support json encoded bodies
APP.use(BODYPARSER.urlencoded({ limit: '50000mb',extended: true,parameterLimit: 1000000000})); // support encoded bodies
// APP.use(BODYPARSER());

var _getmax = async (t)=>{
return new Promise(function(resolve, reject){

const url = "mongodb://app:7GT8Cdl*fq4Z@cl00-shard-00-00-uacod.mongodb.net:27017,cl00-shard-00-01-uacod.mongodb.net:27017,cl00-shard-00-02-uacod.mongodb.net:27017/cbb?ssl=true&replicaSet=CL00-shard-0&authSource=admin";

var Q = {"*":"*"}
				switch (t.toLowerCase()) {
					case 'point':
					Q={"geometry.type":'Point'}
					break;
					case 'polygon':
					// Q={$or:[{'geometry.type':'Polygon'},{'geometry.type':'MultiPolygon'}]}
					Q={$and:[{ 'geometry.type': { $ne: "Point" } },{ 'geometry.type': { $ne: "LineString" } },{ 'geometry.type': { $ne: "MultiLineString" } }]}
					break;
					case 'multipolygon':
					// Q={$or:[{'geometry.type':'Polygon'},{'geometry.type':'MultiPolygon'}]}
					Q={$and:[{ 'geometry.type': { $ne: "Point" } },{ 'geometry.type': { $ne: "LineString" } },{ 'geometry.type': { $ne: "MultiLineString" } }]}
					break;
					case 'multilinestring':
					Q={$or:[{'geometry.type':'Linestring'},{'geometry.type':'MultiLineString'}]}
					break;
					case 'linestring':
					Q={$or:[{'geometry.type':'Linestring'},{'geometry.type':'MultiLineString'}]}
					break;
					default:
							// statements_def
							break;
						}
console.log("Q",Q)

		MONGO.connect(url,(err, client)=>{

const db = client.db('cbb');
			var col = db.collection('geo');
			var sort = { "_id": -1 };
				col.find(Q).sort(sort).limit(1).toArray((e,r)=>{

				var prevmax = (__.first(r).properties.cartodb_id)
				console.log("prevmax",prevmax);
				var next = parseInt(prevmax)+1
								resolve(next);
			});

		});

}//promise
)
}//send

var _send = async (D)=>{

return new Promise(function(resolve, reject){


const url = "mongodb://app:7GT8Cdl*fq4Z@cl00-shard-00-00-uacod.mongodb.net:27017,cl00-shard-00-01-uacod.mongodb.net:27017,cl00-shard-00-02-uacod.mongodb.net:27017/cbb?ssl=true&replicaSet=CL00-shard-0&authSource=admin";



		MONGO.connect(url,(err, client)=>{
			
			const db = client.db('cbb');
			var col = db.collection('geo');
				col.insertMany([D]).then((r)=>{
				// db.close();
				resolve([D]);
			});

		});

}//promise
)
}//send

var _send_garbage = async (D)=>{

return new Promise(function(resolve, reject){


const url = "mongodb://app:7GT8Cdl*fq4Z@cl00-shard-00-00-uacod.mongodb.net:27017,cl00-shard-00-01-uacod.mongodb.net:27017,cl00-shard-00-02-uacod.mongodb.net:27017/garbage?ssl=true&replicaSet=CL00-shard-0&authSource=admin";



		MONGO.connect(url,(err, client)=>{
			
			const db = client.db('garbage');
			var col = db.collection('guesses');
				col.insertMany([D]).then((r)=>{
				// db.close();
				resolve([D]);
			});

		});

}//promise
)
}//send


APP.post('/geocode/submit/garbage',async (req, res)=>{
    
    var doc = req.body;

	var e = doc;

	e.geometry.coordinates[0]=parseFloat(e.geometry.coordinates[0]);
	e.geometry.coordinates[1]=parseFloat(e.geometry.coordinates[1]);
	
    var insrt = await _send_garbage(e);

	res.header("Access-Control-Allow-Origin", "*");
    res.send({response:insrt});

    // }
});

APP.get('/test/_getmax/:which',async (req,res)=>{
	
	var F = req.params.which
	var max = await _getmax(F);

res.send(max)

})

APP.post('/geocode/submit/cbb',async (req, res)=>{
    
	res.header("Access-Control-Allow-Origin", "*");
    var doc = req.body;


var count = (doc.properties.name.match(/,/g) || []).length;



    if(doc.properties.anno==null){
    	res.send("empty anno")
    } else if(count>=2){

res.send("probably default properties.name value (2+ commas)")
    } else {
	
    
    	console.log("getting max id with doc.geometry.type",doc.geometry.type);
    doc.properties.cartodb_id=await _getmax(doc.geometry.type);

console.log("resulting doc w/ new max id:",doc);

    const url = "mongodb://app:7GT8Cdl*fq4Z@cl00-shard-00-00-uacod.mongodb.net:27017,cl00-shard-00-01-uacod.mongodb.net:27017,cl00-shard-00-02-uacod.mongodb.net:27017/cbb?ssl=true&replicaSet=CL00-shard-0&authSource=admin";

    var insrt = await _send(doc);
    // var insrt = null;

    res.send({response:insrt});

    }
});

APP.get('/fake/:which',(req,res)=>{
	var F = (req.params.which=='cage')?'./offline/cage-fake.geojson':'./offline/geojson.geojson'
	FS.readFile(F,(E,D)=>{
		if(E) throw Error(E);
		res.send(JSON.parse(D))
	})
})

APP.get('/geocode/:loc',(req,res)=>{


	res.setHeader('Content-Type', 'application/json');
	// allow cors
	res.header("Access-Control-Allow-Origin", "*");
	var Q = {incoming:req.params.loc}
	var R = {
		// Q:Q.incoming.replace(",","")
		Q:Q.incoming
		// ,QR:Q.incoming
	} //~empty response obj
	// QUITE a sketchy way to test for an address v. placename string
var typ=null;
var options=null;


	switch (true) {

					case (Q.incoming=='geojson.geojson'):
					typ='file';
					options = { method: 'GET'};
					break;

					case (__.every(Q.incoming.split(","),(n)=>{return Number.parseFloat(n);})):
					typ='coordinates';
					break;					
					
					case (__.some(Q.incoming.split(","),(n)=>{return Number.parseFloat(n);})):
					typ='address'
					options = { method: 'GET',
		url: (CONFIG.mode=='T')?'http://localhost:8080/fake/cage':"https://api.opencagedata.com/geocode/v1/geojson?pretty=0&no_annotation=1&q="+encodeURI(R.Q)+"&key="+CONFIG.opencage_key,
	};
					break;

					case (Q.incoming.indexOf(":")<0):

					typ='placename'
							options = {method: 'GET',
		url: (CONFIG.mode=='T')?'http://localhost:8080/fake/nominatim':'http://nominatim.openstreetmap.org/search.php',
		qs: { limit: '10',
		format: 'jsonv2',
		polygon_geojson:1,
		dedupe: '1', q: Q.incoming },
		headers: { 
			'cache-control': 'no-cache',
			'User-Agent': 'CBB BitMap Geocoder'
			 } 
	};
					break;

					default:
											typ='file';
					options = { method: 'GET'};
							break;
						}

//write it out
R.type=typ;

// done with sniffing, requesting...

if(typ=='coordinates'){

var q = Q.incoming.split(",")

var o = {}

o.type="Feature"
o.geometry={
    "type": "Point",
    "coordinates": [
      q[0],
      q[1]
    ]
  },
o.properties={
	name:"manual coordinates"
	,anno:null
	,confidence:null
	,scnotes:"manual coordinates via milleria geocoder"
	,created_at:MOMENT().format('YYYY-MM-DDTHH:mm:ss')+'Z'
	,updated_at:MOMENT().format('YYYY-MM-DDTHH:mm:ss')+'Z'
	,cartodb_id:null 
}


	res.jsonp(o)
}
else if(typ=="file"){
console.log("type is fil")
var qobj = JSON.parse(decodeURI(Q.incoming))
	var o = {}

o.type="Feature"
o.geometry="well get this frm local file",
o.properties={
	name:qobj.feature
	,anno:null
	,confidence:null
	,scnotes:"local file via milleria geocoder"
	,created_at:MOMENT().format('YYYY-MM-DDTHH:mm:ss')+'Z'
	,updated_at:MOMENT().format('YYYY-MM-DDTHH:mm:ss')+'Z'
	,cartodb_id:null 
}

FS.readFile(CONFIG.pickup+Q.incoming,(err,data)=>{

if(err){
	console.log("ERROR",err);
	process.exit();
	res.jsonp({error:err})
}
var jdata = JSON.parse(data);


var feature = __.find(jdata.features, (F)=>{ 
	console.log("F",F.properties.PROV_NAME);
	return F.properties.PROV_NAME==qobj.feature; 
});


	o.geometry=feature.geometry
	
res.jsonp(o);

})//readfile

}
else {

console.log("requesting with options@264",options);

		REQUEST(options, (error, resp, body)=>{

			if (error) {
				throw new Error(error);
				console.log("error",error)
				R.success='false';
				R.error=error;
				res.jsonp(R);
			}//if.error
			else {

				B = JSON.parse(body)

if(R.type=='address'){

// console.log(JSON.stringify(B))

var caged = __.map(B.features,(r)=>{

var o = {}

o.type="Feature"
o.geometry=r.geometry
o.properties={
	name:r.properties.formatted
	,anno:null
	,confidence:null
	,scnotes:"opencage geocoder via milleria geocoder"
	,created_at:MOMENT().format('YYYY-MM-DDTHH:mm:ss')+'Z'
	,updated_at:MOMENT().format('YYYY-MM-DDTHH:mm:ss')+'Z'
	,cartodb_id:null 
}

return o;

})

				res.jsonp(caged);
} else {

// if it's not coming from opencage, we gotta move some things around
console.log("response frm nominatim",body);
var mongifiedz = __.map(B,(r)=>{

var o = {}

o.type="Feature"
o.geometry=r.geojson
o.properties={
	name:r.display_name
	,anno:null
	,confidence:null
	,scnotes:"nominatim via milleria geocoder"
	,created_at:MOMENT().format('YYYY-MM-DDTHH:mm:ss')+'Z'
	,updated_at:MOMENT().format('YYYY-MM-DDTHH:mm:ss')+'Z'
	,cartodb_id:null 
}

return o;

})

res.jsonp(mongifiedz);

}//type.address?

		} //if.error.else
	});

}//else.coordinates

})//.get/geocode

APP.get('/geoms/:app',(req,res)=>{
	console.log('req',req);
	res.setHeader('Content-Type', 'application/json');
	// allow cors
	res.header("Access-Control-Allow-Origin", "*");
	
	if(req.params.app=='cbb' && (typeof req.query.q == 'undefined' || req.query.q.indexOf(":")<0)){
		var o = {success:false,msg:"missing or invalid q param"}
		res.send(JSON.stringify(o))
	} else {

		if(req.params.app == 'offline'){
			FS.readFile('./offline/geojson.geojson',(e,d)=>{

				if(e) throw Error(e);
				var J = JSON.parse(d);
				console.log("J",J)
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
		var url = (CONFIG.mode=='T')?'mongodb://localhost:27017/cbb':'mongodb://app:7GT8Cdl*fq4Z@cl00-shard-00-00-uacod.mongodb.net:27017,cl00-shard-00-01-uacod.mongodb.net:27017,cl00-shard-00-02-uacod.mongodb.net:27017/cbb?authSource=admin&replicaSet=CL00-shard-0&ssl=true';
		// Use connect method to connect to the Server
		MONGO.connect(url,(err, client)=>{

			console.log("Connected correctly to server");

			const db = client.db('cbb');
			var col = db.collection('geo');

			col.find(query).limit(999999).toArray((err, docs)=>{
				if(err){res.send(JSON.stringify(err));}else{
					// res.send(JSON.stringify(docs));
					res.jsonp(docs);
					// db.close();
				}
		    });//.find.toarray

		});//.connect
	}//test of app==cbb (no others for now but later maybe)
	else if(req.params.app == 'garbage'){

		// Connection URL
		// var url = 'mongodb://app:7GT8Cdl*fq4Z@cl00-shard-00-00-uacod.mongodb.net:27017,cl00-shard-00-01-uacod.mongodb.net:27017,cl00-shard-00-02-uacod.mongodb.net:27017/cbb?authSource=admin&replicaSet=CL00-shard-0&ssl=true';
		var url = (CONFIG.mode=='T')?'mongodb://localhost:27017/garbage':'mongodb://app:7GT8Cdl*fq4Z@cl00-shard-00-00-uacod.mongodb.net:27017,cl00-shard-00-01-uacod.mongodb.net:27017,cl00-shard-00-02-uacod.mongodb.net:27017/garbage?authSource=admin&replicaSet=CL00-shard-0&ssl=true';
		// Use connect method to connect to the Server
		MONGO.connect(url,(err, client)=>{
			console.log("Connected correctly to server");

const db = client.db('garbage');
			var col = db.collection('guesses');

			col.find({ 'properties.class': { $ne: 'RT' } }).limit(999999).toArray((err, docs)=>{
				if(err){res.send(JSON.stringify(err));}else{

					res.jsonp({"type": "FeatureCollection","features":docs});
					// db.close();
				}
		    });//.find.toarray

		});//.connect

	}//if.garbage


}//else of params test
}) //APP.get


APP.listen(CONFIG.port)
console.log('running at http://localhost:'+CONFIG.port);
exports = module.exports = APP;
