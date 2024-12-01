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

output_dir = os.path.join(parent_dir, 'output_data')
if not os.path.exists(output_dir):
    os.makedirs(output_dir)


def read_lines_from_file(file_path):

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"No such file or directory: '{file_path}'")
    
    with open(file_path, 'r') as file:
        return [line.strip() for line in file.readlines()]


def restaurant_generator(num_records: int):

    names = set()
    all_combinations = list(itertools.product(restaurant_adjectives, restaurant_options))
    random.shuffle(all_combinations)
    restaurants = []
    
    for adj, option in all_combinations:

        if len(names) >= num_records:
            break

        name = f"{adj} {option}"
        
        if name not in names:

            names.add(name)
            cuisine = random.choice(cuisine_types)
            restaurants.append({
                "name": name,
                "opinion": 0.0,
                "verified": False,
                "cuisine_type": cuisine,
                "coordinates": None,
                "coordinates_to_verify": None,
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

restaurant_adjectives = read_lines_from_file(adjectives_file_path)
restaurant_options = read_lines_from_file(options_file_path)
cuisine_types = read_lines_from_file(cuisine_file_path)
dishes_adjectives = read_lines_from_file(dishes_adjectives_file_path)
dishes_names = read_lines_from_file(dishes_names_file_path)


if __name__ == "__main__":

    num_records = 100
    restaurant_generator(num_records)
    dishes_generator(num_records)
    