import { Router } from "express";

const router = Router();

import { signup , login , getUserDetails , forgotPassword , resetPassword} from "../controller/user.controller.js";


router.route("/healthCheck").get((req,res) => {
    res.send("all working");
})


router.route("/register").post(signup);
router.route("/login").post(login);
router.route("/user-details/:id").get(getUserDetails);
router.route("/forget-password").post(forgotPassword);
router.route("/reset-password").post(resetPassword);



export { router }