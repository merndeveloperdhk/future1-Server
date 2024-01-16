const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000 ;

//Middleware
app.use(express.json())
app.use(cookieParser()) 
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true 
}));

const logger = async(req, res, next) => {
  console.log('called', req.hostname, req.originalUrl);
  next()
}
const verifyToken = async(req, res, next) => {
  const token = req.cookies?.token;
  if(!token){
    return res.status(401).send({message: 'UnAuthorized'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
    //error
    if(err){
      return res.status(401).send({message: 'Not Authorized'})
    }
    req.user = decoded;
    next()
  })
}

// Practice1
// PracticeOnline1

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://Practice1:PracticeOnline1@cluster0.olby26b.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db("carDoctor").collection("Services");
    const bookingCollection = client.db("carDoctor").collection("bookings");
    const addProductsCollection = client.db("carDoctor").collection("addProducts");
    const categoriesCollection = client.db("carDoctor").collection("categories");

    // Auth related api
    app.post('/jwt', logger, async(req, res)=> {
      const body = req.body;
      console.log(body);
      const token = jwt.sign(body, process.env.ACCESS_TOKEN_SECRET , {expiresIn: '58h'});
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7)
      res.cookie("token", token,{
        httpOnly: true,
        secure: false,
        expires: expirationDate
        // sameSite:'none'
      })
      .send({success: true, token})
    })

    app.get('/products',logger, verifyToken, async(req, res)=>{
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })

    app.get('/products/:id', logger, async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const options = {
       
        // Include only the `title` and `imdb` fields in the returned document
        projection: {  title: 1,  price:1, service_id:1, img:1 },
      };
      const result = await serviceCollection.findOne(query, options);
      res.send(result)
    })

    // booking collection
    app.get('/bookings',logger, verifyToken, async(req, res)=>{
      console.log(req.query.email);
      console.log(('user in the valid token', req.user));
      let query = {};
      if(req.query?.email){
        query = {email: req.query.email}
       
      };
      const result = await bookingCollection.find(query).toArray();
      res.send(result)
    })

    app.post('/bookings', async(req, res)=>{
      const bookings = req.body;
     const result = await bookingCollection.insertOne(bookings);
     res.send(result)

    })

    app.patch('/bookings/:id', async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updatedBooking = req.body;
      // console.log(updatedBooking);
      const updatedDocs = {
        $set:{
          status:updatedBooking.status
        }
      }
      const result = await bookingCollection.updateOne(filter, updatedDocs);
      res.send(result)

    })

    app.delete('/bookings/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await bookingCollection.deleteOne(query);
      res.send(result)
    })
    //Add products
    app.put('/addProducts/:id', async(req, res)=>{
      const updateProduct = req.body;
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedProduct = {
        $set:{
          ...updateProduct,
        }
      };
      const option = {upsert:true}
      const result = await addProductsCollection.updateOne(filter, updatedProduct, option);
      res.send(result)
    })

     app.get('/addProducts/:id', verifyToken, async(req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await addProductsCollection.findOne(query)
      console.log(result);
      res.send(result)
    }) 
    app.get('/addProducts', verifyToken, async(req, res)=>{
      const cursor = addProductsCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })
    app.post('/addProducts', async(req, res)=>{
      const addNew = req.body;
      const result = await addProductsCollection.insertOne(addNew);
      res.send(result)
    })
    app.delete('/addProducts/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id:new ObjectId(id)};
      const result = await addProductsCollection.deleteOne(query);
      res.send(result)
    })
    // category
     app.get('/categories', verifyToken,  async(req, res)=>{
      
      const cursor = categoriesCollection.find().sort({"category": 1});
      const result = await cursor.toArray();
      res.send(result)
    })
    app.post('/categories', async(req, res)=> {
      const addNew = req.body;
      const result = await categoriesCollection.insertOne(addNew);
      res.send(result)
    })
    app.delete('/categories/:id', verifyToken, async(req, res)=> {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await categoriesCollection.deleteOne(query);
      res.send(result)
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res)=>{
    res.send("My Server is Running ")
})

app.listen(port, ()=>{
    console.log(`My Server is running on port: ${port}`);
})