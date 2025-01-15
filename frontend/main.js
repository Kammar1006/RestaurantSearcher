let ingredients = [];
let allergens = []; 
let currentIngredientIndex = -1;

function addIngredient() {
    const ingredientName = prompt("Enter ingredient name:");
    if (ingredientName) {
        ingredients.push({ name: ingredientName, allergens: [] });
        renderIngredients();
    }
}

function renderIngredients() {
    const ingredientsListDiv = document.getElementById("ingredients-list");
    ingredientsListDiv.innerHTML = "";
    ingredients.forEach((ingredient, index) => {
        const ingredientDiv = document.createElement("div");
        ingredientDiv.classList.add("ingredient");
        ingredientDiv.innerHTML = `
            <span>${ingredient.name}</span>
            <button type="button" onclick="editIngredient(${index})">Edit</button>
        `;
        ingredientsListDiv.appendChild(ingredientDiv);
    });
}

function editIngredient(index) {
    currentIngredientIndex = index;
    const ingredient = ingredients[index];

    const allergensListDiv = document.getElementById("allergens-list");
    allergensListDiv.innerHTML = `<h4>Allergens for ${ingredient.name}</h4>`;

    const allergenInput = document.createElement("input");
    allergenInput.type = "text";
    allergenInput.placeholder = "Enter allergen name";
    allergensListDiv.appendChild(allergenInput);

    const addAllergenButton = document.createElement("button");
    addAllergenButton.innerText = "Add Allergen";
    addAllergenButton.addEventListener("click", () => {
        const allergenName = allergenInput.value.trim();
        if (allergenName) {
            allergens.push({ name: allergenName });
            ingredient.allergens.push(allergenName);
            renderAllergens();
            allergenInput.value = ""; 
        }
    });
    allergensListDiv.appendChild(addAllergenButton);
}

function renderAllergens() {
    const allergensListDiv = document.getElementById("allergens-list");
    allergensListDiv.innerHTML = `<h4>Allergens</h4>`;
    const ingredient = ingredients[currentIngredientIndex];
    ingredient.allergens.forEach((allergen) => {
        const allergenDiv = document.createElement("div");
        allergenDiv.innerHTML = `<span>${allergen}</span>`;
        allergensListDiv.appendChild(allergenDiv);
    });
}

(() => {
    const sock = io();

    //get data from backend
    sock.on("restaurants", (places) => {
        console.log(places); //show in console
        document.getElementById("places_list").innerHTML = "";
        places.forEach(e => document.getElementById("places_list").innerHTML += JSON.stringify(e)+"<br>");
        //document.querySelector("#places_list").innerHTML = JSON.stringify(places);
    });

    sock.on("dishesList", (d) => {
        console.log(d); //show in console
        document.getElementById("menu_list").innerHTML = "";
        document.getElementById("res_info").innerHTML = "";
        document.getElementById("res_comments").innerHTML = "";
        document.getElementById("res_hours").innerHTML = "";
        d.forEach(e => document.getElementById("menu_list").innerHTML += JSON.stringify(e)+"<br>");
    });

    sock.on("restaurantInfo", (d) => {
        console.log(d); //show in console
        document.getElementById("res_info").innerHTML = "";
        d.forEach(e => document.getElementById("res_info").innerHTML += JSON.stringify(e)+"<br>");
    });

    sock.on("restaurantComments", (d) => {
        console.log(d); //show in console
        document.getElementById("res_comments").innerHTML = "";
        d.forEach(e => document.getElementById("res_comments").innerHTML += JSON.stringify(e)+"<br>");
    });

    sock.on("restaurantHours", (d) => {
        console.log(d); //show in console
        document.getElementById("res_hours").innerHTML = "";
        d.forEach(e => document.getElementById("res_hours").innerHTML += JSON.stringify(e)+"<br>");
    });

    sock.on("ingredientsList", (d) => {
        console.log(d); //show in console
        document.getElementById("menu_list").innerHTML = "";
        d.forEach(e => document.getElementById("menu_list").innerHTML += JSON.stringify(e)+"<br>");
    });


    sock.on("login", (m, userPersonalData) => {
        console.log(m, userPersonalData);
        document.getElementById("form_U1_res").innerHTML = m;

        if (m === "Successful login") {
            document.getElementById("auth-section").style.display = "block";

            document.getElementById("form_U1_button").style.display = "none";
            document.getElementById("logout").style.display = "inline-block";

            if (userPersonalData.is_admin) {
                document.getElementById("admin-section").style.display = "block";
            } else {
                document.getElementById("admin-section").style.display = "none";
            }
        }
    });

    sock.on("authUserTables", (tables) => {
        j = JSON.parse(tables);
        document.getElementById("user_restaurants_added").innerHTML = "";
        j.restaurants.forEach(k => document.getElementById("user_restaurants_added").innerHTML += JSON.stringify(k)+"<br>");
        document.getElementById("user_dishes_added").innerHTML = "";
        j.dishes.forEach(k => document.getElementById("user_dishes_added").innerHTML += JSON.stringify(k)+"<br>");
        document.getElementById("user_coords_added").innerHTML = "";
        j.coords.forEach(k => document.getElementById("user_coords_added").innerHTML += JSON.stringify(k)+"<br>");
        document.getElementById("user_comments_added").innerHTML = "";
        j.comments.forEach(k => document.getElementById("user_comments_added").innerHTML += JSON.stringify(k)+"<br>");
    });

    sock.on("authAdminTables", (tables) => {
        j = JSON.parse(tables);
        document.getElementById("admin_restaurants_added").innerHTML = "";
        j.admin_restaurants.forEach(k => document.getElementById("admin_restaurants_added").innerHTML += JSON.stringify(k)+"<br><br>");
        document.getElementById("admin_dishes_added").innerHTML = "";
        j.admin_dishes.forEach(k => document.getElementById("admin_dishes_added").innerHTML += JSON.stringify(k)+"<br><br>");
        document.getElementById("admin_coords_added").innerHTML = "";
        j.admin_coords.forEach(k => document.getElementById("admin_coords_added").innerHTML += JSON.stringify(k)+"<br><br>");
        document.getElementById("admin_comments_added").innerHTML = "";
        j.admin_comments.forEach(k => document.getElementById("admin_comments_added").innerHTML += JSON.stringify(k)+"<br><br>");
    });

    sock.on("register", (e) => {
        console.log(e);
        document.getElementById("form_U2_res").innerHTML = e;
    });

    sock.on("set-cookie", (cookie) => {
        document.cookie = cookie;  // Set Cookie in client-site
        console.log("Cookie", cookie);
    });

    sock.on("message", (t) => {
        console.log("message: ", t);
    });

    sock.emit("get_cuisines");

    sock.on("comment", (t) => {
        document.getElementById("form_U6_res").innerHTML = t;

    })

    sock.on("cuisinesList", (data) => {
        let cuisinesList = JSON.parse(data);
        
        let selectElement = document.querySelector("#form_U3_cuisines");
        selectElement.innerHTML = '';

        cuisinesList.forEach(cuisine => {
            let option = document.createElement("option");
            option.value = cuisine.type;
            option.textContent = cuisine.type;
            selectElement.appendChild(option);
        });
    });

    document.getElementById("logout").addEventListener("click", () => {

        document.getElementById("auth-section").style.display = "none";
        document.getElementById("admin-section").style.display = "none";

        document.getElementById("form_U1_res").innerHTML = "You have been logged out.";

        sock.emit("logout");
        location.reload(true);
    });

    document.getElementById("add-ingredient-btn").addEventListener("click", addIngredient);

    document.getElementById("form_U4").addEventListener("submit", (e) => {
        e.preventDefault();

        const dish = {
            id: document.getElementById("form_U4_id").value,
            name: document.getElementById("form_U4_name").value,
            calories: document.getElementById("form_U4_calories").value,
            weight: document.getElementById("form_U4_weight").value,
            price: document.getElementById("form_U4_price").value,
            vegan: document.getElementById("form_U4_vegan").checked,
            vegetarian: document.getElementById("form_U4_vegetarian").checked,
            ingredients: ingredients,
        };

        console.log(dish);

        sock.emit("addDish", JSON.stringify(dish), (response) => {
            alert(response.message);
        });
    });

    sock.on("verify_comment", (data) => {
        document.getElementById("form_A4_res").innerHTML = data;
    });

    sock.on("verify_location", (data) => {
        document.getElementById("form_A3_res").innerHTML = data;
    });

    sock.on("verify_dish", (data) => {
        document.getElementById("form_A2_res").innerHTML = data;
    });

    sock.on("verify_restaurant", (data) => {
        document.getElementById("form_A1_res").innerHTML = data;
    });

    document
        .querySelector("#your_cords")
        .addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                document.querySelector("#form_SA_res_x").value = latitude;
                document.querySelector("#form_SA_res_y").value = longitude;
            }, (error) => {
                console.error("Error getting location", error);
                alert("Unable to retrieve your location. Please try again.");
            });
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    });

    document
        .querySelector("#form_SA_button")
        .addEventListener('click', (e) => {
            let data = {
                res_name: document.querySelector("#form_SA_res_name").value,
                dish_name: document.querySelector("#form_SA_dish_name").value,
                ing_name: document.querySelector("#form_SA_ing_name").value,
                res_x: document.querySelector("#form_SA_res_x").value,
                res_y: document.querySelector("#form_SA_res_y").value,
                res_r: document.querySelector("#form_SA_res_r").value,
                now_open: document.querySelector("#form_SA_open").checked,
            }
            sock.emit("advancedSearch", JSON.stringify(data));
        });

    //send info to backend - form 2 - login
    document
        .querySelector("#form_U1_button")
        .addEventListener('click', (e) => {
            let login = document.querySelector("#form_U1_login").value;
            let pass = document.querySelector("#form_U1_pass").value;
            sock.emit("login", login, pass);
        });

    //send info to backend - form 3 - register
    document
        .querySelector("#form_U2_button")
        .addEventListener('click', (e) => {
            let login = document.querySelector("#form_U2_login").value;
            let pass = document.querySelector("#form_U2_pass").value;
            let pass2 = document.querySelector("#form_U2_pass2").value;
            let email = document.querySelector("#form_U2_email").value;
            sock.emit("register", login, pass, pass2, email);
        });

    document
        .querySelector("#form_RI_button")
        .addEventListener('click', (e) => {
            sock.emit("getDishesByResId", document.querySelector("#form_RI_id").value);
            sock.emit("getRestaurantInfo", document.querySelector("#form_RI_id").value);
            sock.emit("getComments", document.querySelector("#form_RI_id").value);
            sock.emit("getHours", document.querySelector("#form_RI_id").value);
        });

    document
        .querySelector("#form_U3_button")
        .addEventListener('click', (e) => {
            console.log("click")
            let name = document.querySelector("#form_U3_name").value;
            let address = document.querySelector("#form_U3_address").value;

            let cuisines = Array.from(
                document.querySelector("#form_U3_cuisines").selectedOptions
            ).map(option => option.value); 

            let restaurantData = {
                name: name,
                address: address,
                cuisines: cuisines
            };

            console.log(restaurantData)

            sock.emit("add_restaurant", JSON.stringify(restaurantData));
        });

    document
        .querySelector("#form_U5_button")
        .addEventListener('click', (e) => {
            console.log("click")
            let id = document.querySelector("#form_U5_id").value;
            let coord_x = document.querySelector("#form_U5_coord_x").value;
            let coord_y = document.querySelector("#form_U5_coord_y").value;

            let json = {
                id: id,
                coord_x: coord_x,
                coord_y: coord_y
            }

            sock.emit("update_location", JSON.stringify(json));
        });

    document
        .querySelector("#form_U6")
        .addEventListener("submit", (e) => {
            console.log("click")
            e.preventDefault();
            let id = document.querySelector("#form_U6_id").value;
            let score = document.querySelector("#form_U6_score").value;
            let desc = document.querySelector("#form_U6_desc").value;

            let json = {
                id: id,
                score: score,
                desc: desc
            }

            sock.emit("add_comment", JSON.stringify(json));
        });

    document
        .querySelector("#form_DI_button")
        .addEventListener('click', (e) => {
            sock.emit("getIngredientsByDishId", document.querySelector("#form_DI_id").value);
        });

    document
        .querySelector("#clicker")
        .addEventListener("click", (e) => {
            sock.emit("counter");
        });
    document
        .querySelector("#form_A1_button_DEL")
        .addEventListener("click", (e) => {
            sock.emit("verify_restaurant", JSON.stringify({
                id: document.getElementById("form_A1_id").value,
                action: "DEL"
            }));
        });
    document
        .querySelector("#form_A1_button_VER")
        .addEventListener("click", (e) => {
            sock.emit("verify_restaurant", JSON.stringify({
                id: document.getElementById("form_A1_id").value,
                action: "VER"
            }));
        });
    document
        .querySelector("#form_A2_button_DEL")
        .addEventListener("click", (e) => {
            sock.emit("verify_dish", JSON.stringify({
                id_res: document.getElementById("form_A2_id").value,
                id_dish: document.getElementById("form_A2_id_dish").value,
                action: "DEL"
            }));
        });
    document
        .querySelector("#form_A2_button_VER")
        .addEventListener("click", (e) => {
            sock.emit("verify_dish", JSON.stringify({
                id_res: document.getElementById("form_A2_id").value,
                id_dish: document.getElementById("form_A2_id_dish").value,
                action: "VER"
            }));
        });
    document
        .querySelector("#form_A3_button_DEL")
        .addEventListener("click", (e) => {
            sock.emit("verify_location", JSON.stringify({
                id: document.getElementById("form_A3_id").value,
                action: "DEL"
            }));
        });
    document
        .querySelector("#form_A3_button_VER")
        .addEventListener("click", (e) => {
            sock.emit("verify_location", JSON.stringify({
                id: document.getElementById("form_A3_id").value,
                action: "VER"
            }));
        });
    document
        .querySelector("#form_A4_button_DEL")
        .addEventListener("click", (e) => {
            sock.emit("verify_comment", JSON.stringify({
                id: document.getElementById("form_A4_id").value,
                action: "DEL"
            }));
        });
    document
        .querySelector("#form_A4_button_VER")
        .addEventListener("click", (e) => {
            sock.emit("verify_comment", JSON.stringify({
                id: document.getElementById("form_A4_id").value,
                action: "VER"
            }));
        });
})();

//not reload site when click form
/*document
    .querySelector("#form_S1")
    .addEventListener('submit', (e) => {
        e.preventDefault();
    });*/
/*document
    .querySelector("#form_S2")
    .addEventListener('submit', (e) => {
        e.preventDefault();
    });*/
/*document
    .querySelector("#form_S3")
    .addEventListener('submit', (e) => {
        e.preventDefault();
    });*/
/*document
    .querySelector("#form_S4")
    .addEventListener('submit', (e) => {
        e.preventDefault();
    });*/
document
    .querySelector("#form_SA")
    .addEventListener('submit', (e) => {
        e.preventDefault();
    });
document
    .querySelector("#form_U1")
    .addEventListener('submit', (e) => {
        e.preventDefault();
    });
document
    .querySelector("#form_U2")
    .addEventListener('submit', (e) => {
        e.preventDefault();
    });

document
    .querySelector("#form_U3")
    .addEventListener('submit', (e) => {
        e.preventDefault();
    });
document
    .querySelector("#form_U4")
    .addEventListener('submit', (e) => {
        e.preventDefault();
    });
document
    .querySelector("#form_U5")
    .addEventListener('submit', (e) => {
        e.preventDefault();
    });
document
    .querySelector("#form_U6")
    .addEventListener('submit', (e) => {
        e.preventDefault();
    });
document
    .querySelector("#form_RI")
    .addEventListener('submit', (e) => {
        e.preventDefault();
    });
document
    .querySelector("#form_DI")
    .addEventListener('submit', (e) => {
        e.preventDefault();
    });
document
    .querySelector("#form_A1")
    .addEventListener('submit', (e) => {
        e.preventDefault();
    });
document
    .querySelector("#form_A2")
    .addEventListener('submit', (e) => {
        e.preventDefault();
    });
document
    .querySelector("#form_A3")
    .addEventListener('submit', (e) => {
        e.preventDefault();
    });
document
    .querySelector("#form_A4")
    .addEventListener('submit', (e) => {
        e.preventDefault();
    });