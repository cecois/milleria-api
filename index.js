const CONFIG = require("./Config.json")
const EXPRESS = require('express')
	, REQUEST = require('request')
	, ASYNC = require('async')
	, MONGO = require('mongodb').MongoClient
	,MONGO_OBJECTID = require('mongodb').ObjectId
	, __ = require('underscore')
	, FS = require('fs')
	, CORS = require('cors')
	, APP = EXPRESS()
	, MOMENT = require('moment')
	, BODYPARSER = require('body-parser')
	, NOGO = require('node-geocoder');
APP.use(CORS());
APP.use(BODYPARSER({
	limit: '50000mb'
	, extended: true
	, parameterLimit: 1000000000
}));
APP.use(BODYPARSER.json({
	limit: '50000mb'
	, extended: true
	, parameterLimit: 1000000000
})); // support json encoded bodies
APP.use(BODYPARSER.urlencoded({
	limit: '50000mb'
	, extended: true
	, parameterLimit: 1000000000
})); // support encoded bodies
const options = {
	provider: 'datasciencetoolkit', // Optional depending on the providers
	httpAdapter: 'http'
	, formatter: null, // 'gpx', 'string', ...
	"user-agent": 'Milleria-API'
	, format: 'json'
};
const GEOC = NOGO(options);
var _getmax = async (t) => {
	return new Promise(function (resolve, reject) {
			// const url = "mongodb://app:7GT8Cdl*fq4Z@cl00-shard-00-00-uacod.mongodb.net:27017,cl00-shard-00-01-uacod.mongodb.net:27017,cl00-shard-00-02-uacod.mongodb.net:27017/cbb?ssl=true&replicaSet=CL00-shard-0&authSource=admin";
			const url = "mongodb://cecois:r0mjwrD61vaRhWKn@cbbcluster0-shard-00-00-wdqp7.gcp.mongodb.net:27017,cbbcluster0-shard-00-01-wdqp7.gcp.mongodb.net:27017,cbbcluster0-shard-00-02-wdqp7.gcp.mongodb.net:27017/test?ssl=true&replicaSet=cbbcluster0-shard-0&authSource=admin&retryWrites=true";
			var Q = {
				"*": "*"
			}
			switch (t.toLowerCase()) {
				case 'point':
					Q = {
						"geometry.type": 'Point'
					}
					break;
				case 'polygon':
					// Q={$or:[{'geometry.type':'Polygon'},{'geometry.type':'MultiPolygon'}]}
					Q = {
						$and: [{
							'geometry.type': {
								$ne: "Point"
							}
						}, {
							'geometry.type': {
								$ne: "LineString"
							}
						}, {
							'geometry.type': {
								$ne: "MultiLineString"
							}
						}]
					}
					break;
				case 'multipolygon':
					// Q={$or:[{'geometry.type':'Polygon'},{'geometry.type':'MultiPolygon'}]}
					Q = {
						$and: [{
							'geometry.type': {
								$ne: "Point"
							}
						}, {
							'geometry.type': {
								$ne: "LineString"
							}
						}, {
							'geometry.type': {
								$ne: "MultiLineString"
							}
						}]
					}
					break;
				case 'multilinestring':
					Q = {
						$or: [{
							'geometry.type': 'Linestring'
						}, {
							'geometry.type': 'MultiLineString'
						}]
					}
					break;
				case 'linestring':
					Q = {
						$or: [{
							'geometry.type': 'Linestring'
						}, {
							'geometry.type': 'MultiLineString'
						}]
					}
					break;
				default:
					// statements_def
					break;
			}
			console.log("Q", Q)
			MONGO.connect(url, (err, client) => {
				const db = client.db('cbb');
				var col = db.collection('geo');
				var sort = {
					"_id": -1
				};
				col.find(Q).sort(sort).limit(1).toArray((e, r) => {
					var prevmax = (__.first(r).properties.cartodb_id)
					console.log("prevmax", prevmax);
					var next = parseInt(prevmax) + 1
					resolve(next);
				});
			});
		} //promise
	)
} //send
var _send = async (D) => {
	return new Promise(function (resolve, reject) {
			// const url = "mongodb://app:7GT8Cdl*fq4Z@cl00-shard-00-00-uacod.mongodb.net:27017,cl00-shard-00-01-uacod.mongodb.net:27017,cl00-shard-00-02-uacod.mongodb.net:27017/cbb?ssl=true&replicaSet=CL00-shard-0&authSource=admin";
			const url = "mongodb://cecois:r0mjwrD61vaRhWKn@cbbcluster0-shard-00-00-wdqp7.gcp.mongodb.net:27017,cbbcluster0-shard-00-01-wdqp7.gcp.mongodb.net:27017,cbbcluster0-shard-00-02-wdqp7.gcp.mongodb.net:27017/test?ssl=true&replicaSet=cbbcluster0-shard-0&authSource=admin&retryWrites=true";
			MONGO.connect(url, (err, client) => {
				const db = client.db('cbb');
				var col = db.collection('geo');
				col.insertMany([D]).then((r) => {
					// db.close();
					resolve([D]);
				});
			});
		} //promise
	)
} //send
var _update_missing = async (cid,ctyp) => {
	console.log("updating missings pair:", cid+':'+ctyp);
	return new Promise(function (resolve, reject) {
			// const url = "mongodb://app:7GT8Cdl*fq4Z@cl00-shard-00-00-uacod.mongodb.net:27017,cl00-shard-00-01-uacod.mongodb.net:27017,cl00-shard-00-02-uacod.mongodb.net:27017/cbb?ssl=true&replicaSet=CL00-shard-0&authSource=admin";
			const url = "mongodb://cecois:r0mjwrD61vaRhWKn@cbbcluster0-shard-00-00-wdqp7.gcp.mongodb.net:27017,cbbcluster0-shard-00-01-wdqp7.gcp.mongodb.net:27017,cbbcluster0-shard-00-02-wdqp7.gcp.mongodb.net:27017/test?ssl=true&replicaSet=cbbcluster0-shard-0&authSource=admin&retryWrites=true";
			MONGO.connect(url, (err, client) => {
				const db = client.db('cbb');
				var col = db.collection('missings');
				// let oid = new MONGO_OBJECTID(I)
				col.updateOne({"carto.cartodb_id": cid,"carto.type":ctyp}, {
					$set: {
						"fixed": true
					}
				}).then((r) => {
					// db.close();
					resolve(r);
				});
				// col.insertMany([D]).then((r) => {
				// 	// db.close();
				// 	resolve([D]);
				// });
			});
		} //promise
	)
} //send
var _send_garbage = async (D) => {
	return new Promise(function (resolve, reject) {
			// const url = "mongodb://app:7GT8Cdl*fq4Z@cl00-shard-00-00-uacod.mongodb.net:27017,cl00-shard-00-01-uacod.mongodb.net:27017,cl00-shard-00-02-uacod.mongodb.net:27017/garbage?ssl=true&replicaSet=CL00-shard-0&authSource=admin";
			const url = "mongodb://cecois:r0mjwrD61vaRhWKn@cbbcluster0-shard-00-00-wdqp7.gcp.mongodb.net:27017,cbbcluster0-shard-00-01-wdqp7.gcp.mongodb.net:27017,cbbcluster0-shard-00-02-wdqp7.gcp.mongodb.net:27017/test?ssl=true&replicaSet=cbbcluster0-shard-0&authSource=admin&retryWrites=true";
			MONGO.connect(url, (err, client) => {
				const db = client.db('garbage');
				var col = db.collection('guesses');
				col.insertMany([D]).then((r) => {
					// db.close();
					resolve([D]);
				});
			});
		} //promise
	)
} //send
const _dst2geojson = async (D) => {
	return new Promise(function (resolve, reject) {
			// {"_id":"5a073902126838b176f81557","type":"Feature","geometry":{"type":"Point","coordinates":[-82.461319,27.946493]},"properties":{"name":"Tampa, FL","anno":"all kinds of tips from Diner Marshal Central;hometown of: Sprague the Whisperer","confidence":"medium","cartodb_id":201,"created_at":"2015-02-26T12:48:58Z","updated_at":"2015-02-26T12:50:02Z","scnotes":"no poly from Nominatim"}}
			const GJ = __.map(D, (d) => {
				console.log("d", d);
				let o = {
					"type": "Feature"
					, "geometry": {
						"type": "Point"
						, "coordinates": [d.value.longitude, 27.946493]
					}
					, "properties": {
						"name": "Tampa, FL"
						, "anno": "all kinds of tips from Diner Marshal Central;hometown of: Sprague the Whisperer"
						, "confidence": "medium"
						, "cartodb_id": 201
						, "created_at": "2015-02-26T12:48:58Z"
						, "updated_at": "2015-02-26T12:50:02Z"
						, "scnotes": "no poly from Nominatim"
					}
				}
				return o;
			})
			resolve(GJ);
		} //promise
	)
} //send
APP.post('/geocode/fix/once', async (req, res) => {
	var doc = req.body;
	// var I = doc.id;
	var cid=doc.cid,ctyp=doc.ctyp;
	var updt = await _update_missing(cid,ctyp);
	res.header("Access-Control-Allow-Origin", "*");
	res.send({
		response: updt
	});
	// }
});
APP.post('/geocode/submit/garbage', async (req, res) => {
	var doc = req.body;
	var e = doc;
	e.geometry.coordinates[0] = parseFloat(e.geometry.coordinates[0]);
	e.geometry.coordinates[1] = parseFloat(e.geometry.coordinates[1]);
	var insrt = await _send_garbage(e);
	res.header("Access-Control-Allow-Origin", "*");
	res.send({
		response: insrt
	});
	// }
});
APP.get('/test/_getmax/:which', async (req, res) => {
	var F = req.params.which
	var max = await _getmax(F);
	res.send(max)
})
APP.post('/geocode/batch', async (req, res) => {
	res.header("Access-Control-Allow-Origin", "*");
	console.log("plucking addresses...")
	const obj = [{
		address: "216 e. 2nd st, tipton, ia"
		, plant: '216plant'
		, age: 10
		, aid: "216e2ndsttiptoniaunitedstates"
	}, {
		address: "1306 larry lane, laredo, tx"
		, plant: 'larryplant'
		, age: 222
		, aid: "1306larrylanelaredotxunitedstates"
	}]
	// var addresses = req.body;
	var addresses = __.pluck(obj, 'address');
	console.log("sending to geocoder...")
	GEOC.batchGeocode(addresses)
		.then(function (resp) {
			console.log("reassociating...")
			let reassociated = __.map(resp, (d) => {
				const j = d.value[0];
				// console.log("j",j)
				let cid = (j.streetNumber.trim() + j.streetName.trim() + j.city.trim() + j.state.trim() + 'unitedstates').toLowerCase().replace(/\s/g, "")
				let aged = __.findWhere(obj, {
					aid: cid
				})
				let age = (typeof aged !== 'undefined') ? aged.age : 'unfound';
				let o = {
					"type": "Feature"
					, "geometry": {
						"type": "Point"
						, "coordinates": [j.longitude, j.latitude]
					}
					, "properties": {
						"age": age
						, "id": cid
						, "name": j.streetNumber + ' ' + j.streetName + ', ' + j.city + ', ' + j.state + ' ' + j.country
						, "anno": 'geocoding by ' + j.provider
					}
				}
				return o;
			})
			let orsp = {
				"type": "FeatureCollection"
				, "features": reassociated
			}
			console.log("returning orsp:", orsp)
			res.json(JSON.stringify(orsp)) //send
		})
		.catch(function (err) {
			res.send(err)
		});
}); //.post
APP.post('/geocode/submit/cbb', async (req, res) => {
	res.header("Access-Control-Allow-Origin", "*");
	var doc = req.body;
	var count = (doc.properties.name.match(/,/g) || []).length;
	if (doc.properties.anno == null) {
		res.send("empty anno")
	} else if (count >= 3) {
		res.send("probably default properties.name value (3+ commas)")
	} else {
		if (!doc.properties.cartodb_id) {
			console.log("getting max id with doc.geometry.type", doc.geometry.type);
			doc.properties.cartodb_id = await _getmax(doc.geometry.type);
			console.log("resulting doc w/ new max id:", doc);
		}
		const url = "mongodb://cecois:r0mjwrD61vaRhWKn@cbbcluster0-shard-00-00-wdqp7.gcp.mongodb.net:27017,cbbcluster0-shard-00-01-wdqp7.gcp.mongodb.net:27017,cbbcluster0-shard-00-02-wdqp7.gcp.mongodb.net:27017/test?ssl=true&replicaSet=cbbcluster0-shard-0&authSource=admin&retryWrites=true";
		var insrt = await _send(doc);
		res.send({
			response: insrt
		});
	}
});
APP.get('/fake/:which', (req, res) => {
	var F = (req.params.which == 'cage') ? './offline/cage-fake.geojson' : './offline/geojson.geojson'
	FS.readFile(F, (E, D) => {
		if (E) throw Error(E);
		res.send(JSON.parse(D))
	})
})
APP.get('/geocode/:loc', (req, res) => {
	res.setHeader('Content-Type', 'application/json');
	// allow cors
	res.header("Access-Control-Allow-Origin", "*");
	var Q = {
		"incoming": req.params.loc
	}
	console.log("Q:", Q)
	var R = {
		// Q:Q.incoming.replace(",","")
		Q: Q.incoming
		// ,QR:Q.incoming
	} //~empty response obj
	// QUITE a sketchy way to test for an address v. placename string
	var typ = null;
	var options = null;
	switch (true) {
		case (Q.incoming == 'geojson.geojson'):
			typ = 'file';
			options = {
				method: 'GET'
			};
			break;
		case (__.every(Q.incoming.split(","), (n) => {
			return Number.parseFloat(n);
		})):
			typ = 'coordinates';
			break;
		case (__.some(Q.incoming.split(","), (n) => {
			return Number.parseFloat(n);
		})):
			typ = 'address'
			options = {
				method: 'GET'
				, url: (CONFIG.mode == 'T') ? 'http://localhost:8080/fake/cage' : "https://api.opencagedata.com/geocode/v1/geojson?pretty=0&no_annotation=1&q=" + encodeURI(R.Q) + "&key=" + CONFIG.opencage_key
			, };
			break;
		case (Q.incoming.indexOf(":") < 0):
			typ = 'placename'
			options = {
				method: 'GET'
				, url: (CONFIG.mode == 'T') ? 'http://localhost:8080/fake/nominatim' : 'http://nominatim.openstreetmap.org/search.php'
				, qs: {
					limit: '10'
					, format: 'jsonv2'
					, polygon_geojson: 1
					, dedupe: '1'
					, q: Q.incoming
				}
				, headers: {
					'cache-control': 'no-cache'
					, 'User-Agent': 'CBB BitMap Geocoder'
				}
			};
			break;
		default:
			typ = 'file';
			options = {
				method: 'GET'
			};
			break;
	}
	//write it out
	R.type = typ;
	// done with sniffing, requesting...
	if (typ == 'coordinates') {
		var q = Q.incoming.split(",")
		var o = {}
		o.type = "Feature"
		o.geometry = {
				"type": "Point"
				, "coordinates": [
					q[0]
					, q[1]
				]
			}
			, o.properties = {
				name: "manual coordinates"
				, anno: null
				, confidence: null
				, scnotes: "manual coordinates via milleria geocoder"
				, created_at: MOMENT().format('YYYY-MM-DDTHH:mm:ss') + 'Z'
				, updated_at: MOMENT().format('YYYY-MM-DDTHH:mm:ss') + 'Z'
				, cartodb_id: null
			}
		res.jsonp(o)
	} else if (typ == "file") {
		console.log("type is fil")
		var o = {}
		o.type = "Feature"
		o.geometry = "well get this frm local file"
			, o.properties = {
				name: Q.incoming
				, anno: null
				, confidence: null
				, scnotes: "local file via milleria geocoder"
				, created_at: MOMENT().format('YYYY-MM-DDTHH:mm:ss') + 'Z'
				, updated_at: MOMENT().format('YYYY-MM-DDTHH:mm:ss') + 'Z'
				, cartodb_id: null
			}
		FS.readFile(CONFIG.pickup + Q.incoming, (err, data) => {
			if (err) {
				console.log("ERROR", err);
				process.exit();
				res.jsonp({
					error: err
				})
			}
			var jdata = JSON.parse(data);
			// var feature = __.find(jdata.features, (F)=>{ 
			// 	console.log("F",F.properties.PROV_NAME);
			// 	return F.properties.PROV_NAME==qobj.feature; 
			// });
			let feature = jdata.features[0]
			o.geometry = feature.geometry
			res.jsonp(o);
		}) //readfile
	} else {
		console.log("requesting with options@264", options);
		REQUEST(options, (error, resp, body) => {
			if (error) {
				throw new Error(error);
				console.log("error", error)
				R.success = 'false';
				R.error = error;
				res.jsonp(R);
			} //if.error
			else {
				B = JSON.parse(body)
				if (R.type == 'address') {
					// console.log(JSON.stringify(B))
					var caged = __.map(B.features, (r) => {
						var o = {}
						o.type = "Feature"
						o.geometry = r.geometry
						o.properties = {
							name: r.properties.formatted
							, anno: null
							, confidence: null
							, scnotes: "opencage geocoder via milleria geocoder"
							, created_at: MOMENT().format('YYYY-MM-DDTHH:mm:ss') + 'Z'
							, updated_at: MOMENT().format('YYYY-MM-DDTHH:mm:ss') + 'Z'
							, cartodb_id: null
						}
						return o;
					})
					res.jsonp(caged);
				} else {
					// if it's not coming from opencage, we gotta move some things around
					console.log("response frm nominatim", body);
					var mongifiedz = __.map(B, (r) => {
						var o = {}
						o.type = "Feature"
						o.geometry = r.geojson
						o.properties = {
							name: r.display_name
							, anno: null
							, confidence: null
							, scnotes: "nominatim via milleria geocoder"
							, created_at: MOMENT().format('YYYY-MM-DDTHH:mm:ss') + 'Z'
							, updated_at: MOMENT().format('YYYY-MM-DDTHH:mm:ss') + 'Z'
							, cartodb_id: null
						}
						return o;
					})
					res.jsonp(mongifiedz);
				} //type.address?
			} //if.error.else
		});
	} //else.coordinates
}) //.get/geocode
APP.get('/geoms/:app', (req, res) => {
	console.log('req', req);
	res.setHeader('Content-Type', 'application/json');
	// allow cors
	res.header("Access-Control-Allow-Origin", "*");
	if (req.params.app == 'cbb' && (typeof req.query.q == 'undefined' || req.query.q.indexOf(":") < 0)) {
		var o = {
			success: false
			, msg: "missing or invalid q param"
		}
		res.send(JSON.stringify(o))
	} else {
		if (req.params.app == 'offline') {
			FS.readFile('./offline/geojson.geojson', (e, d) => {
				if (e) throw Error(e);
				var J = JSON.parse(d);
				console.log("J", J)
				res.jsonp(J.features);
			})
		} //if.offlien
		if (req.params.app == 'cbb') {
			var clauses = __.map(req.query.q.split(","), (p) => {
				var pa = p.split(":")
					, pat = '';
				switch (pa[0]) {
					case 'point':
						pat = 'Point'
						break;
					case 'poly':
						pat = 'Polygon'
						break;
					case 'line':
						pat = 'Line'
						break;
					default:
						// statements_def
						break;
				}
				var qt = {
					"geometry.type": {
						"$regex": ".*" + pat + ".*"
					}
				}
				var qv = {
					"properties.cartodb_id": parseInt(pa[1])
				}
				return {
					$and: [qt, qv]
				}
			}); //map
			var query = {
				$or: clauses
			}
			// Connection URL
			// var url = 'mongodb://app:7GT8Cdl*fq4Z@cl00-shard-00-00-uacod.mongodb.net:27017,cl00-shard-00-01-uacod.mongodb.net:27017,cl00-shard-00-02-uacod.mongodb.net:27017/cbb?authSource=admin&replicaSet=CL00-shard-0&ssl=true';
			var url = 'mongodb://cecois:r0mjwrD61vaRhWKn@cbbcluster0-shard-00-00-wdqp7.gcp.mongodb.net:27017,cbbcluster0-shard-00-01-wdqp7.gcp.mongodb.net:27017,cbbcluster0-shard-00-02-wdqp7.gcp.mongodb.net:27017/test?ssl=true&replicaSet=cbbcluster0-shard-0&authSource=admin&retryWrites=true';
			// Use connect method to connect to the Server
			MONGO.connect(url, (err, client) => {
				console.log("Connected correctly to server");
				const db = client.db('cbb');
				var col = db.collection('geo');
				col.find(query).limit(999999).toArray((err, docs) => {
					if (err) {
						res.send(JSON.stringify(err));
					} else {
						// res.send(JSON.stringify(docs));
						res.jsonp(docs);
						// db.close();
					}
				}); //.find.toarray
			}); //.connect
		} //test of app==cbb (no others for now but later maybe)
		else if (req.params.app == 'garbage') {
			// Connection URL
			// var url = 'mongodb://app:7GT8Cdl*fq4Z@cl00-shard-00-00-uacod.mongodb.net:27017,cl00-shard-00-01-uacod.mongodb.net:27017,cl00-shard-00-02-uacod.mongodb.net:27017/cbb?authSource=admin&replicaSet=CL00-shard-0&ssl=true';
			var url = 'mongodb://cecois:r0mjwrD61vaRhWKn@cbbcluster0-shard-00-00-wdqp7.gcp.mongodb.net:27017,cbbcluster0-shard-00-01-wdqp7.gcp.mongodb.net:27017,cbbcluster0-shard-00-02-wdqp7.gcp.mongodb.net:27017/test?ssl=true&replicaSet=cbbcluster0-shard-0&authSource=admin&retryWrites=true';
			// Use connect method to connect to the Server
			MONGO.connect(url, (err, client) => {
				console.log("Connected correctly to server");
				const db = client.db('garbage');
				var col = db.collection('guesses');
				col.find({
					'properties.class': {
						$ne: 'RT'
					}
				}).limit(999999).toArray((err, docs) => {
					if (err) {
						res.send(JSON.stringify(err));
					} else {
						res.jsonp({
							"type": "FeatureCollection"
							, "features": docs
						});
						// db.close();
					}
				}); //.find.toarray
			}); //.connect
		} //if.garbage
	} //else of params test
}) //APP.get
APP.get('/missings/:which', (req, res) => {
	res.setHeader('Content-Type', 'application/json');
	// allow cors
	res.header("Access-Control-Allow-Origin", "*");
	// Use connect method to connect to the Server
	const uri = "mongodb://cecois:r0mjwrD61vaRhWKn@cbbcluster0-shard-00-00-wdqp7.gcp.mongodb.net:27017,cbbcluster0-shard-00-01-wdqp7.gcp.mongodb.net:27017,cbbcluster0-shard-00-02-wdqp7.gcp.mongodb.net:27017/test?ssl=true&replicaSet=cbbcluster0-shard-0&authSource=admin&retryWrites=true";
	const client = new MONGO(uri, {
		useNewUrlParser: true
	});
	client.connect(err => {
		if (err) console.log(err);
		const col = client.db("cbb").collection("missings");
		// perform actions on the collection object
		col.find({
			'fixed': {
				$ne: true
			}
		}).limit(999999).toArray((err, docs) => {
			if (err) {
				res.send(JSON.stringify(err));
				client.close();
			} else {
				client.close();
				res.jsonp(docs)
				// res.jsonp(docs);
				// db.close();
			}
		}); //.find.toarray
	});
}) //APP.get
APP.listen(CONFIG.port)
console.log('running at http://localhost:' + CONFIG.port);
exports = module.exports = APP;