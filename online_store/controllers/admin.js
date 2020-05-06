const mongoose = require("mongoose");
const { validationResult } = require("express-validator/check");

const Product = require("../models/product");
const fileHelper = require("../util/file");

exports.getAddProduct = (req, res, next) => {
    res.render("admin/edit-product", {
        pageTitle: "Add Product",
        path: "/admin/add-product",
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: []
    });
};

exports.postAddProduct = (req, res, next) => {
    console.log("Product middleware");
    
    const { title, price, description } = req.body;
    const { file: image } = req;

    if(!image){
        return res.status(422).render("admin/edit-product", {
            pageTitle: "Add Product",
            path: "/admin/add-product",
            editing: false,
            hasError: true,
            product: {
                title,
                price,
                description
            },
            errorMessage: "Attached file is not an image.",
            validationErrors: []
        });
    }

    const imageUrl = image.path;

    const errors = validationResult(req);

    console.log(image);

    if(!errors.isEmpty()){
        return res.status(422).render("admin/edit-product", {
            pageTitle: "Add Product",
            path: "/admin/add-product",
            editing: false,
            hasError: true,
            product: {
                title,
                price,
                description
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }

    const product = new Product({
        title,
        price,
        description,
        imageUrl,
        userId: req.user
    });

    product
        .save()
        .then(result => {
            console.log("Created Product");
            res.redirect("/admin/products");
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    console.log(editMode);
    if(!editMode){
        return res.redirect('/');
    }
    const prodId = req.params.productId;

    Product
        .findById(prodId)
        .then(product => {
            if(!product){
                return res.redirect('/');
            }
            res.render("admin/edit-product", {
                pageTitle: "Edit Product",
                path: "/admin/edit-product",
                editing: editMode,
                product: product,
                hasError: false,
                errorMessage: null,
                validationErrors: []
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postEditProduct = (req, res, next) => {
    const { 
        productId: prodId,
        title: updateTitle,
        price: updatePrice,
        description: updateDesc
     } = req.body;

    const { file: image } = req;

    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(422).render("admin/edit-product", {
            pageTitle: "Edit Product",
            path: "/admin/edit-product",
            editing: true,
            hasError: true,
            product: {
                title: updateTitle,
                price: updatePrice,
                description: updateDesc,
                _id: prodId
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }

    Product
        .findById(prodId)
        .then(product => {
            if(product.userId.toString() !== req.user._id.toString()){
                return res.redirect("/");
            }
            product.title = updateTitle;
            product.price = updatePrice;
            product.description = updateDesc;
            if(image){
                fileHelper.deleteFile(product.imageUrl);
                product.imageUrl = image.path;
            }

            return product.save()
                .then(result => {
                    console.log("UPDATED PRODUCT");
                    res.redirect("/admin/products");
                })
        })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getProducts = (req, res, next) => {
    Product
        .find({ userId: req.user._id })
        // .select("title price -_id")
        // .populate("userId", "name")
        .then(products => {
            res.render("admin/products", {
                prods: products,
                pageTitle: "Admin Products",
                path: "/admin/products"
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};


exports.deleteProduct = (req, res, next) => {
    const { productId: prodId } = req.params;

    Product
        .findById(prodId)
        .then(product => {
            if(!product){
                next(new Error("Product not found."));
            }
            fileHelper.deleteFile(product.imageUrl);
            return Product.deleteOne({ _id: prodId, userId: req.user._id })
        })
        .then(result => {
            console.log("DESTROYED PRODUCT");
            res.status(200).json({ message: "Success!" });
        })
        .catch(err => {
            res.status(500).json({ message: "Deletind product failed." });
        });
    
};