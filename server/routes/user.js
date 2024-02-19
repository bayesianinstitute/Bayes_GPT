import { Router } from "express";

import { deleteUser, finishSignup, forgotPassword, forgotVerify, login, logout, notLoggedIn, pendingUser, resetPassword, signUp } from "../controllers/user.js";
import { CheckLogged } from "../middleware/user.js";

let router = Router()



  


// CheckLogged
router.get('/checkLogged', CheckLogged, notLoggedIn);

// Signup
router.post('/signup', CheckLogged,signUp );
router.get('/checkPending', CheckLogged,pendingUser );
router.put('/signup-finish', CheckLogged,finishSignup );

// Login
router.get('/login', CheckLogged,login );
router.post('/forgot-request', CheckLogged,forgotPassword )
router.get('/forgot-check', CheckLogged,forgotVerify )
router.put('/forgot-finish', CheckLogged,resetPassword)

// delete acoount 
router.delete('/account', deleteUser)

// Logout
router.get('/logout',logout )

export default router
