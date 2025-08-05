const express = require('express');
const app = express();

const cookieParser = require("cookie-parser");
const path = require("path");
const expressSession = require("express-session");
const flash = require("connect-flash");

const indexRouter = require("./routes/index");
const ownersRouter = require("./routes/ownersRouter");
const productsRouter = require('./routes/productsRouter');
const usersRouter = require("./routes/usersRouter");

require('dotenv').config({ quiet: true });

const db = require("./config/mongoose-connection");

const userModel = require("./models/user-model")
const ownerModel = require("./models/owner-model")
const productModel = require("./models/product-model")


app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use(cookieParser());

app.use(
    expressSession({
        resave:false,
        saveUninitialized:false,
        secret:process.env.EXPRESS_SESSION_SECRET,
    })
);
app.use(flash());

app.use(express.static(path.join(__dirname,"public")));

app.set("view engine","ejs");

app.use("/", indexRouter);
app.use("/owners",ownersRouter);
app.use("/users",usersRouter);
app.use("/products",productsRouter);


app.listen(3000);