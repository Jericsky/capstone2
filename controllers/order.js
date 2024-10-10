const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Review = require('../models/Review')
const User = require('../models/User');

// module.exports.checkoutOrder = async (req, res) => {

//     const {id} = req.user
 
//     try{

//         const userCart = await Cart.findOne({userId: id})
//         // res.send({userId: id, cart: userCart})

//         if (userCart.cartItems.length === 0){
//             return res.status(404).send({error: "User's cart is empty"})
//         }

//         const newOrder = new Order({
//             userId: id,
//             productsOrdered: userCart.cartItems,
//             totalPrice: userCart.totalPrice
//         })

//         await newOrder.save()

//         userCart.cartItems = []
//         userCart.totalPrice = 0

//         await userCart.save()
//         return res.send({order: newOrder})
        


//     } catch (error){

//     }

// }

module.exports.createOrder = async (req, res) => {
    try {
        //Validate that the user is authenticated via JWT middleware
        const cart = await Cart.findOne({ userId: req.user.id });

        //Check if the cart exists for the user
        if (!cart) {
            // NEW: Send message to client if no cart is found
            return res.status(404).json({ message: "No cart found for the user" });
        }

        // //Check if the cart contains items
        if (cart.cartItems.length === 0) {
            
            // NEW: Send message to client if cart is empty
            return res.status(400).json({ error: "No items to checkout" });
        }

        // Create an Order document using the user's cart details
        const order = new Order({
            userId: req.user.id,
            productsOrdered: cart.cartItems,  // NEW: Using `productsOrdered`
            totalPrice: cart.totalPrice,       // NEW: Using `totalPrice`
            status: 'Pending'
        });

        //Save the Order document
        await order.save();

        //Clear the cart after order creation
        cart.cartItems = [];
        cart.totalPrice = 0;
        await cart.save();

        //Send success message to the client along with order details
        res.status(201).json({ message: "Ordered successfully" });
    } catch (err) {
        console.error(err);

        // Catch and handle errors during the order creation process
        res.status(500).json({ message: "Failed to create order", error: err.message });
    }
};

module.exports.myOrders = async (req, res) => {
    const { id } = req.user;

    try {
        
        const orders = await Order.find({ userId: id });

        const filteredOrders = orders.filter(order => order.productsOrdered.length > 0);

        if (filteredOrders.length === 0) {
            return res.status(404).send({ message: "No valid orders found for this user" });
        }

        return res.status(200).send({ orders: filteredOrders });

    } catch (error) {
        console.log('Error getting orders for this user: ', error);
        return res.status(500).send({
            error: "Internal server error: Failed to get orders for this user"
        });
    }
};


module.exports.allOrders = async (req, res) => {
    
    try{
        const orders = await Order.find({}) 

        if (orders.length ===0){
            return res.status(404).send({message: "No orders found"})
        }

        return res.status(200).send({order: orders})

    } catch (error) {
        console.log('Error getting all orders: ', error);
        return res.status(500).send({
            error: 'Internal server error: Failed to get all orders'
        })
    }
}

//stretch goals
module.exports.cancelOrder = async (req, res) => {
    const{id} = req.user
    const {orderId} = req.params;

    try {

        const orderItems = await Order.find({userId: id});
        if (!orderItems) {
            return res.status(404).send({error: "No order items found"})
        }

        const order = await Order.findById(orderId)
        if (!order){
            return res.status(404).send({error: "Order does not exist"})
        }

        if(order.productsOrdered.length === 0){
            return res.status(404).send({error: "Empty ordered products"})
        }

        order.productsOrdered = [];
        order.totalPrice = 0
        await order.save()

        res.status(201).send({message: "Order calcelled successfully", order})

    } catch(error){
        console.log('Error cenceling this order: ', error);
        return res.status(500).send({
            error: "Internal server error: Failed to cancel order"
        })
    }
}

module.exports.reviewOrder = async (req, res) => {
    try {
        const { userId, rating, reviewText } = req.body;
        const { productId } = req.params;
    
        if (!userId || !rating) {
          return res.status(400).json({ error: 'User ID and rating are required' });
        }
    
        const review = new Review({ productId, userId, rating, reviewText });
        console.log(review)
        await review.save();
    
        res.status(201).send({ message: 'Review submitted successfully', review });
      } catch (error) {
        res.status(500).send({ error: 'Server error', details: error.message });
      }
}

module.exports.getAllReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({ productId }).populate('userId');
    
        res.status(200).json(reviews);
      } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
      }
}

// code for error handler
module.exports.updateReview = async (req, res) => {
    try{

        const {productId, reviewId} = req.params;
        const {rating, reviewText} = req.body;

        const review = await Review.findOneAndUpdate(
            { _id: reviewId, productId  },
            { rating, reviewText},
            { new: true}
        ).populate('userId')

        if (review.rating > 5 || review.rating < 0 || review.rating == null){
            return res.status(400).send({error: "Invalid rating value"})
        }

        res.send(review)

    } catch(error){
        res.status(500).json({ error: 'Server error', details: error.message });
    }
}

module.exports.deleteReview = async (req,res) => {
    try{

        const {productId, reviewId} = req.params;

        const review = await Review.findOneAndDelete(
            { _id: reviewId, productId  }
        )

        if (!review){
            return res.status(404).send({error: "No review found"})
        }

       
        res.status(200).send({review})
    } catch (error){
        res.status(500).json({ error: 'Server error', details: error.message });
    }
}