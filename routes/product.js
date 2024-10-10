const express = require('express');
const productController = require('../controllers/product');

const {verify, verifyAdmin} = require('../auth')

const router = express.Router();

// Route to create a new product
router.post('/', productController.createProduct);

// Route to retrieve all products
router.get('/all', verify, productController.getAllProducts);

// Route to retrieve active products
router.get('/active', productController.getActiveProducts);

// Route to retrieve a single product by ID
router.get('/:productId', productController.getProductById);

router.patch('/:id/update', productController.updateProduct)

router.patch('/:id/archive', productController.archiveProduct)

router.patch('/:id/activate', productController.activateProduct)

// search product by name
router.post('/search-by-name', productController.searchProductByName);

// Route to search products by price range
router.post('/search-by-price', productController.searchProductByPrice);

//stretch goals
router.post('/wishlist/add', verify, productController.addToWishlist);

router.delete('/wishlist/remove/:productId', verify, productController.removeWishlist);

router.get('/wishlist', verify, productController.getAllWishlists)


module.exports = router;