const express = require('express');
const app = express();
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cors = require('cors');
const port = process.env.PORT || 3000;
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const { connectDB, db } = require('./config/database');


//middleware
app.use(cors({
    origin: [
        'http://localhost:5173'
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser())


//custom milldewares
const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    jwt.verify(token, process.env.SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' });
        }
        req.user = decoded;
        next();
    });
};


// const uri = `mongodb+srv://${process.env.MONGODB_USER_KEY}:${process.env.MONGODB_PASS_KEY}@cluster0.gphdl2n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//     serverApi: {
//         version: ServerApiVersion.v1,
//         strict: true,
//         deprecationErrors: true,
//     }
// });

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        await connectDB()
        const userCollection = db.collection('users')

        // const userCollection = client.db('fashionEra').collection('users');


        //middleware for token verify
        const verifyToken = (req, res, next) => {
            // console.log(req);
            const token = req?.cookies?.token;
            if(!token) return res.status(401).send({ message: "Unauthorized" });
        }


        app.get('/api/current-user', verifyToken, async (req, res) => {
            console.log( 'hello i am here',req);
        })



        // token generator api 
        app.get('/jwt', async (req, res) => {
            try {
                const data = req?.query?.email;
                if (!data) {
                    return res.status(400).json({ message: 'Invalid request data' });
                }
                console.log('hello iam here');
                const token = jwt.sign({ email: data }, process.env.SECRET, { expiresIn: '1h' });
                res
                    .cookie('token', token, {
                        httpOnly: true,
                        secure: true,
                        sameSite: 'none'
                    })
                    .send({ message: 'Get And Set JWT Token', status: 200 });
            } catch (error) {
                res.status(500).json({ message: 'Internal Server Error' });
            }
        })

        // remove token form cookie
        app.get('/token-remove', (req, res) => {
            res
                .clearCookie('token', {
                    maxAge: 0
                })
                .send({ message: 'Cookie Remove Successfully.', status: 200 })
        })


        // added something

        //Auth Releted Api - Sign Up and Sign In
        app.post('/sign-up-user-info', async (req, res) => {
            const { name, email, image, password } = req.body;
            try {
                if (!name || !email || !image || !password) {
                    return res.status(400).send({ message: "All fields are required" });
                };
                const existingUser = await userCollection.findOne({ email });
                if (existingUser) {
                    return res.status(400).send({ message: "Email already exists" })
                };
                const hashPassword = await bcrypt.hash(password, 10);
                const formattedDate = new Date().toLocaleString("en-US", {
                    timeZone: "Asia/Dhaka"
                });
                const userInfo = {
                    name,
                    email,
                    image,
                    password: hashPassword,
                    createdAt: formattedDate,
                };
                const result = await userCollection.insertOne(userInfo);
                res.status(200).send({ message: "User registered successfully", data: result });
            } catch (error) {
                res.status(500).send({ message: "Internal server error" });
            }
        });

        // today is eid day 
        // today is rest day okay

        app.post('/api/login', async (req, res) => {
            const { email, password } = req.body;
            console.log(req.body);
            try {
                if (!email || !password) {
                    return res.status(400).send({ message: "All fields are required" });
                };
                const existingUser = await userCollection.findOne({ email });
                if (!existingUser) {
                    console.log('hello');
                    return res.status(404).json({ message: "User not found. Please sign up." });
                };
                const isPasswordMatch = await bcrypt.compare(password, existingUser?.password);
                if (!isPasswordMatch) {
                    return res.status(401).json({ message: "Incorrect password" });
                }
                const token = jwt.sign({ userId: existingUser?._id, email: email }, process.env.JWT_SECRET, { expiresIn: '1h' });
                return res
                    .cookie('token', token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: 'strict'
                    })
                    .status(200).send({ message: "Login successful" });
            } catch (error) {
                return res
                    .status(500)
                    .send({
                        message: "Internal server error"
                    })
            }

        })


        //Profile releted api
        app.get(`/user-info`, verifyToken, async (req, res) => {
            try {
                if (req?.query?.email !== req?.user?.email) {
                    return res
                        .status(401)
                        .send({
                            message: "Unauthorized access"
                        })
                }
                const result = await userCollection.findOne({ email: req?.query?.email });
                res.send({ message: "User info get successfully.", status: 200, data: result })
            } catch (error) {
                return res
                    .status(500)
                    .send({
                        message: "Internal server error"
                    })
            }
        })

        //profile data update api
        app.patch('/update-user-info', async (req, res) => {
            try {
                const userId = req?.query?.id;
                const { name, password } = req.body;
                const query = { _id: new ObjectId(userId) };
                const updateDoc = {};
                if (name) updateDoc.name = name;
                if (password) {
                    const hashPassword = await bcrypt.hash(password, 14);
                    updateDoc.password = hashPassword;
                }
                if (Object.keys(updateDoc).length === 0) {
                    return res.status(400).send({ message: "No fields to update!" });
                }
                const updateData = {
                    $set: updateDoc
                };
                console.log(updateDoc);
                const result = await userCollection.updateOne(query, updateData)
                res.status(200).send({ message: "Update Done" })
            } catch (error) {
                return res
                    .status(500)
                    .send({
                        message: "Internal server error"
                    })
            }
        })









        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    const now = new Date();
    const bdTime = now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });
    res.send({
        message: 'Welcome to FashionEra API',
        status: 200,
        server_time: now.toISOString(),
        bangladeshi_time: bdTime
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})