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
    const products = await productModel.find();
     const success = req.flash("success") ;// Get first message or ""
     const error = req.flash("error");
    res.render("shop", { products, success, error }); // render view with data
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to load products");
    res.redirect("/"); // fallback redirec t
  }
});

router.get("/cart", isloggedin, async (req, res) => {
   let user = await userModel
   .findOne({email:req.user.email})
   .populate("cart");

   res.render("cart",{user}); // render view with data
});


router.get("/addtocart/:productid",isloggedin, async (req,res)=>{
  let user = await userModel.findOne({email:req.user.email});
  user.cart.push(req.params.productid);
  await user.save();
   req.flash("success", "Added to cart"); // Set message for NEXT request
  res.redirect("/shop");  
})

router.get("/logout",isloggedin,(req,res)=>{
   res.render("shop")
})

module.exports = router;