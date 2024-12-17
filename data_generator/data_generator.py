import itertools
import random
import os
import json
import datetime

parent_dir = os.path.dirname(os.path.abspath(__file__))

adjectives_file_path = os.path.join(parent_dir, 'input_data', 'restaurant_adjectives.csv')
options_file_path = os.path.join(parent_dir, 'input_data', 'restaurant_options.csv')
cuisine_file_path = os.path.join(parent_dir, 'input_data', 'cuisine_types.csv')
dishes_adjectives_file_path = os.path.join(parent_dir, 'input_data', 'dishes_adjectives.csv')
dishes_names_file_path = os.path.join(parent_dir, 'input_data', 'dishes_names.csv')
ingredients_file_path = os.path.join(parent_dir, 'input_data', 'ingredients.csv')
allergens_file_path = os.path.join(parent_dir, 'input_data', 'allergens.csv')
addresses_file_path = os.path.join(parent_dir, 'input_data', 'addresses.csv')

output_dir = os.path.join(parent_dir, 'output_data')
if not os.path.exists(output_dir):
    os.makedirs(output_dir)


def read_lines_from_file(file_path):

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"No such file or directory: '{file_path}'")
    
    with open(file_path, 'r') as file:
        return [line.strip() for line in file.readlines()]


def generate_coordinates(include_zero: bool):

    if random.randint(0, 2) == 1 and include_zero: 
        return f'POINT({0}, {0})'
    x = random.uniform(51.051500, 51.181850)
    y = random.uniform(16.924000, 17.160050)

    return f'POINT({x}, {y})'


def generate_restaurants_dishes(num_records: int):

    retstaurant_dishes = []

    for i in range(1, num_records + 1):

        for j in range(random.randint(3, 5)):

            verified = random.randint(0, 1)
            retstaurant_dishes.append({
                "id_dish": random.randint(1, num_records),
                "id_restaurant": i,
                "verified": verified,
                "updated_by": random.randint(1,10),
                "verified_by": None if verified == 0 else random.randint(1,5)
            })

    with open(os.path.join(output_dir, 'retstaurant_dishes_table.json'), 'w') as file:
        json.dump(retstaurant_dishes, file, indent=4)


def generate_ingredient_dish(num_records: int):

    ingredient_dish = []

    for i in range(1, num_records + 1):

        for j in range(random.randint(2, 5)):

            ingredient_dish.append({
                "id_ingredient": random.randint(1, num_records),
                "id_dish": i,
            })
    with open(os.path.join(output_dir, 'retstaurant_dishes_table.json'), 'w') as file:
        json.dump(ingredient_dish, file, indent=4)


def restaurant_generator(num_records: int):

    names = set()
    all_combinations = list(itertools.product(restaurant_adjectives, restaurant_options))
    random.shuffle(all_combinations)
    random.shuffle(addresses)
    restaurants = []
    
    
    for i, (adj, option) in enumerate(all_combinations):

        verified = random.randint(0, 1)
        if len(names) >= num_records or len(addresses) == 0:
            break

        name = f"{adj} {option}"
        
        if name not in names:

            names.add(name)
            address = addresses.pop()
            address = address.split(',')
            address = f"st. {address[0]} {address[1]}, {address[3]}, {address[2]}"
            restaurants.append({
                "name": name,
                "opinion": 0.0,
                "verified": verified,
                "address": address,
                "updated_by": random.randint(1,10),
                "verified_by": None if verified == 0 else random.randint(1,5)
            })

    with open(os.path.join(output_dir, 'restaurants_table.json'), 'w') as file:
        json.dump(restaurants, file, indent=4)


def generate_coords_table(num_records):
                
    coords = []
    
    for i in range(num_records):
        
        verified = random.randint(0, 1)
        coords.append({
            "verified": verified,
            "coordinates": generate_coordinates(True),
            "coordinates_to_verify": generate_coordinates(False),
            "coordinates_verified": generate_coordinates(False),
            "updated_by": random.randint(1,10),
            "verified_by": None if verified == 0 else random.randint(1,5)
        })

    with open(os.path.join(output_dir, 'coords_table.json'), 'w') as file:
        json.dump(coords, file, indent=4)
    
def dishes_generator(num_records: int):

    names = set()
    all_combinations = list(itertools.product(dishes_adjectives, dishes_names))
    random.shuffle(all_combinations)
    dishes = []
    
    for adj, name in all_combinations:
        if len(names) >= num_records:
            break

        dish_name = f"{adj} {name}"

        if dish_name not in names:

            names.add(dish_name)
            calories = random.randint(300, 2000)
            price = round(random.uniform(25, 70), 2)
            weight = round(calories / 5, 2)
            dishes.append({"name": dish_name, "calories": calories, "price": price, "weight": weight})

    with open(os.path.join(output_dir, 'dishes_table.json'), 'w') as file:
        json.dump(dishes, file, indent=4)


def generate_ingredients_table(num_records):
    names = set()
    ingredients = []

    for _ in range(num_records):
        name = random.choice(ingredient_names)

        if name not in names:

            names.add(name)
            vegetarian = random.randint(0, 1)
            vegan = vegetarian and random.randint(0, 1)
            
            ingredients.append({
                "name": name,
                "vegetarian": vegetarian,
                "vegan": vegan
            })

    with open(os.path.join(output_dir, 'ingredients_table.json'), 'w') as file:
        json.dump(ingredients, file, indent=4)


def generate_allergens_table(num_records):
    names = set()
    allergens = []

    while len(allergens) < num_records:
        name = random.choice(allergens_names)

        if name not in names:

            names.add(name)
            allergens.append({"name": name})

    with open(os.path.join(output_dir, 'allergens_table.json'), 'w') as file:
        json.dump(allergens, file, indent=4)


def generate_allergens_ingredients_table(num_records):
    allergens_ingredients = []
    unique_pairs = set()

    while len(allergens_ingredients) < num_records:
        allergen_id = random.randint(1, num_records)
        ingredient_id = random.randint(1, num_records)
        pair = (allergen_id, ingredient_id)

        if pair not in unique_pairs:
            unique_pairs.add(pair)
            allergens_ingredients.append({
                "id_allergen": allergen_id,
                "id_ingredient": ingredient_id
            })

    with open(os.path.join(output_dir, 'allergens_ingredients_table.json'), 'w') as file:
        json.dump(allergens_ingredients, file, indent=4)


def generate_ingredients_dishes_table(num_records):

    ingredient_dish = []

    for dish_id in range(1, num_records + 1):
        num_ingredients_for_dish = random.randint(3, 6)
        for _ in range(num_ingredients_for_dish):
            ingredient_dish.append({
                "id_ingredient": random.randint(1, num_records),
                "id_dish": dish_id,
            })

    with open(os.path.join(output_dir, 'ingredient_dishes_table.json'), 'w') as file:
        json.dump(ingredient_dish, file, indent=4)


def generate_cuisine_table(num_records):

    names = set()
    cuisines = []

    while len(cuisines) < num_records:
        name = random.choice(cuisine_types)

        if name not in names:

            names.add(name)
            cuisines.append({"type": name})

    with open(os.path.join(output_dir, 'cuisine_table.json'), 'w') as file:
        json.dump(cuisines, file, indent=4)


def generate_cuisines_restaurants_table(num_records):

    cuisines_restaurant = []

    for restaurant_id in range(1, num_records + 1):
        num_cuisines = random.randint(1, 3)

        for _ in range(num_cuisines):

            cuisines_restaurant.append({
                "id_restaurant": restaurant_id,
                "id_cuisine": random.randint(1, num_records),
            })

    with open(os.path.join(output_dir, 'cuisines_restaurant.json'), 'w') as file:
        json.dump(cuisines_restaurant, file, indent=4)


def generate_hours_table(num_records: int):
    days_of_week = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    hours_table = []

    for _ in range(num_records):
        hours = {day: f"{random.randint(6, 10):02d}:{0:02d}-{random.randint(17, 23):02d}:{0:02d}" for day in days_of_week}
        
        special_days = {}
        for _ in range(random.randint(4, 5)):
            special_date = (datetime.datetime.now() + datetime.timedelta(days=random.randint(1, 365))).strftime("%d.%m.%Y")
            if random.choice([True, False]):
                special_days[special_date] = "closed"
            else:
                special_days[special_date] = f"{random.randint(6, 10):02d}:{0:02d}-{random.randint(13, 16):02d}:{0:02d}"
        
        hours_table.append({
            "mon": hours["mon"],
            "tue": hours["tue"],
            "wed": hours["wed"],
            "thu": hours["thu"],
            "fri": hours["fri"],
            "sat": hours["sat"],
            "sun": hours["sun"],
            "special": special_days
        })

    with open(os.path.join(output_dir, 'hours_table.json'), 'w') as file:
        json.dump(hours_table, file, indent=4)


restaurant_adjectives = read_lines_from_file(adjectives_file_path)
restaurant_options = read_lines_from_file(options_file_path)
cuisine_types = read_lines_from_file(cuisine_file_path)
dishes_adjectives = read_lines_from_file(dishes_adjectives_file_path)
dishes_names = read_lines_from_file(dishes_names_file_path)
ingredient_names = read_lines_from_file(ingredients_file_path)
allergens_names = read_lines_from_file(allergens_file_path)
addresses = read_lines_from_file(addresses_file_path)


if __name__ == "__main__":

    num_records = 100
    restaurant_generator(num_records)
    dishes_generator(num_records)
    generate_restaurants_dishes(num_records)
    generate_ingredients_table(num_records)
    generate_allergens_table(num_records)
    generate_allergens_ingredients_table(num_records)
    generate_ingredients_dishes_table(num_records)
    generate_cuisine_table(num_records)
    generate_cuisines_restaurants_table(num_records)
    generate_hours_table(num_records)
    generate_coords_table(num_records)
    