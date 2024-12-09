import itertools
import random
import os
import json

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




def generate_coordinates():

    if random.randint(0, 2) == 1: 
        return None
    x = random.uniform(51.051500, 51.181850)
    y = random.uniform(16.924000, 17.160050)

    return f'POINT({x}, {y})'


def generate_restaurants_dishes(num_records: int):

    retstaurant_dishes = []

    for i in range(1, num_records + 1):

        for j in range(random.randint(3, 5)):

            retstaurant_dishes.append({
                "id_dish": random.randint(1, num_records),
                "id_restaurant": i,
                "verified": random.randint(0, 1)
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
    
    for adj, option in all_combinations:

        if len(names) >= num_records:
            break

        name = f"{adj} {option}"
        
        if name not in names:

            names.add(name)
            cuisine = random.choice(cuisine_types)
            address = addresses.pop()
            address = address.split(',')
            address = f"st. {address[0]} {address[1]}, {address[3]}, {address[2]}"
            restaurants.append({
                "name": name,
                "opinion": 0.0,
                "verified": False,
                "cuisine_type": cuisine,
                "address": address,
                "coordinates": generate_coordinates(),
                "coordinates_verified": generate_coordinates(),
                "coordinates_to_verify": generate_coordinates(),
                "coordinates_verified": False
            })

    with open(os.path.join(output_dir, 'restaurants_table.json'), 'w') as file:
        json.dump(restaurants, file, indent=4)


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
    