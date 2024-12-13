import mysql from "mysql2";


const connection = mysql.createConnection({
    host: 'localhost',     
    user: 'root',          
    password: 'Kunal@2024', // Your MySQL password proccess.env.pass
    database: 'internship_test', 
})



export { connection }