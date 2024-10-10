const Product = require('../models/Product');
const Wishlist = require('../models/Wishlists');
const User = require('../models/User')
const { errorHandler } = require('../auth')

// Create Product Controller
module.exports.createProduct = async (req, res) => {
    try {
        const { name, description, price } = req.body;
        
        // Validation to ensure all fields are provided
        if (!name || !description || !price) {
            return res.status(400).json({
                success: false,
                error: 'Validation Error',
                message: 'Name, description, and price are required.'
            });
        }

        const product = new Product(req.body);
        await product.save();
        res.status(201).json( product );
    } catch (error) {
        console.error('Error creating product:', error); // Log the error to the console
        res.status(500).json({ success: false, error: 'Server Error', message: error.message });
    }
};

// Retrieve All Products Controller
module.exports.getAllProducts = async (req, res) => {
    try {
        if (!req.user.isAdmin){
            return res.status(403).send({auth: "Failed", message: "Action Forbidden"})
        }
       
        const products = await Product.find({});
        res.status(200).json(products);
    } catch (error) {
        console.error('Error retrieving products:', error); // Log the error to the console
        res.status(500).json({ success: false, error: 'Server Error', message: error.message });
    }
};

// Retrieve Active Products Controller
module.exports.getActiveProducts = async (req, res) => {
    try {
        const activeProducts = await Product.find({ isActive: true });
        res.status(200).json(activeProducts);
    } catch (error) {
        console.error('Error retrieving active products:', error);
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

// Retrieve Single Product Controller
module.exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId);
        
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.status(200).json(product);
    } catch (error) {
        console.error('Error retrieving product:', error);
        res.status(500).json({ success: false, error: 'Server Error', message: error.message });
    }
};

module.exports.updateProduct = (req, res) => {
    let updatedProduct = {
        name: req.body.name,
        description: req.body.description,
        price: req.body.price
    }

    return Product.findByIdAndUpdate(req.params.id, updatedProduct, {new: true})
    .then(product=> {
        console.log(req.params.id)
        if (product){
            res.status(200).send({success: "true", message: "Product updated successfully"})
        } 
    })
    .catch(error => {
        res.status(404).send({ message: "Product not found" });
    })
}

module.exports.archiveProduct = (req, res) => {
    let updateActiveProduct = {
        isActive: false
    }

    return Product.findByIdAndUpdate(req.params.id, updateActiveProduct)
    .then (product => {
        
        if (product){
            if (!product.isActive){
                return res.status(200).send({
                    message: "Product already archived",
                    archiveProduct: product
                })
            } else {
                return res.status(200).send({
                    success: true,
                    message: "Product archived successfully"
                })
            }
        } 
    })
    .catch(error => {
        res.status(404).send({error: "Product not found"})
    })
}

module.exports.activateProduct = (req, res) => {
    let activateProduct = {
        isActive: true
    }

    return Product.findByIdAndUpdate(req.params.id, activateProduct)
    .then(product =>{
        
        if (product){
            if(!product.isActive){
                return res.status(200).send({
                    success: true,
                    message: "Product activated succcessfully d"
                })
            } else {
                return res.status(200).send({
                    message: "Product already active",
                    activateProduct: product
                })
            }
        }

    })
    .catch(error => {
        res.status(404).send({error: "Product not found"})
    })
}

//search product by name
module.exports.searchProductByName = async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Validation Error',
                message: 'Name is required for search.'
            });
        }

        // Using regex for a partial match, case-insensitive
        const products = await Product.find({ name: new RegExp(name, 'i') });

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No products found matching the name provided.'
            });
        }

        res.status(200).json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error searching for products:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message
        });
    }
};

//search by price
// Search Products by Price Range Controller
module.exports.searchProductByPrice = async (req, res) => {
    try {
        const { minPrice, maxPrice } = req.body;

        // Validate that minPrice and maxPrice are provided
        if (minPrice === undefined || maxPrice === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Validation Error',
                message: 'Both minPrice and maxPrice are required.'
            });
        }

        // Find products within the specified price range
        const products = await Product.find({
            price: { $gte: minPrice, $lte: maxPrice }
        });

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No products found within the specified price range.'
            });
        }

        res.status(200).json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error searching for products by price:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error',
            message: error.message
        });
    }
};

//stretch goals
module.exports.addToWishlist = async (req, res) => {
    const { userId, productId } = req.body;

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const wishlist = await Wishlist.findOne({ userId });

        if (wishlist) {
            if (wishlist.products.includes(productId)) {
                return res.status(400).json({ message: 'Product already in wishlist' });
            }
            wishlist.products.push(productId);
            await wishlist.save();
        } else {
            const newWishlist = new Wishlist({ userId, products: [productId] });
            await newWishlist.save();
        }

        res.status(200).json({ message: 'Product added to wishlist' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
}

module.exports.removeWishlist = async (req, res) => {
    const { userId } = req.body;
    const { productId } = req.params;

    try {
        const wishlist = await Wishlist.findOne({ userId });

        console.log(wishlist)

        if (!wishlist || !wishlist.products.includes(productId)) {
            return res.status(404).json({ message: 'Product not found in wishlist' });
        }

        wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
        await wishlist.save();

        res.status(200).json({ message: 'Product removed from wishlist' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
}

// to fix
module.exports.getAllWishlists = async (req, res) => {
    const { userId } = req.body;

    try {
        console.log("Received userId:", userId); // Debugging: log the value
        const wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist not found' });
        }

        console.log("Wishlist found:", wishlist);

        res.status(200).json({ products: wishlist.products });
    } catch (error) {
        console.error("Error retrieving wishlist:", error); // Log the error
        res.status(500).json({ success: false, error: 'Server Error', message: error.message });
    }
}
