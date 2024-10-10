const express = require('express');
const { verify } = require('../auth');
const cartControllers = require('../controllers/cart');

const router = express.Router();

router.get('/get-cart', verify, cartControllers.getUserCart);

router.post('/add-to-cart', verify, cartControllers.addToCart)

router.patch('/update-cart-quantity', verify, cartControllers.updateCartQuantity);

router.patch('/:productId/remove-from-cart', verify, cartControllers.removeFromCart)

router.put('/clear-cart', verify, cartControllers.clearCart)





module.exports = router;