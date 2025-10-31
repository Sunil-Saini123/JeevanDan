const mongoose=require('mongoose');

// connection for database
function connectToDb(){
    mongoose.connect(process.env.DB_CONNECT).then(console.log("connected to database")).catch((err)=>console.log(err))
}

module.exports=connectToDb;