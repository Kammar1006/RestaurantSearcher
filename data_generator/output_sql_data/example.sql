SELECT 
	restaurants.id AS res_id, 
	count(restaurants.id) AS sort_score, 
	restaurants.name AS res_name, 
	restaurants.opinion AS res_score,
	GROUP_CONCAT(DISTINCT  cuisines.type) AS res_cuisines,
 	(6371 * acos(
		cos(radians(17)) * cos(radians(ST_Y(coordinates))) *
		cos(radians(ST_X(coordinates)) - radians(51)) +
		sin(radians(17)) * sin(radians(ST_Y(coordinates)))
	)) AS distance_km,
 	CASE
  		WHEN JSON_UNQUOTE(JSON_EXTRACT(special, '$."06.01.2025"')) = 'closed' THEN 'closed'
		WHEN JSON_UNQUOTE(JSON_EXTRACT(special, '$."06.01.2025"')) IS NOT NULL THEN
			JSON_UNQUOTE(JSON_EXTRACT(special, '$."06.01.2025"'))
		ELSE
			CASE
					WHEN 'mon' = 'mon' THEN mon
					WHEN 'mon' = 'tue' THEN tue
					WHEN 'mon' = 'wed' THEN wed
					WHEN 'mon' = 'thu' THEN thu
					WHEN 'mon' = 'fri' THEN fri
					WHEN 'mon' = 'sat' THEN sat
					WHEN 'mon' = 'sun' THEN sun
					ELSE 'closed'
			END
	END AS hours,
	GROUP_CONCAT(DISTINCT dishes.name) AS dish_names,
	GROUP_CONCAT(DISTINCT ingredients.name) AS ingredient_names
FROM restaurants
INNER JOIN restaurants_dishes ON restaurants.id = restaurants_dishes.id_restaurant
INNER JOIN hours ON hours.id = restaurants.id
INNER JOIN coordinates ON restaurants.id = coordinates.id
INNER JOIN dishes ON restaurants_dishes.id_dish = dishes.id
INNER JOIN ingredients_dishes ON dishes.id = ingredients_dishes.id_dish
INNER JOIN ingredients ON ingredients_dishes.id_ingredient = ingredients.id
INNER JOIN cuisines_restaurants ON restaurants.id = cuisines_restaurants.id_restaurant
INNER JOIN cuisines ON cuisines.id = cuisines_restaurants.id_cuisine
WHERE \
	restaurants.name LIKE '%a%'
	AND dishes.name LIKE '%b%'
	AND ingredients.name LIKE '%c%'
	AND  ST_Y(coordinates) > 0
	AND ST_X(coordinates) > 0
	AND NOT ST_Equals(coordinates, POINT(0, 0))
	AND restaurants.verified = 1
	AND restaurants_dishes.verified = 1
GROUP BY
	res_id,
	res_name,
	res_score
HAVING
	distance_km <= 200
	AND STR_TO_DATE(SUBSTRING_INDEX(hours, '-', 1), '%H:%i') <= CURTIME()
	AND STR_TO_DATE(SUBSTRING_INDEX(hours, '-', -1), '%H:%i') >= CURTIME()
ORDER BY 
	distance_km,
        sort_score DESC