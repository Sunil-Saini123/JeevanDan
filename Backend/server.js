const http=require('http');
const app=require('./app');

//initialize port
const port=process.env.PORT || 3000;

//create server
const server=http.createServer(app);

//run the server
server.listen(port,()=>{
    console.log(`server is running on port ${port}`);
})