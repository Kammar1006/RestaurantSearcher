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
	let json = {
		restaurants: [],
		dishes: [],
		coords: [],
		comments: []
	};

	let sql  = `
		SELECT restaurants.id AS res_id, restaurants.name AS res_name, restaurants.opinion AS res_score, GROUP_CONCAT(cuisines.type) AS res_cuisines, 
		address AS res_address, restaurants.verified AS res_ver
		FROM restaurants 
		INNER JOIN cuisines_restaurants ON restaurants.id = cuisines_restaurants.id_restaurant
		INNER JOIN cuisines ON cuisines.id = cuisines_restaurants.id_cuisine
		WHERE restaurants.updated_by = ?
		GROUP BY res_id
	`;
	queryDatabase(sql, [emit_db_stats.id])
	.then((res) => {
		console.log(res);
		json.restaurants = res;

		let sql = `
			SELECT restaurants.id AS res_id, restaurants.name AS res_name, score, comment AS 'desc', comments.verified AS ver 
			FROM comments 
			INNER JOIN restaurants_comments ON restaurants_comments.id_comment = comments.id 
			INNER JOIN restaurants ON restaurants_comments.id_restaurant = restaurants.id 
			WHERE comments.updated_by = 3 
			ORDER BY restaurants.id DESC
		`;

		queryDatabase(sql, [emit_db_stats.id])
		.then((res) => {
			console.log(res);
			json.comments = res;

			//to add dishes & coords
			let sql = `
				SELECT restaurants.id AS res_id, restaurants.name AS res_name, dishes.id AS dish_id, dishes.name AS dish_name,
				restaurants_dishes.verified AS dish_ver
				FROM restaurants
				INNER JOIN restaurants_dishes ON restaurants_dishes.id_restaurant = restaurants.id
				INNER JOIN dishes ON restaurants_dishes.id_dish = dishes.id
				WHERE restaurants_dishes.updated_by = ?
			`;
			queryDatabase(sql, [emit_db_stats.id])
			.then((res) => {
				console.log(res);
				json.dishes = [...res];
				json.dishes.forEach((d, i) => {
					//d.ing = [];
					let sql = `
						SELECT ingredients.id AS ing_id, ingredients.name AS ing_name, 
						GROUP_CONCAT(DISTINCT allergens.name) AS allergens_names
						FROM ingredients_dishes
						INNER JOIN ingredients ON ingredients_dishes.id_ingredient = ingredients.id
						INNER JOIN allergens_ingredients ON allergens_ingredients.id_ingredient = ingredients.id
						INNER JOIN allergens ON allergens_ingredients.id_allergen = allergens.id
						WHERE ingredients_dishes.id_dish = ? AND allergens.id > 0
						GROUP BY ing_id
					`;

					queryDatabase(sql, [d.dish_id])
					.then((res) => {
						console.log(res);
						d.ing = res;

						if(i == json.dishes.length - 1){
							sock.emit("login", emit_db_stats, JSON.stringify(json)); 
						}
					}).catch((err) => {console.log("DB Error: "+err);});
				});
			}).catch((err) => {console.log("DB Error: "+err);});
		}).catch((err) => {console.log("DB Error: "+err);});
	}).catch((err) => {console.log("DB Error: "+err);});
}

io.on('connection', (sock) => {
	let cid = setCID(sock);
	if(!cid){
		cid = randomBytes(30).toString('hex');
		sock.emit("set-cookie", `${COOKIE_FLAG}=${cid}; Path=/; SameSite=None; Secure`);
	}
	setTranslationTab(cid);
	console.log("User: "+cid);
	if(translationTab[cid].user_id !== -1)
		emit_login_data(sock, translationTab[cid].db_stats);

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
			let sql = `
				SELECT restaurants.id AS res_id, restaurants.name AS res_name, restaurants.opinion AS res_score, GROUP_CONCAT(cuisines.type) AS res_cuisines, 
				address AS res_address 
				FROM restaurants 
				INNER JOIN cuisines_restaurants ON restaurants.id = cuisines_restaurants.id_restaurant
				INNER JOIN cuisines ON cuisines.id = cuisines_restaurants.id_cuisine
				WHERE name LIKE ? AND restaurants.verified = 1
				GROUP BY res_id
			`;
			queryDatabase(sql, [`%${name}%`])
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
				SELECT restaurants.id AS res_id, restaurants.name AS res_name, restaurants.opinion AS res_score,
					GROUP_CONCAT(DISTINCT cuisines.type) AS res_cuisines, address AS res_address,
					(6371 * acos(
						cos(radians(?)) * cos(radians(ST_Y(coordinates))) *
						cos(radians(ST_X(coordinates)) - radians(?)) +
						sin(radians(?)) * sin(radians(ST_Y(coordinates)))
					)) AS distance_km
				FROM restaurants
				INNER JOIN cuisines_restaurants ON restaurants.id = cuisines_restaurants.id_restaurant
				INNER JOIN cuisines ON cuisines.id = cuisines_restaurants.id_cuisine
				WHERE ST_Y(coordinates) > 0 AND ST_X(coordinates) > 0
				GROUP BY res_id
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
				SELECT restaurants.id AS res_id, count(restaurants.id) AS sort_score, restaurants.name AS res_name, restaurants.opinion AS res_score, 
				GROUP_CONCAT(DISTINCT cuisines.type) AS res_cuisines, GROUP_CONCAT(DISTINCT dishes.name) AS dish_names
				FROM restaurants 
				INNER JOIN restaurants_dishes ON restaurants.id = restaurants_dishes.id_restaurant 
				INNER JOIN dishes ON restaurants_dishes.id_dish = dishes.id
				INNER JOIN cuisines_restaurants ON restaurants.id = cuisines_restaurants.id_restaurant
				INNER JOIN cuisines ON cuisines.id = cuisines_restaurants.id_cuisine
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
				SELECT restaurants.id AS res_id, count(restaurants.id) AS sort_score, restaurants.name AS res_name, restaurants.opinion AS res_score, 
				GROUP_CONCAT(DISTINCT  cuisines.type) AS res_cuisines, 
				GROUP_CONCAT(DISTINCT dishes.name) AS dish_names,
				GROUP_CONCAT(DISTINCT ingredients.name) AS ing_names
				FROM restaurants 
				INNER JOIN restaurants_dishes ON restaurants.id = restaurants_dishes.id_restaurant 
				INNER JOIN dishes ON restaurants_dishes.id_dish = dishes.id
				INNER JOIN ingredients_dishes ON dishes.id = ingredients_dishes.id_dish
				INNER JOIN ingredients ON ingredients_dishes.id_ingredient = ingredients.id
				INNER JOIN cuisines_restaurants ON restaurants.id = cuisines_restaurants.id_restaurant
				INNER JOIN cuisines ON cuisines.id = cuisines_restaurants.id_cuisine
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
				GROUP_CONCAT(DISTINCT  cuisines.type) AS res_cuisines, ${coords}
				GROUP_CONCAT(DISTINCT dishes.name) AS dish_names,
				GROUP_CONCAT(DISTINCT ingredients.name) AS ingredient_names
				FROM restaurants
				INNER JOIN restaurants_dishes ON restaurants.id = restaurants_dishes.id_restaurant 
				INNER JOIN dishes ON restaurants_dishes.id_dish = dishes.id
				INNER JOIN ingredients_dishes ON dishes.id = ingredients_dishes.id_dish
				INNER JOIN ingredients ON ingredients_dishes.id_ingredient = ingredients.id
				INNER JOIN cuisines_restaurants ON restaurants.id = cuisines_restaurants.id_restaurant
				INNER JOIN cuisines ON cuisines.id = cuisines_restaurants.id_cuisine
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
		if(isAlnum(id)){
			let sql = `
				SELECT name, opinion, coordinates, address, GROUP_CONCAT(cuisines.type) AS res_cuisines, client.username AS up_by, admin.username AS ver_by
				FROM restaurants
				INNER JOIN cuisines_restaurants ON restaurants.id = cuisines_restaurants.id_restaurant
				INNER JOIN cuisines ON cuisines.id = cuisines_restaurants.id_cuisine
				LEFT JOIN users AS client ON client.id = restaurants.updated_by
				LEFT JOIN users AS admin ON admin.id = restaurants.verified_by
				WHERE restaurants.id = ?
			`;
			queryDatabase(sql, [`${id}`])
			.then((res) => {
				//console.log(res);
				sock.emit("restaurantInfo", res);
			}).catch((err) => {console.log("DB Error: "+err);});
		}
	});

	sock.on("getComments", (id) => {

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
		json = JSON.parse(json);
		let name = json.name;
		let address = json.address;
		let cuisines = json.cuisines;
		console.log("test");
		if(isAlnum(name) == false || isAlnum(address.replaceAll(',', '')) == false) return;
		console.log("test");
		let up_by = translationTab[cid].user_id;
	
		let sql = `
			INSERT INTO restaurants (id, name, opinion, verified, coordinates, coordinates_to_verify, coordinates_verified, address, updated_by, verified_by) 
			VALUES (NULL, ?, '', '0', POINT(0, 0), POINT(0, 0), 0, ?, ?, '')
		`;
		
		queryDatabase(sql, [name, address, up_by])
		.then((res) => {
			let restaurantId = res.insertId;
			console.log(restaurantId);
			cuisines.forEach(cuisine => {
				let sqlCuisine = `SELECT id FROM cuisines WHERE type = ?`;
				queryDatabase(sqlCuisine, [cuisine])
				.then(cuisineRes => {
					let cuisineId = cuisineRes.length > 0 ? cuisineRes[0].id : null;
	
					if (cuisineId) {
						let sqlInsertCuisineLink = `INSERT INTO cuisines_restaurants (id_restaurant, id_cuisine) VALUES (?, ?)`;
						queryDatabase(sqlInsertCuisineLink, [restaurantId, cuisineId]);
					}
				}).catch(err => {
					console.log("DB Error: " + err);
				});
			});
	
			sock.emit("restaurantAdded", json);
		}).catch((err) => {
			console.log("DB Error: " + err);
		});
	});

	sock.on("get_cuisines", () => {
		let sql = "SELECT type FROM cuisines";
		
		queryDatabase(sql)
		.then((res) => {
			sock.emit("cuisinesList", JSON.stringify(res));
		})
		.catch((err) => {
			console.log("DB Error: " + err);
		});
	});

	const isValidPrice = (price) => price > 0;
	const isValidCalorie = (calories) => calories > 0;
	const isValidWeight = (weight) => weight > 0;

	async function addIngredientAndAllergen(name, allergenNames = []) {
		let ingredientId;
		
		let ingredientInsertSql = `INSERT INTO ingredients (name) VALUES (?)`;
		let insertResult = await queryDatabase(ingredientInsertSql, [name]);
		ingredientId = insertResult.insertId;

		for (let allergenName of allergenNames) {
			let allergenId;
			let allergenCheckSql = `SELECT id FROM allergens WHERE name = ?`;
			let allergenResult = await queryDatabase(allergenCheckSql, [allergenName]);

			if (allergenResult.length === 0) {
				let allergenInsertSql = `INSERT INTO allergens (name) VALUES (?)`;
				let allergenInsertResult = await queryDatabase(allergenInsertSql, [allergenName]);
				allergenId = allergenInsertResult.insertId;
			} else {
				allergenId = allergenResult[0].id;
			}

			let allergenLinkSql = `INSERT INTO allergens_ingredients (id_ingredient, id_allergen) VALUES (?, ?)`;
			await queryDatabase(allergenLinkSql, [ingredientId, allergenId]);
		}

		return ingredientId;
	}

	sock.on("addDish", async (json) => {
		if(translationTab[cid].user_id === -1) return;
		let dishData = JSON.parse(json);
		let { name, calories, weight, price, vegan, vegetarian, ingredients, id } = dishData;

		if (!isAlnum(name.replaceAll(' ', ''))) return sock.emit("dishAdded", { message: "Invalid dish name." });
		if (!isValidPrice(price)) return sock.emit("dishAdded", { message: "Invalid price." });
		if (!isValidCalorie(calories)) return sock.emit("dishAdded", { message: "Invalid calories." });
		if (!isValidWeight(weight)) return sock.emit("dishAdded", { message: "Invalid weight." });

		let restaurantCheckSql = `SELECT id FROM restaurants WHERE id = ?`;
		let restaurantResult = await queryDatabase(restaurantCheckSql, [id]);
		if (restaurantResult.length === 0) {
			return sock.emit("dishAdded", { message: "Restaurant does not exist." });
		}

		try {
			let dishSql = `INSERT INTO dishes (name, calories, weight, price, vegan, vegetarian) 
						VALUES (?, ?, ?, ?, ?, ?)`;
			let dishResult = await queryDatabase(dishSql, [name, calories, weight, price, vegan, vegetarian]);
			let dishId = dishResult.insertId;

			let restaurantDishSql = `INSERT INTO restaurants_dishes (id_restaurant, id_dish, updated_by) VALUES (?, ?, ?)`;
			await queryDatabase(restaurantDishSql, [id, dishId, translationTab[cid].user_id]);

			for (let ingredient of ingredients) {
				let { name: ingredientName, allergens } = ingredient;

				let ingredientId = await addIngredientAndAllergen(ingredientName, allergens);
				
				let ingredientDishSql = `INSERT INTO ingredients_dishes (id_dish, id_ingredient) VALUES (?, ?)`;
				await queryDatabase(ingredientDishSql, [dishId, ingredientId]);
			}

			sock.emit("dishAdded", { message: "Dish added successfully!" });
		} catch (err) {
			console.error("DB Error: ", err);
			sock.emit("dishAdded", { message: "An error occurred while adding the dish." });
		}
	});

	sock.on("update_location", (json) => {
		if(translationTab[cid].user_id === -1) return;
		json = JSON.parse(json);
		let res_id = json.id;
		let coordinates = {x: json.coord_x, y: json.coord_y};
		let up_by = translationTab[cid].user_id;
		//search if res exist
		let sql = `SELECT * FROM restaurants WHERE id = ?`;
		queryDatabase(sql, [res_id])
		.then((res) => {
			console.log(res);
			if(res.length == 1){
				//update
				console.log(coordinates);
				if(!(Number(coordinates.x) && Number(coordinates.y))){
					coordinates.x = 0;
					coordinates.y = 0;
				}
				console.log(coordinates);
				sql = `UPDATE restaurants SET coordinates_to_verify = POINT(${coordinates.x}, ${coordinates.y}), coordinates_verified = 0, updated_by = ? WHERE id = ?`;
				queryDatabase(sql, [up_by, res_id])
				.then((res) => {
					console.log(res);
				})
				.catch((err) => {
					console.log("DB Error: " + err);
				});
			}
		}).catch((err) => {console.log("DB Error: "+err);});
		
	});

	sock.on("add_comment", (json) => {
		if(translationTab[cid].user_id === -1) return;
		//search if user make a comment in that restaurnt
		//search if res exist
		//if not:
		json = JSON.parse(json);
		let res_id = json.id;
		let score = json.score;
		let desc = json.desc;
		let created_by = translationTab[cid].user_id;
		console.log("HI");
		if(!Number(res_id)) return;
		if(score < 0 || score > 5) return;
		if(!isAlnum(desc)) return;
		console.log("HI");
		let sql = `SELECT * FROM restaurants WHERE id = ?`;
		queryDatabase(sql, [res_id])
		.then((res) => {
			console.log(res);
			if(res.length == 1){
				sql = `
					SELECT id FROM comments
					INNER JOIN restaurants_comments ON restaurants_comments.id_comment = comments.id
					WHERE restaurants_comments.id_restaurant = ?
				`;
				queryDatabase(sql, [res_id])
				.then((res2) => {
					if(res2.length == 1){
						//comment exist
						sql = `
							UPDATE comments SET
							comment = ?,
							score = ${score},
							verified = 0,
							updated_by = ${created_by}
							WHERE id = ${res2[0].id}
						`;
						queryDatabase(sql, [`${desc}`])
						.then((res) => {
							sock.emit("comment", "edited");
						})
						.catch((err) => {console.log("DB Error: "+err);});
					}
					else{
						//comment not exist
						sql = `
							INSERT INTO comments (comment, score, verified, updated_by)
							VALUES (?, ${score}, 0, ${created_by})
						`;
						queryDatabase(sql, [`${desc}`])
						.then((res) => {
							sql = `
								INSERT INTO restaurants_comments (id_restaurant, id_comment)
								VALUES (?, ?)
							`;
							queryDatabase(sql, [res_id, res.insertId])



							sock.emit("comment", "added");
						})
						.catch((err) => {console.log("DB Error: "+err);});
					}
				})
				.catch((err) => {console.log("DB Error: "+err);});
			}
		})
		.catch((err) => {console.log("DB Error: "+err);});
	});

	//for admins:
	sock.on("verify_restaurant", (json) => {
		if(translationTab[cid].user_id === -1) return;
		if(translationTab[cid].db_stats,is_admin !== 1) return;
		json = JSON.parse(json);
		let res_id = json.res_id;
		let action = json.action; //delete or confirm
		//search if res exist & is ver
	});

	sock.on("verify_dish", (json) => {
		if(translationTab[cid].user_id === -1) return;
		if(translationTab[cid].db_stats,is_admin !== 1) return;
		json = JSON.parse(json);
	});

	sock.on("verify_location", (json) => {
		if(translationTab[cid].user_id === -1) return;
		if(translationTab[cid].db_stats,is_admin !== 1) return;
		json = JSON.parse(json);
	});

	sock.on("verify_comment", (json) => {
		if(translationTab[cid].user_id === -1) return;
		if(translationTab[cid].db_stats,is_admin !== 1) return;
		json = JSON.parse(json);
	});
});

server.listen(PORT, () => {
	console.log("Work");
	console.log(hasher("test"))
});