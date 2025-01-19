/* Created by Kammar1006 */

const {queryDatabase} = require('./db.js');

const userInfo = (sock, uid, type) => {
	let response = [];

    switch(type){
        case "restaurants":{
            let sql  = `
                SELECT restaurants.id AS res_id, restaurants.name AS res_name, restaurants.opinion AS res_score, GROUP_CONCAT(cuisines.type) AS res_cuisines, 
                address AS res_address, restaurants.verified AS res_ver
                FROM restaurants 
                INNER JOIN cuisines_restaurants ON restaurants.id = cuisines_restaurants.id_restaurant
                INNER JOIN cuisines ON cuisines.id = cuisines_restaurants.id_cuisine
                WHERE restaurants.updated_by = ?
                GROUP BY res_id
            `;
            queryDatabase(sql, [uid])
            .then((res) => {
                sock.emit("authUserTables", JSON.stringify(res), type); 
            }).catch((err) => {console.log("DB Error: "+err);});
        }break;
        case "dishes":{
            let sql = `
                SELECT restaurants.id AS res_id, restaurants.name AS res_name, dishes.id AS dish_id, dishes.name AS dish_name,
                restaurants_dishes.verified AS dish_ver
                FROM restaurants
                INNER JOIN restaurants_dishes ON restaurants_dishes.id_restaurant = restaurants.id
                INNER JOIN dishes ON restaurants_dishes.id_dish = dishes.id
                WHERE restaurants_dishes.updated_by = ?
            `;
            queryDatabase(sql, [uid])
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
                            sock.emit("authUserTables", JSON.stringify(response), type); 
                        }

                    }).catch((err) => {console.log("DB Error: "+err);});
                });
            }).catch((err) => {console.log("DB Error: "+err);});
        }break;
        case "coords":{
            let sql = `
                SELECT id AS res_id, coordinates AS coords, coordinates_to_verify AS new_coords, verified AS ver
                FROM coordinates 
                WHERE edited_by = ? AND NOT ST_Equals(coordinates_to_verify, POINT(0, 0))
            `;
            queryDatabase(sql, [uid])
            .then((res) => {
                sock.emit("authUserTables", JSON.stringify(res), type); 
            }).catch((err) => {console.log("DB Error: "+err);});
        }break;
        case "comments":{
            let sql = `
                SELECT restaurants.id AS res_id, restaurants.name AS res_name, score, comment AS 'desc', comments.verified AS ver 
                FROM comments 
                INNER JOIN restaurants_comments ON restaurants_comments.id_comment = comments.id 
                INNER JOIN restaurants ON restaurants_comments.id_restaurant = restaurants.id 
                WHERE comments.updated_by = 3 
                ORDER BY restaurants.id DESC
            `;
            queryDatabase(sql, [uid])
            .then((res) => {
                sock.emit("authUserTables", JSON.stringify(res), type); 
            }).catch((err) => {console.log("DB Error: "+err);});
        }break;
        case "hours":{
            let sql = `SELECT * FROM hours WHERE updated_by = ? AND deleted = 0`;
            queryDatabase(sql, [uid])
            .then((res) => {
                sock.emit("authUserTables", JSON.stringify(res), type); 
            }).catch((err) => {console.log("DB Error: "+err);});
        }break;
    }
}


module.exports = {userInfo};