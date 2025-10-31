const express=require('express');
const app=express();
const dotenv=require('dotenv');
dotenv.config();
const connectToDb=require('./db/db')
const donorRoutes=require('./routes/donor.routes')
const cors = require("cors");

//database connection
connectToDb();

// Middleware
app.use(cors());
app.use(express.json()); // parse JSON bodies
app.use(express.urlencoded({ extended: true })); // parse URL-encoded bodies


app.get('/',(req,res)=>{
    res.send('hello sunil');
})

app.use('/donor',donorRoutes);


module.exports=app;