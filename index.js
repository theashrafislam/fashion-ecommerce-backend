const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion } = require('mongodb');
const bcrypt = require('bcrypt');

app.use(cors());
app.use(express.json())


const uri = `mongodb+srv://${process.env.MONGODB_USER_KEY}:${process.env.MONGODB_PASS_KEY}@cluster0.gphdl2n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

        const userCollection = client.db('fashionEra').collection('users');

        // save register user informations
        app.post('/sign-up-user-info', async (req, res) => {
            const { name, email, image, password } = req.body;
            try {
                if (!name || !email || !image || !password) {
                    return res.status(400).send({ message: "All fields are required" });
                };
                const hashPassword = await bcrypt.hash(password, 14);
                const formattedDate = new Date().toLocaleString("en-US", {
                    timeZone: "Asia/Dhaka"
                });
                const userInfo = {
                    name,
                    email,
                    image,
                    password: hashPassword,
                    createdAt: formattedDate,
                }
                const result = await userCollection.insertOne(userInfo)
                res.status(201).send({ message: "User registered successfully", data: result });
            } catch (error) {
                res.status(500).send({ message: "Internal server error" });
            }
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



app.get('/', (req, res) => {
    res.send({ message: 'Welcome to FashionEra API', status: 'success' })
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})