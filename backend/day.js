const {queryDatabase} = require('./db.js');

const getDay = (id, date) => {
    const formattedDate = formatDate(date); // Formatowanie daty

    let sql = `
        SELECT 
            CASE 
                WHEN JSON_UNQUOTE(JSON_EXTRACT(special, CONCAT('$."', ?, '"'))) = 'closed' THEN 'closed'
                WHEN JSON_UNQUOTE(JSON_EXTRACT(special, CONCAT('$."', ?, '"'))) IS NOT NULL THEN 
                    JSON_UNQUOTE(JSON_EXTRACT(special, CONCAT('$."', ?, '"'))) 
                ELSE
                    CASE 
                        WHEN ? = 'mon' THEN mon
                        WHEN ? = 'tue' THEN tue
                        WHEN ? = 'wed' THEN wed
                        WHEN ? = 'thu' THEN thu
                        WHEN ? = 'fri' THEN fri
                        WHEN ? = 'sat' THEN sat
                        WHEN ? = 'sun' THEN sun
                        ELSE 'Invalid day'
                    END
            END AS hours_of_operation
        FROM 
            hours
        WHERE 
            id_restaurant = ?;
    `;

    // Parametry dla zapytania (wstawiamy datę i dzień)
    let params = [
        formattedDate, formattedDate, formattedDate,
        getDayOfWeek(date), getDayOfWeek(date),
        getDayOfWeek(date), getDayOfWeek(date),
        getDayOfWeek(date), getDayOfWeek(date),
        getDayOfWeek(date), id
    ];

    return queryDatabase(sql, params);
};


const getDayOfWeek = (date) => {
    const day = new Date(date).getDay();
    const daysOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return daysOfWeek[day];
};

const formatDate = (date) => {
    // Jeżeli przekazana wartość to ciąg znaków, zamieniamy go na obiekt Date
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0'); // Miesiące zaczynają się od 0, więc dodajemy 1
    const year = dateObj.getFullYear();
    return `${day}.${month}.${year}`;
};

const getCurrentDate = () => {
    const currentDate = new Date();  // Pobieramy bieżącą datę i godzinę
    const year = currentDate.getFullYear();  // Pobieramy rok
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');  // Pobieramy miesiąc (dodajemy 1, ponieważ miesiące zaczynają się od 0) i formatujemy na 2 cyfry
    const day = currentDate.getDate().toString().padStart(2, '0');  // Pobieramy dzień i formatujemy na 2 cyfry

    return `${year}-${month}-${day}`;  // Łączymy datę w formacie YYYY-MM-DD
};

const getDays = (id, startDate, num = 7) => {
    const result = [];
    let currentDate = new Date(startDate); // Startowa data
    let promises = [];  // Tablica obietnic

    // Pętla po `num` dniach
    for (let i = 0; i < num; i++) {
        const dateStr = currentDate.toISOString().split('T')[0]; // Używamy ISO format dla daty (YYYY-MM-DD)

        // Dodajemy obietnicę do tablicy promises
        promises.push(
            getDay(id, dateStr).then((res) => {
                if (res.length > 0) {
                    result.push({ day: formatDate(dateStr), hours: res[0].hours_of_operation });
                } else {
                    result.push({ day: formatDate(dateStr), hours: 'No data' });
                }
            }).catch((err) => {
                console.error("Błąd podczas pobierania godzin:", err);
                result.push({ day: formatDate(dateStr), hours: 'Error' });
            })
        );

        // Przejście do kolejnego dnia
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Czekamy na zakończenie wszystkich obietnic
    return Promise.all(promises).then(() => result); // Zwracamy wynik po zakończeniu wszystkich zapytań
};

function validateScheduleFormat(json) {
    const timeRegex = /^(\d{2}:\d{2})-(\d{2}:\d{2})$/;
    const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;

    for (const [key, value] of Object.entries(json)) {
        if (!dateRegex.test(key)) {
            return { valid: false, message: `Invalid date format in key: ${key}` };
        }

        if (value !== 'closed' && !timeRegex.test(value)) {
            return { valid: false, message: `Invalid value for ${key}: ${value}` };
        }
    }

    return { valid: true, message: 'Schedule format is valid' };
}

function validateDay(day){
    const timeRegex = /^(\d{2}:\d{2})-(\d{2}:\d{2})$/;
    if(timeRegex.test(day) || day == "closed") return true;
    return false;
}


module.exports = {getDays, getCurrentDate, formatDate, getDayOfWeek, validateScheduleFormat, validateDay};