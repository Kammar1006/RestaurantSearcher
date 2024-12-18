# Menufy
Application for searching restaurants and dishes. (Database Project)

## Installation
To run this project locally, follow these steps:

1. **Clone the repository**:
    ```
    git clone https://github.com/Kammar1006/RestaurantSearcher.git
     cd RestaurantSearcher
    ```
2. **Install dependencies:**
    ```
    npm i
    ```
3. **Create settings.json files:**
    ```
    "port": 8005,
    "db_on": true,
    "cookie": "PHPSESSID",
    "db_host": "localhost",
    "db_user": "",
    "db_pass": "",
    "db_dbname": "",
    "db_port": 3306
    ```
4. **Setup DB using script: setup.sql:**

5. **Run project:**
    ```
    node start
    ```

Your API should now be running locally at ```http://127.0.0.1:8005```.