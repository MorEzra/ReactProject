const mysql = require("mysql2");

// Connection = קו תקשורת למסד הנתונים
const connection = mysql.createConnection({
    host: "localhost", // Computer
    user: "root", // Username
    password: "1234", // Password
    database: "Vacations", // Database name
    multipleStatements: true
});

// Connect to the database: 
connection.connect(error => {
    if (error) {
        console.log("Failed to create connection + " + error);
        return;
    }
    console.log("We're connected to MySQL");
});


// One function for executing select / insert / update / delete: 
function execute(sql) {
    return new Promise((resolve, reject) => {
        connection.query(sql, (err, result) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(result);
        });
    });
}

function executeWithParameters(sql, parameters) {
    return new Promise((resolve, reject) => {
        connection.query(sql, parameters, (err, result) => {
            if (err) {
                console.log("Failed interacting with DB, calling reject");
                reject(err);
                return;
            }
            resolve(result);
        });
    });
}

module.exports = {
    execute,
    executeWithParameters
};