const app = require('./src/app');
const {config} = require('dotenv');
const {connectToDatabase} = require('./src/config/db');
config();
app.listen(process.env.PORT,()=>{
  console.log(`server is runnig on http://localhost:${process.env.PORT}`);
  connectToDatabase();
})