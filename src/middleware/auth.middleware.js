import asyncHandler from "../util/asyncHandler.js";
import jwt from "jsonwebtoken";


// auth miiddleware createa look like this using jwt we can secure our routes

 const verifyJwt = asyncHandler ( async(req,_,next) => {

   try {

     const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer",""); 
    
     if(!token){
       throw  new ApiError(401,"Unauthorized request ")
     }
 
     const decodeToken =  jwt.verify(token,process.env.ACCRESS_TOKEN_SECRET);
     const user =  await User.findById(decodeToken?._id).select('-password -refreshToken ' );
 
     if(!user){
         throw new ApiError(401,"Invalid AccessToken");
     }
 
     req.user = user;
     next()
   } catch (error) {
     throw new ApiError(401,error?.message || "Invlid access token ")
   }

})

export { verifyJwt }