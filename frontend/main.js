let ingredients = [];
let allergens = [];
let currentIngredientIndex = -1;

let isAuth = 0;
let isAdmin = 0;

const switchPages = (type) => {
    switch(type){
        case "search": {
            document.getElementById("search-section").style.display = "block";
            document.getElementById("login-section").style.display = "none";
            document.getElementById("auth-section").style.display = "none";
            document.getElementById("admin-section").style.display = "none";
        }break;
        case "login": {
            document.getElementById("search-section").style.display = "none";
            document.getElementById("login-section").style.display = "block";
            document.getElementById("auth-section").style.display = "none";
            document.getElementById("admin-section").style.display = "none";
        }break;
        case "auth": {
            if(!isAuth) return;
            document.getElementById("search-section").style.display = "none";
            document.getElementById("login-section").style.display = "none";
            document.getElementById("auth-section").style.display = "block";
            document.getElementById("admin-section").style.display = "none";
        }break;
        case "admin": {
            if(!isAuth) return;
            if(!isAdmin) return;
            document.getElementById("search-section").style.display = "none";
            document.getElementById("login-section").style.display = "none";
            document.getElementById("auth-section").style.display = "none";
            document.getElementById("admin-section").style.display = "block";
        }break;
    }
}

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
        console.log(places); // Wyświetlenie w konsoli
        const placesList = document.getElementById("places_list");
        placesList.innerHTML = ""; // Wyczyszczenie listy

        places.forEach(e => {
            const restaurantDiv = document.createElement("div");
            restaurantDiv.className = "restaurant-item";

            restaurantDiv.innerHTML = `
            <h3>${e.res_name}</h3>
            `;

            // Dodanie obsługi kliknięcia
            restaurantDiv.addEventListener("click", () => {
                sock.emit("getDishesByResId", e.res_id);
                sock.emit("getHours", e.res_id);
                sock.emit("getRestaurantInfo", e.res_id);
                sock.emit("getComments", e.res_id);
            });

            placesList.appendChild(restaurantDiv);
        });
    });

    sock.on("dishesList", (d) => {
        console.log(d);

        const menuList = document.getElementById("menu_list");
        menuList.innerHTML = ""; // Czyść listę przed renderowaniem

        d.forEach(e => {
            const dishItem = document.createElement("div");
            dishItem.classList.add("dish-item");

            const dishName = document.createElement("h3");
            dishName.textContent = e.name || "Nieznana nazwa";

            const dishDetails = document.createElement("p");
            dishDetails.innerHTML = `
            <strong>Ingredients:</strong> ${e.ingredient_names || "No data"}<br>
            <strong>Calories:</strong> ${e.calories || "No data"} kcal<br>
            <strong>Weight:</strong> ${e.weight || "No datah"} g<br>
            <strong>Price:</strong> ${e.price ? `${e.price.toFixed(2)} zł` : "No data"}
        `;

            // Dodanie obsługi kliknięcia
            dishItem.addEventListener("click", () => {
                sock.emit("getIngredientsByDishId", e.id);
            });

            // Dodawanie elementów do struktury
            dishItem.appendChild(dishName);
            dishItem.appendChild(dishDetails);

            // Dodawanie kafelka do listy
            menuList.appendChild(dishItem);
        });
    });

    sock.on("restaurantInfo", (d) => {
        console.log(d); // show in console
        const resInfoContainer = document.getElementById("res_info");
        resInfoContainer.innerHTML = ""; // Clear previous content

        d.forEach(e => {
            // Create a card for each restaurant object
            const resDiv = document.createElement("div");
            resDiv.className = "restaurant-card";

            // Fill the card with restaurant information
            resDiv.innerHTML = `
                <h3 class="restaurant-name">${e.name}</h3>
                <p class="restaurant-detail"><strong>Opinion:</strong> ${e.opinion}</p>
                <p class="restaurant-detail"><strong>Address:</strong> ${e.address}</p>
                <p class="restaurant-detail"><strong>Cuisines:</strong> ${e.res_cuisines}</p>
            `;

            // Add card to container
            resInfoContainer.appendChild(resDiv);
        });
    });

    sock.on("restaurantComments", (d) => {
        console.log(d); // Pokaż dane w konsoli
        const commentsContainer = document.getElementById("res_comments");
        commentsContainer.innerHTML = ""; // Wyczyść poprzednie dane

        d.forEach(e => {
            // Stwórz element dla każdego komentarza
            const commentElement = document.createElement("div");
            commentElement.style.marginBottom = "10px";
            commentElement.style.padding = "10px";
            commentElement.style.border = "1px solid #ccc";
            commentElement.style.borderRadius = "5px";
            commentElement.style.backgroundColor = "#f9f9f9";

            commentElement.innerHTML = `
            <strong>Comment:</strong> ${e.comment}<br>
            <strong>By:</strong> ${e.up_by}<br>
            <strong>Score:</strong> ${e.score}<br>
            <strong>ID:</strong> ${e.id}
        `;
            commentsContainer.appendChild(commentElement);
        });
    });

    sock.on("update_hours", (m) => {
        document.getElementById("form_hours_res").innerHTML = m;
    });

    sock.on("verify_hours", (m) => {
        document.getElementById("form_hours_ver_res").innerHTML = m;
    });

    sock.on("restaurantHours", (d) => {
        console.log(d); // show in console

        // Pobierz element, w którym będą wyświetlane godziny otwarcia
        const resHoursElement = document.getElementById("res_hours");

        // Wyczyść poprzednią zawartość
        resHoursElement.innerHTML = "";

        // Stwórz nagłówki tabeli
        let tableHTML = `

    <table class="hours-table">
        <thead>
            <tr>
                <th>Day</th>
                <th>Hours</th>
            </tr>
        </thead>
        <tbody>
    `;

        // Dodaj dane jako wiersze tabeli
        d.forEach(e => {
            tableHTML += `
        <tr>
            <td>${e.day}</td>
            <td>${e.hours}</td>
        </tr>
        `;
        });

        // Zakończ tabelę
        tableHTML += `
        </tbody>
    </table>
    `;

        // Dodaj tabelę do elementu
        resHoursElement.innerHTML = tableHTML;
    });


    sock.on("ingredientsList", (d) => {
        console.log(d); // Show in console
        const ingredientsListElement = document.getElementById("ingredients_list");
        ingredientsListElement.innerHTML = ""; // Clear the list

        d.forEach(e => {
            // Create a formatted HTML structure for each ingredient
            const ingredientDiv = document.createElement("div");
            ingredientDiv.style.marginBottom = "10px"; // Add some spacing
            ingredientDiv.style.borderBottom = "1px solid #ddd"; // Optional: A divider between items
            ingredientDiv.style.padding = "5px 0";

            ingredientDiv.innerHTML = `
            <strong>Name:</strong> ${e.name}<br>
            <strong>Vegetarian:</strong> ${e.vegetarian ? "Yes" : "No"}<br>
            <strong>Vegan:</strong> ${e.vegan ? "Yes" : "No"}<br>
            <strong>Allergens:</strong> ${e.allergens_list}
        `;
            ingredientsListElement.appendChild(ingredientDiv);
        });
    });


    sock.on("login", (m, userPersonalData) => {
        console.log(m, userPersonalData);
        document.getElementById("form_U1_res").innerHTML = m;

        if (m === "Successful login") {
            //document.getElementById("auth-section").style.display = "block";

            isAuth = 1;

            document.getElementById("form_U1_button").style.display = "none";
            document.getElementById("logout").style.display = "inline-block";

            if (userPersonalData.is_admin) {
                isAdmin = 1;
                //document.getElementById("admin-section").style.display = "block";
            } else {
                document.getElementById("admin-section").style.display = "none";
            }
        }
    });

    sock.on("authUserTables", (tables, type) => {
        const j = JSON.parse(tables);

        const formatData = (elementId, data, formatter) => {
            const element = document.getElementById(elementId);
            element.innerHTML = ""; // Czyścimy poprzednie dane
            data.forEach(item => {
                const li = document.createElement("li");
                li.innerHTML = formatter(item);
                element.appendChild(li);
            });
        };

        switch(type){
            case "restaurants":{
                formatData("user_restaurants_added", j, (restaurant) => `
                    <div class="title">${restaurant.res_name} (${restaurant.res_id})</div>
                    <div class="content">Cuisines: ${restaurant.res_cuisines}<br>
                    Address: ${restaurant.res_address}<br>
                    Verified: ${restaurant.res_ver}</div>
                `);
            }break;
            case "dishes":{
                formatData("user_dishes_added", j, (dish) => `
                    <div class="title">${dish.dish_name} (${dish.dish_id})</div>
                    <div class="content">Restaurant: ${dish.res_name} (${dish.res_id})<br>
                    Ingredients: ${dish.ing.map(ing => `${ing.ing_name} (Allergens: ${ing.allergens_names})`).join(", ") || "None"}<br>
                    Verified: ${dish.dish_ver}</div>
                `);
            }break;
            case "coords":{
                formatData("user_coords_added", j, (coord) => `
                    <div class="title">Restaurant ID: ${coord.res_id}</div>
                    <div class="content">Old Coords: (${coord.coords.x}, ${coord.coords.y})<br>
                    New Coords: (${coord.new_coords.x}, ${coord.new_coords.y})<br>
                    Verified: ${coord.ver}</div>
                `);
            }break;
            case "comments":{
                formatData("user_comments_added", j, (comment) => `
                    <div class="title">${comment.res_name} (${comment.res_id})</div>
                    <div class="content">Score: ${comment.score}<br>
                    Comment: ${comment.desc}<br>
                    Verified: ${comment.ver}</div>
                `); 
            }break;
            case "hours":{
                console.log(j)
                formatData("user_hours_added", j, (hour) => `
                    <div class="title">${hour.name} (${hour.id_restaurant})</div>
                    <div class="content">
                        Mon: ${hour.mon}<br>
                        Tue: ${hour.tue}<br>
                        Wed: ${hour.wed}
                        Thu: ${hour.thu}
                        Fri: ${hour.fri}
                        Sat: ${hour.sat}
                        Sun: ${hour.sun}
                    </div>
                `);
            }break;
        }
    });

    sock.on("authAdminTables", (tables, type) => {
        const data = JSON.parse(tables);

        switch(type){
            case "restaurants":{
                // Restaurants
                const restaurantContainer = document.getElementById("admin_restaurants_added");
                restaurantContainer.innerHTML = "";
                data.forEach((restaurant) => {
                    const item = document.createElement("div");
                    item.className = "data-item";
                    item.innerHTML = `
                    <h4>${restaurant.res_name}</h4>
                    <p><strong>ID:</strong> ${restaurant.res_id}</p>
                    <p><strong>Score:</strong> ${restaurant.res_score}</p>
                    <p><strong>Cuisines:</strong> ${restaurant.res_cuisines}</p>
                    <p><strong>Address:</strong> ${restaurant.res_address}</p>
                `;
                    restaurantContainer.appendChild(item);
                });
            }break;
            case "dishes":{
                // Dishes
                const dishesContainer = document.getElementById("admin_dishes_added");
                dishesContainer.innerHTML = "";
                data.forEach((dish) => {
                    const item = document.createElement("div");
                    item.className = "data-item";
                    const ingredients = dish.ing.map(
                        (i) => `<li>${i.ing_name} (Allergens: ${i.allergens_names || "None"})</li>`
                    ).join("");
                    item.innerHTML = `
                    <h4>${dish.dish_name}</h4>
                    <p><strong>Dish ID:</strong> ${dish.dish_id}</p>
                    <p><strong>Restaurant:</strong> ${dish.res_name}</p>
                    <ul>${ingredients}</ul>
                `;
                    dishesContainer.appendChild(item);
                });
            }break;
            case "coords":{
                // Coordinates
                const coordsContainer = document.getElementById("admin_coords_added");
                coordsContainer.innerHTML = "";
                data.forEach((coord) => {
                    const item = document.createElement("div");
                    item.className = "data-item";
                    item.innerHTML = `
                    <h4>Restaurant ID: ${coord.res_id}</h4>
                    <p><strong>Original Coords:</strong> (${coord.coords.x}, ${coord.coords.y})</p>
                    <p><strong>New Coords:</strong> (${coord.new_coords.x}, ${coord.new_coords.y})</p>
                    <p><strong>Updated By:</strong> ${coord.up_by}</p>
                    <p><strong>Edited By:</strong> ${coord.ed_by}</p>
                `;
                    coordsContainer.appendChild(item);
                });
            }break;
            case "comments":{
                // Comments
                const commentsContainer = document.getElementById("admin_comments_added");
                commentsContainer.innerHTML = "";
                data.forEach((comment) => {
                    const item = document.createElement("div");
                    item.className = "data-item";
                    item.innerHTML = `
                    <h4>Restaurant: ${comment.res_name}</h4>
                    <p><strong>Restaurant ID:</strong> ${comment.res_id}</p>
                    <p><strong>Score:</strong> ${comment.score}</p>
                    <p><strong>Comment:</strong> ${comment.desc}</p>
                `;
                    commentsContainer.appendChild(item);
                });
            }break;
            case "hours": {
                const hoursContainer = document.getElementById("admin_hours_added");
                hoursContainer.innerHTML = "";
                data.forEach((hour) => {
                    const item = document.createElement("div");
                    item.className = "data-item";

                    let specialContent = "";
                    try {
                        const specialHours = JSON.parse(hour.special);

                        specialContent = "<div class='special-hours'>";
                        for (const [date, time] of Object.entries(specialHours)) {
                            specialContent += `
                    <p><strong>${date}:</strong> ${time}</p>
                `;
                        }
                        specialContent += "</div>";
                    } catch (e) {
                        specialContent = "<p>No special hours</p>";
                    }

                    item.innerHTML = `
            <h4>Restaurant: ${hour.name} (${hour.id_restaurant})</h4>
            <p><strong>Mon:</strong> ${hour.mon}</p>
            <p><strong>Tue:</strong> ${hour.tue}</p>
            <p><strong>Wed:</strong> ${hour.wed}</p>
            <p><strong>Thu:</strong> ${hour.thu}</p>
            <p><strong>Fri:</strong> ${hour.fri}</p>
            <p><strong>Sat:</strong> ${hour.sat}</p>
            <p><strong>Sun:</strong> ${hour.sun}</p>
            ${specialContent}
        `;
                    hoursContainer.appendChild(item);
                });
            } break;
        }
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

    sock.on("restaurantAdded", (t) => {
        document.getElementById("form_U3_res").innerHTML = t;
    })

    sock.on("dishAdded", (t) => {
        document.getElementById("form_U4_res").innerHTML = t.message;
    })

    sock.on("locationUpdated", (t) => {
        document.getElementById("form_U5_res").innerHTML = t.message;
    })

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
                vegetarian: document.querySelector("#form_SA_v1").checked,
                vegan: document.querySelector("#form_SA_v2").checked,
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
    document
        .querySelector("#user_info_1")
        .addEventListener("click", (e) => {
            sock.emit("user_info", "restaurants");
        });
    document
        .querySelector("#user_info_2")
        .addEventListener("click", (e) => {
            sock.emit("user_info", "dishes");
        });
    document
        .querySelector("#user_info_3")
        .addEventListener("click", (e) => {
            sock.emit("user_info", "coords");
        });
    document
        .querySelector("#user_info_4")
        .addEventListener("click", (e) => {
            sock.emit("user_info", "comments");
        });
    document
        .querySelector("#user_info_5")
        .addEventListener("click", (e) => {
            sock.emit("user_info", "hours");
        });
    document
        .querySelector("#admin_info_1")
        .addEventListener("click", (e) => {
            sock.emit("admin_info", "restaurants");
        });
    document
        .querySelector("#admin_info_2")
        .addEventListener("click", (e) => {
            sock.emit("admin_info", "dishes");
        });
    document
        .querySelector("#admin_info_3")
        .addEventListener("click", (e) => {
            sock.emit("admin_info", "coords");
        });
    document
        .querySelector("#admin_info_4")
        .addEventListener("click", (e) => {
            sock.emit("admin_info", "comments");
        });
    document
        .querySelector("#admin_info_5")
        .addEventListener("click", (e) => {
            sock.emit("admin_info", "hours");
        });
    document
        .querySelector("#form_hours")
        .addEventListener("submit", (e) => {
            e.preventDefault();

            let special = {};
            document.querySelectorAll(".form_exception_date").forEach((dateInput, i) => {
                const date = dateInput.value;
                const hours = document.querySelectorAll(".form_exception_hours")[i].value;
                if (date && hours) {
                    special[date] = `${hours}`;
                }
            });

            console.log(special);

            let json = {
                res_id: document.querySelector("#form_hours_id").value,
                mon: document.querySelector("#form_hours_mon").value,
                tue: document.querySelector("#form_hours_tue").value,
                wed: document.querySelector("#form_hours_wed").value,
                thu: document.querySelector("#form_hours_thu").value,
                fri: document.querySelector("#form_hours_fri").value,
                sat: document.querySelector("#form_hours_sat").value,
                sun: document.querySelector("#form_hours_sun").value,
                special: special,
            };

            sock.emit("update_hours", JSON.stringify(json));
        });
    document
        .querySelector("#form_hours_ver_DEL")
        .addEventListener("click", (e) => {
            sock.emit("verify_hours", JSON.stringify({
                id: document.getElementById("form_hours_ver_id").value,
                action: "DEL"
            }));
        });
    document
        .querySelector("#form_hours_ver_VER")
        .addEventListener("click", (e) => {
            sock.emit("verify_hours", JSON.stringify({
                id: document.getElementById("form_hours_ver_id").value,
                action: "VER"
            }));
        });
})();
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
/*document
    .querySelector("#form_RI")
    .addEventListener('submit', (e) => {
        e.preventDefault();
    });
document
    .querySelector("#form_DI")
    .addEventListener('submit', (e) => {
        e.preventDefault();
    });*/
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

document
    .querySelector("#form_hours_ver")
    .addEventListener('submit', (e) => {
        e.preventDefault();
    });

document
    .getElementById("form_exception_button")
    .addEventListener("click", (e) => {
    e.preventDefault();
    const exceptionFieldsContainer = document.getElementById("form_hours");

    // Tworzymy nowy zestaw pól
    const newFields = document.createElement("div");
    newFields.innerHTML = `
        <p>
            <span> Date (DD.MM.YYYY) </span>
            <br>
            <input class="form_exception_date" type="text" placeholder="DD.MM.YYYY" />
        </p>
        <p>
            <span> Hours or Status </span>
            <br>
            <input class="form_exception_hours" type="text" placeholder="closed or hours" />
        </p>
    `;

    // Dodajemy nowe pola do kontenera
    exceptionFieldsContainer.appendChild(newFields);
});