/* Created by Kammar1006 */

const {queryDatabase} = require('./db.js');

const adminInfo = (sock, type) => {
	let response = [];

    switch(type){
        case "restaurants":{
            let sql  = `
                SELECT restaurants.id AS res_id, restaurants.name AS res_name, restaurants.opinion AS res_score, GROUP_CONCAT(cuisines.type) AS res_cuisines, 
                address AS res_address, restaurants.verified AS res_ver
                FROM restaurants 
                INNER JOIN cuisines_restaurants ON restaurants.id = cuisines_restaurants.id_restaurant
                INNER JOIN cuisines ON cuisines.id = cuisines_restaurants.id_cuisine
                WHERE restaurants.verified = 0 AND restaurants.deleted = 0
                GROUP BY res_id
            `;
            queryDatabase(sql, [])
            .then((res) => {
		        sock.emit("authAdminTables", JSON.stringify(res), type); 
            }).catch((err) => {console.log("DB Error: "+err);});
        }break;
        case "dishes":{
            let sql = `
                SELECT restaurants.id AS res_id, restaurants.name AS res_name, dishes.id AS dish_id, dishes.name AS dish_name,
                restaurants_dishes.verified AS dish_ver
                FROM restaurants
                INNER JOIN restaurants_dishes ON restaurants_dishes.id_restaurant = restaurants.id
                INNER JOIN dishes ON restaurants_dishes.id_dish = dishes.id
                WHERE restaurants_dishes.verified = 0 AND restaurants_dishes.deleted = 0
                ORDER BY res_id
            `;
            queryDatabase(sql, [])
            .then((res) => {
                //console.log(res);
                response = [...res];
                response.forEach((d, i) => {
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
                        //console.log(res);
                        d.ing = res;

                        if(i == response.length - 1){
                            sock.emit("authAdminTables", JSON.stringify(response), type); 
                        }

                    }).catch((err) => {console.log("DB Error: "+err);});
                });
            }).catch((err) => {console.log("DB Error: "+err);});
        }break;
        case "coords":{
            let sql = `
                    SELECT id AS res_id, coordinates AS coords, coordinates_to_verify AS new_coords, verified AS ver, updated_by AS up_by, edited_by AS ed_by
                    FROM coordinates
                    WHERE verified = 0 AND NOT ST_Equals(coordinates_to_verify, POINT(0, 0))
                `;
                queryDatabase(sql, [])
                .then((res) => {
                    sock.emit("authAdminTables", JSON.stringify(res), type); 
                }).catch((err) => {console.log("DB Error: "+err);});
        }break;
        case "comments":{
            let sql = `
                SELECT comments.id AS c_id, restaurants.id AS res_id, restaurants.name AS res_name, score, comment AS 'desc', comments.verified AS ver 
                FROM comments 
                INNER JOIN restaurants_comments ON restaurants_comments.id_comment = comments.id 
                INNER JOIN restaurants ON restaurants_comments.id_restaurant = restaurants.id 
                WHERE comments.verified = 0 AND comments.deleted = 0
                ORDER BY restaurants.id DESC
            `;

            queryDatabase(sql, [])
            .then((res) => {
		        sock.emit("authAdminTables", JSON.stringify(res), type); 
            }).catch((err) => {console.log("DB Error: "+err);});
        }break;
        case "hours":{
            let sql = `
                SELECT *
                FROM hours 
                INNER JOIN restaurants ON restaurants.id = id_restaurant
                WHERE  hours.verified = 0 AND hours.deleted = 0
            `;
            queryDatabase(sql, [])
            .then((res) => {
		        sock.emit("authAdminTables", JSON.stringify(res), type); 
            }).catch((err) => {console.log("DB Error: "+err);});
        }break;
    }
    return response;
}


module.exports = {adminInfo};