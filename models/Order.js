const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'User ID is required.'],
        ref: 'User' // Associates the order with the user who owns it
    },
    productsOrdered: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Product ID is required.']
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required.']
        },
        subtotal: {
            type: Number,
            required: [true, 'Subtotal is required.']
        }
    }],
    totalPrice: {
        type: Number,
        required: [true, 'Total price is required.']
    },
    orderedOn: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        default: 'Pending'
    }
});

module.exports = mongoose.model('Order', orderSchema);