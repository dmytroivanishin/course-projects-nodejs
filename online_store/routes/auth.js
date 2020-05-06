const express = require("express");
const { check, body } = require("express-validator/check");

const authController = require("../controllers/auth");
const User = require("../models/user");

const router = express.Router();

router.get("/login", authController.getLogin);

router.get("/signup", authController.getSignup);

router.post("/login", 
    [
        body("email")
            .isEmail()
            .withMessage("Please enter a valid email address.")
            .normalizeEmail(),
        body("password", "Password has to be valid.")
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim()
    ],
    authController.postLogin);

router.post("/signup",
    [
        check("email")
            .isEmail()
            .withMessage("Please enter a valid email.")
            .custom((value, {req}) => {
                return User.findOne({ email: value })
                    .then(userDoc => {
                        if(userDoc){
                            return Promise.reject("Email exists already, please pick a different one.")
                        }
                    })
            })
            .normalizeEmail(),

        body("password", "Please enter a password with only number and text and at least 2 characters.")
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim(),

        body("confirmPassword")
            .custom((value, { req }) => {
                if(value !== req.body.password){
                    throw new Error("Passwords have to match!")
                }
                return true;
            })
            .trim()
    ],
    authController.postSignup);

router.post("/logout", authController.postLogout);

router.get("/reset", authController.getRestet);
router.post("/reset", authController.postRestet);

router.get("/reset/:token", authController.getNewPassword);

router.post("/new-password", authController.postNewPassword);

module.exports = router;