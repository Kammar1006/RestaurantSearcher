import json
import mysql.connector
import os

def load_db_config(secrets_file='db_secrets.json'):
    script_dir = os.path.dirname(__file__)
    file_path = os.path.join(script_dir, secrets_file)
    
    with open(file_path, 'r') as file:
        db_config = json.load(file)
    
    return db_config

db_config = load_db_config

def execute_sql_file(filename: str):
    try:

        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()

        script_dir = os.path.dirname(__file__)
        file_path = os.path.join(script_dir, filename)

        with open(file_path, 'r') as file:
            sql_script = file.read()

        for statement in sql_script.split(';'):
            if statement.strip():
                cursor.execute(statement)
                print(f"Executed: {statement.strip()}")

        connection.commit()
        print("SQL script executed successfully!")

    except mysql.connector.Error as err:
        print(f"Error: {err}")

    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None:
            connection.close()


def create_database():
    create_db_script = """
    CREATE DATABASE IF NOT EXISTS restaurant_search_db;
    """
    connection = None
    cursor = None
    try:

        connection = mysql.connector.connect(
            host=db_config["host"],
            user=db_config["user"],
            password=db_config["password"]
        )
        cursor = connection.cursor()
        cursor.execute(create_db_script)
        connection.commit()
        print("Database created successfully!")

    except mysql.connector.Error as err:
        print(f"Error: {err}")

    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None:
            connection.close()


def load_restaurants_from_json(json_file):
    connection = None
    cursor = None
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()
        script_dir = os.path.dirname(os.path.dirname(__file__))
        file_path = os.path.join(script_dir, json_file)

        with open(file_path, 'r') as file:
            data = json.load(file)

        for restaurant in data:
            cursor.execute(
                "INSERT INTO Restaurants (name, opinion, verified, cuisine_type, coordinates, coordinates_to_verify, coordinates_verified) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (restaurant["name"], restaurant["opinion"], restaurant["verified"], restaurant["cuisine_type"], restaurant["coordinates"], restaurant["coordinates_to_verify"], restaurant["coordinates_verified"])
            )

        connection.commit()
        print("Restaurants data loaded successfully!")

    except mysql.connector.Error as err:
        print(f"Error: {err}")
    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None:
            connection.close()


def load_dishes_from_json(json_file):
    connection = None
    cursor = None
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()
        script_dir = os.path.dirname(os.path.dirname(__file__))
        file_path = os.path.join(script_dir, json_file)

        with open(file_path, 'r') as file:
            data = json.load(file)

        for dish in data:
            cursor.execute(
                "INSERT INTO Dishes (name, calories, price, weight) VALUES (%s, %s, %s, %s)",
                (dish["name"], dish["calories"], dish["price"], dish["weight"])
            )

        connection.commit()
        print("Dishes data loaded successfully!")

    except mysql.connector.Error as err:
        print(f"Error: {err}")
    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None:
            connection.close()

if __name__ == "__main__":

    create_database()
    execute_sql_file('tables.sql')
    load_restaurants_from_json('data_generator/output_data/restaurants_table.json')
    load_dishes_from_json('data_generator/output_data/dishes_table.json')
