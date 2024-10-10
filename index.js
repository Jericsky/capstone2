const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// const session = require('express-session'); 

// Routes
const userRoutes = require('./routes/user');
const productRoutes = require('./routes/product');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/order');

require('dotenv').config();

const app = express();

mongoose.connect(process.env.MONGODB_STRING);
mongoose.connection.once('open', () => console.log('Now connected to MongoDB Atlas'));

const corsOptions = {
    origin: [
        'http://localhost:3000', 
        'http://zuitt-bootcamp-prod-460-7645-santos.s3-website.us-east-1.amazonaws.com'
    ], 
    credentials: true, 
    optionsSuccessStatus: 200 
};

app.use(cors(corsOptions)); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.use(session({
//     secret: process.env.clientSecret,
//     resave: false,
//     saveUninitialized: false
// }));

// Apply routes after setting up middleware
app.use('/b1/users', userRoutes);
app.use('/b1/products', productRoutes);
app.use('/b1/cart', cartRoutes);
app.use('/b1/orders', orderRoutes);

if (require.main === module) {
    app.listen(process.env.PORT || 3000, () => {
        console.log(`API is online on port ${process.env.PORT || 3000}`);
    });
}
