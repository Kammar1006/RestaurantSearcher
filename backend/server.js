/*
    Created by Kammar1006
*/

const opt = require('../settings.json');
const PORT = opt.port;
const COOKIE_FLAG = opt.cookie

const express = require('express');
const http = require('http');
const socketio = require('socket.io');

const {queryDatabase} = require('./db.js');
const bcrypt = require("bcrypt");

const app = express();
app.use(express.static(`${__dirname}/../frontend`));

const server = http.createServer(app);
const io = socketio(server, {
	cookie: true,
});

const {isAlnum, isEmail, isLen} = require("./strings_analyzer.js");
const { randomBytes } = require('crypto');

let translationTab = [];
const setCID = (sock) => {
	//console.log(sock.request.headers.cookie);
	let cid;
	if(sock.handshake.headers.cookie == undefined){
		return false;
	}
	let cookie = (sock.handshake.headers.cookie).split(" ");
	cookie.forEach(element => {
		if(element.split("=")[0]==COOKIE_FLAG) cid = element.split("=")[1];	
	});
	if(cid == undefined || cid == ""){
		return false;
	}
	else{
		if(cid[cid.length-1] == ";"){
			cid = cid.substring(0, cid.length-1);
		}
	}
	return cid;
}
const setTranslationTab = (cid) => {
	if(translationTab[cid]==undefined){
		translationTab[cid]={
			user_id: -1,
			db_stats: {},
			test_counter: 0,
		};
	}
}
const hasher = (data) => {
	return bcrypt.hashSync(data, 10);
}
const hashCompare = (data, hash) => {
	return (bcrypt.compareSync(data, hash));
}
const emit_login_data = (sock, db_stats) => {
	let emit_db_stats = {...db_stats};
	sock.emit("login", emit_db_stats); 
}

io.on('connection', (sock) => {
	let cid = setCID(sock);
	if(!cid){
		cid = randomBytes(30).toString('hex');
		sock.emit("set-cookie", `${COOKIE_FLAG}=${cid}; Path=/; SameSite=None; Secure`);
	}
	setTranslationTab(cid);
	console.log("User: "+cid);

	sock.on("counter", () => {
		translationTab[cid].test_counter++;
		sock.emit("message", "Count: "+translationTab[cid].test_counter);
	});

	//login:
	sock.on("login", (login, pass) => {
		if(!(isAlnum(login) && isAlnum(pass))) return;

		queryDatabase("SELECT * FROM users WHERE login =?", [login])
		.then((res) => {
			if(res && res.length == 1){
				if(hashCompare(pass, res[0].password)){
					console.log("Pass OKOK");
					translationTab[cid].user_id = res[0].id;
					translationTab[cid].db_stats = res[0];
					console.log(translationTab[cid]);
					emit_login_data(sock, translationTab[cid].db_stats);
				}
				else{
					console.log("Pass NOTOK");
					sock.emit("login", "Wrong login or password")
				}
			}
			else{
				console.log("Pass NOTOK");
				sock.emit("login", "Wrong login or password")
			}
		}).catch((err) => {
			console.log("DB ERROR: "+err);
		})
			
		
	});

	//register:
	sock.on("register", (login, pass, pass2, email) => {
		console.log("Register:", login, pass, pass2, email);
		
		if(!(isEmail(email))){
			console.log("Email is NOT ok");
			sock.emit("register", "wrong email format");
			return;
		}

		if(!(isLen(login, 4, 20) && isAlnum(login))){
			console.log("Login len ERR");
			sock.emit("register", "wrong login format/length");
			return;
		}

		if(!(isLen(pass, 8, 50) && isAlnum(pass))){
			console.log("Pass len ERR");
			sock.emit("register", "wrong pass format/length");
			return;
		}

		if(pass === pass2){
			console.log("All OK!!");

			queryDatabase("SELECT `login`, `email` FROM `users` WHERE login=? OR email=?", [login, email])
			.then((res) => {
				if(res.length){
					let a=0, b=0;
					res.forEach(e => {
						if(e.email == email) a = 1;
						if(e.login == login) b = 1;
					});
					if(a){
						console.log("Email is in db");
						sock.emit("register", "email in db");
					} 
					if(b){
						console.log("Login is in db");
						sock.emit("register", "login in db");
					} 
				}
				else{
					queryDatabase("INSERT INTO `users` (`id`, `login`, `password`, `email`) VALUES ('', ?, ?, ?)", [login, hasher(pass), email])
					.then(() => {
						sock.emit("register", "register");
					}).catch((err) => {console.log("DB Error: "+err)});
				}
			}).catch((err) => {console.log("DB Error: "+err);});
		}
		else{
			sock.emit("register", "pass != pass2");
		}
	});

	//logout
	sock.on("logout", () => {
		translationTab[cid].db_stats = {};
		translationTab[cid].user_id = -1;
		sock.emit("logout");
	});

	//for all users searching restaurant by name
	sock.on("searchByName", (name) => {
		if(isAlnum(name)){
			queryDatabase("SELECT restaurants.id AS res_id, restaurants.name AS res_name, restaurants.opinion AS res_score, restaurants.cuisine_type AS res_cusine, address AS res_address FROM restaurants WHERE name LIKE ? AND restaurants.verified = 1", [`%${name}%`])
			.then((res) => {
				sock.emit("restaurants", res);
			}).catch((err) => {console.log("DB Error: "+err);});
		}
	});

	//for all users searching restaurant by coords:
	sock.on("searchByCoords", (json) => {
		let data = JSON.parse(json);
		//console.log(data);
		if(data.x !== undefined && data.y !== undefined && data.r !== undefined){
			console.log(data.x, data.y, data.r);
			let sql = `
				SELECT id, name, address,
					(6371 * acos(
						cos(radians(?)) * cos(radians(ST_Y(coordinates))) *
						cos(radians(ST_X(coordinates)) - radians(?)) +
						sin(radians(?)) * sin(radians(ST_Y(coordinates)))
					)) AS distance_km
				FROM restaurants
				WHERE ST_Y(coordinates) > 0 AND ST_X(coordinates) > 0
				HAVING distance_km <= ?
				ORDER BY distance_km
			`;
			queryDatabase(sql, [data.y, data.x, data.y, data.r])
			.then((res) => {
				//console.log(res);
				sock.emit("restaurants", res);
			}).catch((err) => {console.log("DB Error: "+err);});
		}
	});

	//for all users searching restaurant by dishes:
	sock.on("searchByDish", (name) => {
		if(isAlnum(name)){
			let sql = `
				SELECT restaurants.id AS res_id, count(restaurants.id) AS sort_score, restaurants.name AS res_name, restaurants.opinion AS res_score, restaurants.cuisine_type AS res_cusine, 
				GROUP_CONCAT(dishes.name) AS dish_names
				FROM restaurants 
				INNER JOIN restaurants_dishes ON restaurants.id = restaurants_dishes.id_restaurant 
				INNER JOIN dishes ON restaurants_dishes.id_dish = dishes.id
				WHERE dishes.name LIKE ? AND restaurants.verified = 1 AND restaurants_dishes.verified = 1
				GROUP BY res_id, res_name, res_score
				ORDER BY sort_score DESC
			`;
			queryDatabase(sql, [`%${name}%`])
			.then((res) => {
				//console.log(res);
				sock.emit("restaurants", res);
			}).catch((err) => {console.log("DB Error: "+err);});
		}
	});

	//for all users searching restaurant by ingredients:
	sock.on("searchByIngredient", (name) => {
		if(isAlnum(name)){
			let sql = `
				SELECT restaurants.id AS res_id, count(restaurants.id) AS sort_score, restaurants.name AS res_name, restaurants.opinion AS res_score, restaurants.cuisine_type AS res_cusine, 
				GROUP_CONCAT(dishes.name) AS dish_names,
				GROUP_CONCAT(ingredients.name) AS ing_names
				FROM restaurants 
				INNER JOIN restaurants_dishes ON restaurants.id = restaurants_dishes.id_restaurant 
				INNER JOIN dishes ON restaurants_dishes.id_dish = dishes.id
				INNER JOIN ingredients_dishes ON dishes.id = ingredients_dishes.id_dish
				INNER JOIN ingredients ON ingredients_dishes.id_ingredient = ingredients.id
				WHERE ingredients.name LIKE ? AND restaurants.verified = 1 AND restaurants_dishes.verified = 1
				GROUP BY res_id, res_name, res_score
				ORDER BY sort_score DESC
			`;
			queryDatabase(sql, [`%${name}%`])
			.then((res) => {
				sock.emit("restaurants", res);
			}).catch((err) => {console.log("DB Error: "+err);});
		}
	});

	//advanced search:
	sock.on("advancedSearch", (data) => {
		data = JSON.parse(data);
		let res_name = data.res_name;
		let dish_name = data.dish_name;
		let ing_name = data.ing_name;
		let res_x = data.res_x;
		let res_y = data.res_y;
		let res_r = data.res_r;
		let sql_flag = false;
		let where = "";
		let coords = "";
		let having = "";
		let order = "";
		if(res_name && isAlnum(res_name)){
			where += `WHERE restaurants.name LIKE '%${res_name}%'`;
			sql_flag = true;
		}
		if(dish_name && isAlnum(dish_name)){
			if(sql_flag) where += "AND ";
			else where += "WHERE ";
			where += `dishes.name LIKE '%${dish_name}%'`;
			sql_flag = true;
		}
		if(ing_name && isAlnum(ing_name)){
			if(sql_flag) where += "AND ";
			else where += "WHERE ";
			where += `ingredients.name LIKE '%${ing_name}%'`;
			sql_flag = true;
		}
		if(Number(res_x) && Number(res_y) && Number(res_r)){
			if(sql_flag) where += "AND ";
			else where += "WHERE ";
			coords = `(6371 * acos(
						cos(radians(${res_y})) * cos(radians(ST_Y(coordinates))) *
						cos(radians(ST_X(coordinates)) - radians(${res_x})) +
						sin(radians(${res_y})) * sin(radians(ST_Y(coordinates)))
					)) AS distance_km,
				`;
			where +=` ST_Y(coordinates) > 0 AND ST_X(coordinates) > 0`;
			having = `HAVING distance_km <= ${res_r}`
			order += `distance_km, `;
			sql_flag = true;
		}
		if(sql_flag){
			let sql = `
				SELECT restaurants.id AS res_id, count(restaurants.id) AS sort_score, restaurants.name AS res_name, restaurants.opinion AS res_score, 
				restaurants.cuisine_type AS res_cusine, ${coords}
				GROUP_CONCAT(dishes.name) AS dish_names,
				GROUP_CONCAT(ingredients.name) AS ingredient_names
				FROM restaurants
				INNER JOIN restaurants_dishes ON restaurants.id = restaurants_dishes.id_restaurant 
				INNER JOIN dishes ON restaurants_dishes.id_dish = dishes.id
				INNER JOIN ingredients_dishes ON dishes.id = ingredients_dishes.id_dish
				INNER JOIN ingredients ON ingredients_dishes.id_ingredient = ingredients.id
				`+where+` AND restaurants.verified = 1 AND restaurants_dishes.verified = 1
				GROUP BY res_id, res_name, res_score
				${having}
				ORDER BY ${order} sort_score DESC
			`;
			queryDatabase(sql, [])
			.then((res) => {
				sock.emit("restaurants", res);
			}).catch((err) => {console.log("DB Error: "+err);});
		}
	});

	sock.on("getRestaurantInfo", (id) => {
		
	});

	sock.on("getDishesByResId", (id) => {
		console.log(id);
		if(isAlnum(id)){
			let sql = `
				SELECT dishes.id, dishes.name, dishes.calories, dishes.price, dishes.weight,
				GROUP_CONCAT(ingredients.name) AS ingredient_names
				FROM dishes
				INNER JOIN restaurants_dishes ON restaurants_dishes.id_dish = dishes.id
				INNER JOIN ingredients_dishes ON dishes.id = ingredients_dishes.id_dish
				INNER JOIN ingredients ON ingredients_dishes.id_ingredient = ingredients.id
				WHERE restaurants_dishes.id_restaurant = ?
				GROUP BY dishes.id
				ORDER BY dishes.id
			`;
			queryDatabase(sql, [`${id}`])
			.then((res) => {
				sock.emit("dishesList", res);
			}).catch((err) => {console.log("DB Error: "+err);});
		}
	});

	sock.on("getIngredientsByDishId", (id) => {
		if(isAlnum(id)){
			let sql = `
				SELECT ingredients.id, name, vegetarian, vegan
				FROM ingredients
				INNER JOIN ingredients_dishes ON ingredients_dishes.id_ingredient = ingredients.id
				WHERE ingredients_dishes.id_dish = ?
				ORDER BY ingredients.id
			`;
			// ^^^ to add alergens
			queryDatabase(sql, [`${id}`])
			.then((res) => {
				sock.emit("ingredientsList", res);
			}).catch((err) => {console.log("DB Error: "+err);});
		}
	});

	//for auth users:
	sock.on("add_restaurant", (json) => {
		if(translationTab[cid].user_id === -1) return;
	});

	sock.on("add_dish", (json) => {
		if(translationTab[cid].user_id === -1) return;
	});

	sock.on("update_dish", (json) => {
		if(translationTab[cid].user_id === -1) return;
	});

	sock.on("update_location", (json) => {
		if(translationTab[cid].user_id === -1) return;
	});

	sock.on("add_comment", () => {
		if(translationTab[cid].user_id === -1) return;
	});

	//for admins:
	sock.on("verify_restaurant", () => {
		if(translationTab[cid].user_id === -1) return;
	});

	sock.on("verify_dish", () => {
		if(translationTab[cid].user_id === -1) return;
	});

	sock.on("verify_location", () => {
		if(translationTab[cid].user_id === -1) return;
	});

	sock.on("verify_comment", () => {
		if(translationTab[cid].user_id === -1) return;
	});
});

server.listen(PORT, () => {
	console.log("Work");
	console.log(hasher("test"))
});