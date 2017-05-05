const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const redis  = require('redis');

let client = redis.createClient();

client.on('connect', function(){
  console.log('Connected to Redis...');
});

const port  = 3000;

const app  = express();


app.engine('handlebars',exphbs({defaultLayout:'main'}));

app.set('view engine', 'handlebars');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

RedisSMQ = require("rsmq");
rsmq = new RedisSMQ( {host: "127.0.0.1", port: 6379, ns: "rsmq"} );

rsmq.createQueue({qname:"myqueue"}, function (err, resp) {
        if (resp===1) {
            console.log("queue created")
        }
});

// RSMQ WORKER
  var RSMQWorker = require( "rsmq-worker" );
  var worker = new RSMQWorker( "myqueue" );

  worker.on( "message", function( msg, next, id ){
  	// process your message
  	var obj  = JSON.parse(msg);
  	client.hmset(obj.id, {
			    'pass': obj.pass,
			    'nombre':obj.nombre,
			    'apellido': obj.apellido,
			    'fecha': obj.fecha
			  }, function(err, reply){
			    if(err){
			      console.log(err);
			    }
			    console.log(reply);
			    //res.redirect('/');
			  });
  	console.log("se guardo el contenido de  : " + obj.id);
  	
  	next()
  });

  // optional error listeners
  worker.on('error', function( err, msg ){
      console.log( "ERROR", err, msg.id );
  });
  worker.on('exceeded', function( msg ){
      console.log( "EXCEEDED", msg.id );
  });
  worker.on('timeout', function( msg ){
      console.log( "TIMEOUT", msg.id, msg.rc );
  });

  worker.start();

// END Region

//buscar usuario
app.get('/', function (req,res,next){


	res.render('buscarusuario');

});

//proceso buscar 
app.post('/user/search', function(req, res, next){
  let id = req.body.id;

  client.hgetall(id, function(err, obj){
    if(!obj){
      res.render('buscarusuario', {
        error: 'usuario no existe'
      });
    } else {
      obj.id = id;
      res.render('details', {
        user: obj
      });
    }
  });
});

// Add User Page
app.get('/user/add', function(req, res, next){
  res.render('adduser');
});



// Process Add User Page
app.post('/user/add', function(req, res, next){
  let idp = req.body.id;
  let passp = req.body.pass;
  let nombrep = req.body.nombre;
  let apellidop = req.body.apellido;
  let fechap = req.body.fecha;
  let mensaje = JSON.stringify({id: idp, pass: passp , nombre: nombrep, apellido : apellidop, fecha : fechap});
  //console.log(id + " - " + first_name + " - " + last_name + " - " + email+ " - " +phone);
	rsmq.sendMessage({qname:"myqueue", message:""+mensaje}, function (err, resp) {
		if (resp) {

			console.log(">>"+idp+" Agregado a la cola [insercion]");
			res.redirect('/');
		}
	});

});

app.get('/user/log', function(req, res, next){
  res.render('loggin');
});

app.post('/user/log', function(req, res, next){
  let idp = req.body.id;
  let passp = req.body.pass;
  let mensaje = JSON.stringify({id: idp, pass: passp });
  //console.log(id + " - " + first_name + " - " + last_name + " - " + email+ " - " +phone);
	rsmq.sendMessage({qname:"myqueue", message:""+mensaje}, function (err, resp) {
		if (resp) {

			console.log(">>"+idp+" Agregado a la cola [loggin]");
			res.redirect('/');
		}
	});

});




app.listen(port, function(){
	console.log('Server se inicio en el puerto'+ port);

});