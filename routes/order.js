const express = require('express');
const { verify, verifyAdmin} = require('../auth');
const orderControllers =require('../controllers/order');

const router = express.Router();

router.post('/checkout', verify, orderControllers.createOrder);

router.get('/my-orders', verify, orderControllers.myOrders);

router.get('/all-orders',verify, verifyAdmin, orderControllers.allOrders);

//stretch goals
router.patch('/:orderId/cancel', verify, orderControllers.cancelOrder);

router.post('/:productId/review', verify, orderControllers.reviewOrder);

router.get('/:productId/reviews', orderControllers.getAllReviews)

router.put('/:productId/review/:reviewId', verify, orderControllers.updateReview)

router.delete('/:productId/review/:reviewId', verify, orderControllers.deleteReview)

module.exports = router;