const Cart = require('../models/Cart');
const Product = require('../models/Product');

// module.exports.getUserCart = async (req, res) => {
//     const { id } = req.user;
  
//     try {
//       const userCart = await Cart.findOne({ userId: id });
//       console.log(userCart)
  
//       if (!userCart) {
//         return res.status(404).send({ error: "User's cart not found" });
//       }
  
//       return res.status(200).send({ cart: userCart });
//     } catch (error) {
//       console.error("Error retrieving user cart: ", error);
//       return res
//         .status(500)
//         .send({ error: "Internal Server Error: Failed to retrieve user cart" });
//     }
// };

module.exports.getUserCart = (req, res) => {
    const userId = req.user.id;  

    console.log(userId);
    console.log(req.user.isAdmin)

    if (!userId || req.user.isAdmin) {
        return res.status(403).send({ message: 'Access denied. Only authenticated non-admin users can retrieve the cart.' });
    }

    return Cart.findOne({ userId: userId })
        .then(cart => {
            console.log(cart)
            if (cart) {
                const formattedCart = {
                    cart: {
                        _id: cart._id,
                        userId: cart.userId,
                        cartItems: (cart.cartItems || []).map(item => ({
                            productId: item.productId,
                            name: item.name,
                            quantity: item.quantity,
                            subtotal: item.subtotal,
                            _id: item._id
                        })),
                        totalPrice: cart.totalPrice,
                        orderedOn: cart.orderedOn,
                        __v: cart.__v
                    }
                };
                
                return res.status(200).send(formattedCart);
            } else {
                return res.status(404).send({ message: 'Cart not found' });
            }
        })
        .catch(error => {
            console.error('Error retrieving cart:', error);
            return res.status(500).send({ message: 'An error occurred while retrieving the cart', error: error.message });
        });
};
  
module.exports.addToCart = async (req, res) => {
    const { id } = req.user;
    const { productId, quantity } = req.body;

    try {
        if (isNaN(quantity) || quantity <= 0) {
            return res.status(400).send({ error: "Quantity should be greater than 0" });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).send({ error: "Product not found" });
        }

        if (product && !product.isActive) {
            return res.status(400).send({ error: "Product being added is currently inactive" })
        }

        let userCart = await Cart.findOne({ userId: id });

        if (!userCart) {
            userCart = new Cart({
                userId: id,
                cartItems: [],
                totalPrice: 0,
            });
        }

        const existingProductIndex = userCart.cartItems.findIndex(
            (item) => item.productId === productId
        );
      
        if (existingProductIndex !== -1) {
          const existingProduct = userCart.cartItems[existingProductIndex];
          existingProduct.quantity += parseInt(quantity);
          existingProduct.subtotal = existingProduct.quantity * product.price;
        } else {
          userCart.cartItems.push({
            productId,
            quantity,
            subtotal: quantity * product.price
          });
        }

        userCart.totalPrice = calculateTotalPrice(userCart.cartItems);

        await userCart.save();
        return res.status(201).send({ message: "Item added to cart successfully", cart: userCart });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: "Internal Server Error: Failed to add item to cart" });
    }
};

module.exports.updateCartQuantity = async (req, res) => {
    const { id } = req.user;
    const { productId, quantity } = req.body;

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send({ error: "Product does not exist" });
        }

        const userCart = await Cart.findOne({ userId: id });
        if (!userCart) {
            return res.status(404).send({ error: "User's cart not found" });
        }

        const cartItemIndex = userCart.cartItems.findIndex(
            (item) => item.productId == productId
        );

        if (cartItemIndex == -1) {
            return res.status(404).send({ error: "Item not found in user's cart" });
        } 

        const cartItems = userCart.cartItems[cartItemIndex];
        cartItems.quantity = quantity;
        cartItems.subtotal = quantity * product.price;

        userCart.totalPrice = calculateTotalPrice(userCart.cartItems);

        await userCart.save();
        return res.status(200).send({
            message: "User's cart item quantity updated successfully",
            cart: userCart,
        });
    } catch (error) {
        console.error("Error updating user's cart item quantity: ", error);
        return res.status(500).send({
            error: "Internal Server Error: Failed to update cart item quantity",
        });
    }
}

const calculateTotalPrice = (items) => {
    return items.reduce((total, item) => total + item.subtotal, 0);
};

module.exports.removeFromCart = async (req, res) => {

    const {id} = req.user
    const { productId } = req.params;

    try {
        const userCart = await Cart.findOne({ userId: id });
        if (!userCart) {
            return res.status(404).send({ error: "User's cart not found" });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send({ error: "Product does not exist" });
        }

        if (userCart.cartItems.length === 0){
            return res.status(400).send({message: "Item not found in cart"})
        }

        userCart.cartItems = userCart.cartItems.filter(
            (item) => item.productId != productId
        );

        userCart.totalPrice = calculateTotalPrice(userCart.cartItems);

        await userCart.save();

        return res.status(200).send({
            message: "Item removed from cart successfully",
            updatedCart: userCart
        })

    } catch (error) {
        console.log('Error removing item from cart: ', error)
        return res.status(500).send({
            error: "Internal Server Error: Failed to remove item from the cart."
        })
    }
}

module.exports.clearCart = async (req, res) => {

    const {id} = req.user;

    try{
        const userCart = await Cart.findOne({userId: id})
        if (!userCart) {
            return res.status(404).send({ error: "User's cart not found" });
        }

        if (userCart.cartItems.length === 0){
            return res.status(200).send({ message: "User's cart is empty" });
        }

        userCart.cartItems = []
        userCart.totalPrice = 0;
        await userCart.save()

        return res.send({
            message: "Cart cleared successfully",
            cart: userCart
        })

    } catch (error){
        console.log("Error clearing user's cart: ", error)
        return res.status(500).send({
            error: "Internal Server Error: Failed to clear user's cart."
        })
    }
}


