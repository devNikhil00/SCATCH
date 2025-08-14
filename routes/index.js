const express = require("express");
const router = express.Router();
const {isloggedin} = require("../middlewares/isLoggedIn")
const productModel = require("../models/product-model");
const userModel = require("../models/user-model");

router.get("/", (req, res) => {
   let error = req.flash("error");
   res.render("index", { error ,loggedin:false }); // or with a string error message if any

});

router.get("/shop", isloggedin, async (req, res) => {
  try {
    let query = {};
    let sortOption = {};
    
    // Handle search
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }
    
    // Handle price filtering
    if (req.query.price) {
      const priceRanges = Array.isArray(req.query.price) ? req.query.price : [req.query.price];
      const priceConditions = priceRanges.map(range => {
        switch(range) {
          case '0-500':
            return { price: { $lte: 500 } };
          case '500-1000':
            return { price: { $gt: 500, $lte: 1000 } };
          case '1000-2000':
            return { price: { $gt: 1000, $lte: 2000 } };
          case '2000+':
            return { price: { $gt: 2000 } };
          default:
            return {};
        }
      });
      if (priceConditions.length > 0) {
        query.$or = priceConditions;
      }
    }
    
    // Handle discount filtering
    if (req.query.discount) {
      const discountRanges = Array.isArray(req.query.discount) ? req.query.discount : [req.query.discount];
      const discountConditions = discountRanges.map(discount => {
        const minDiscount = parseInt(discount);
        return { discount: { $gte: minDiscount } };
      });
      if (discountConditions.length > 0) {
        query.$or = discountConditions;
      }
    }
    
    // Handle category filtering
    if (req.query.category) {
      switch(req.query.category) {
        case 'new':
          // For new products, limit to first few products (you can add a 'new' field later)
          // For now, we'll just show all products
          break;
        case 'discounted':
          query.discount = { $gt: 0 };
          break;
        case 'bestsellers':
          // For bestsellers, we'll show all products for now
          // You can add a 'bestseller' field later
          break;
      }
    }
    
    // Handle sorting
    switch(req.query.sortby) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'price-low':
        sortOption = { price: 1 };
        break;
      case 'price-high':
        sortOption = { price: -1 };
        break;
      case 'discount':
        sortOption = { discount: -1 };
        break;
      case 'popular':
      default:
        sortOption = { _id: -1 }; // Default sort by newest
        break;
    }
    
    const products = await productModel.find(query).sort(sortOption);
    const success = req.flash("success");
    const error = req.flash("error");
    
    res.render("shop", { 
      products, 
      success, 
      error,
      search: req.query.search || '',
      sortby: req.query.sortby || 'popular',
      price: req.query.price || [],
      discount: req.query.discount || [],
      category: req.query.category || ''
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to load products");
    res.redirect("/");
  }
});

router.get("/cart", isloggedin, async (req, res) => {
   let user = await userModel
   .findOne({email:req.user.email})
   .populate("cart.product");

   const success = req.flash("success");
   const error = req.flash("error");

   res.render("cart",{user, success, error}); // render view with data
});

router.get("/addtocart/:productid",isloggedin, async (req,res)=>{
  try {
    let user = await userModel.findOne({email:req.user.email});
    
    // Check if product already exists in cart
    const existingCartItem = user.cart.find(item => 
      item.product.toString() === req.params.productid
    );
    
    if (existingCartItem) {
      // If product exists, increment quantity
      existingCartItem.quantity += 1;
      req.flash("success", "Quantity increased in cart");
    } else {
      // If product doesn't exist, add new item
      user.cart.push({
        product: req.params.productid,
        quantity: 1
      });
      req.flash("success", "Added to cart");
    }
    
    await user.save();
    res.redirect("/shop");
  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to add to cart");
    res.redirect("/shop");
  }
});

// Increment quantity
router.get("/increment/:productid", isloggedin, async (req, res) => {
  try {
    let user = await userModel.findOne({email: req.user.email});
    const cartItem = user.cart.find(item => 
      item.product.toString() === req.params.productid
    );
    
    if (cartItem) {
      cartItem.quantity += 1;
      await user.save();
      req.flash("success", "Quantity increased");
    }
    
    res.redirect("/cart");
  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to update quantity");
    res.redirect("/cart");
  }
});

// Decrement quantity
router.get("/decrement/:productid", isloggedin, async (req, res) => {
  try {
    let user = await userModel.findOne({email: req.user.email});
    const cartItem = user.cart.find(item => 
      item.product.toString() === req.params.productid
    );
    
    if (cartItem) {
      if (cartItem.quantity > 1) {
        cartItem.quantity -= 1;
        req.flash("success", "Quantity decreased");
      } else {
        // Remove item if quantity becomes 0
        user.cart = user.cart.filter(item => 
          item.product.toString() !== req.params.productid
        );
        req.flash("success", "Item removed from cart");
      }
      await user.save();
    }
    
    res.redirect("/cart");
  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to update quantity");
    res.redirect("/cart");
  }
});

// Remove item from cart
router.get("/remove/:productid", isloggedin, async (req, res) => {
  try {
    let user = await userModel.findOne({email: req.user.email});
    user.cart = user.cart.filter(item => 
      item.product.toString() !== req.params.productid
    );
    await user.save();
    req.flash("success", "Item removed from cart");
    res.redirect("/cart");
  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to remove item");
    res.redirect("/cart");
  }
});

router.get("/logout",isloggedin,(req,res)=>{
   res.render("shop")
})

module.exports = router;