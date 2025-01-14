# Menufy
Application for searching restaurants and dishes. (Database Project)

## Prerequisites
1. Node.js
2. Xampp or MySQL Server

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
3. **Create file settings.json:**
    ```
    {
        "port": 8005,
        "db_on": true,
        "cookie": "PHPSESSID",
        "db_host": "localhost",
        "db_user": "your_db_user",
        "db_pass": "your_db_password",
        "db_dbname": "your_db_name",
        "db_port": 3306
    }
    ```
4. **Setup Database:**

    Go to: http://127.0.0.1/phpmyadmin/ and import database using setup.sql script.

5. **Run project:**
    ```
    npm start  or  node ./backend/server.js 
    ```

Your APK should now be running locally at ```http://127.0.0.1:8005/test.html```.