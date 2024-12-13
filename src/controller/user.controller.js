import { connection } from "../dbConnection/dbConnection.js";
import asyncHandler from "../util/asyncHandler.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import crypto from "crypto";
import moment from "moment";
import { mailSender } from "../util/sendEmail.js";
// Endpoint:

// - Create an API for signup with fields:
//     * First Name
//     * Last Name
//     * Email
//     * Password

const genrateJwtToken = async (user) => {
  try {
    const token = await jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return token;
  } catch (error) {
    // res.send("error while creating token", error?.message).status(401);
    console.log(error);
  }
};

const signup = asyncHandler(async (req, res) => {
  const { firstName, LastName, email, password } = req.body;
  console.log(firstName);

  if (
    [firstName, LastName, email, password].some(
      (fields) => fields?.trim() === "" || undefined
    )
  ) {
    return res.status(400).send("all fields are required");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const query =
    "INSERT INTO users (firstName, LastName, email, password) VALUES (?, ?, ?, ?)";

  connection.query(
    query,
    [firstName, LastName, email, hashedPassword],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res
            .status(400)
            .json({ error: "Username or email already exists" });
        }
        console.error("Error inserting user:", err.message);
        return res.status(500).json({ error: "Internal server error" });
      }

      res.status(201).json({ message: "User registered successfully" });
    }
  );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const query = "SELECT * FROM users WHERE email = ?";

  connection.query(query, [email], async (err, results) => {
    if (err) {
      console.error("Error querying the database:", err.message);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (results.length === 0) {
      // User not found
      return res.status(404).json({ error: "User not found" });
    }

    const user = results[0];

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = await genrateJwtToken(user);
    // console.log(token);

    // Respond with success
    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  });
});

const getUserDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log(id);

  if (!id) {
    return res.status(400).json({ error: "User ID is required" });
  }

  const query =
    "SELECT id, firstName, email, created_at FROM users WHERE id = ?";
  connection.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error querying the database:", err?.message);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ user: results[0] });
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
  
    // Check if the email exists
    const query = 'SELECT * FROM users WHERE email = ?';
    connection.query(query, [email], async (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
  
      if (result.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
  
     // genrate token using crypto 
      const resetToken = crypto.randomBytes(20).toString('hex');
  
      // Set the expiration time (5 minutes from now)
      const resetTokenExpiry = moment().add(5, 'minutes').format('YYYY-MM-DD HH:mm:ss');

  
      // Update the reset token and its expiry time in the database
      const updateQuery = 'UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?';
      connection.query(updateQuery, [resetToken, resetTokenExpiry, email], async (err, updateResult) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Error updating token' });
        }
  
        // Send reset email with the token
        try {
          await mailSender(email, resetToken);
          return res.status(200).json({ message: 'Password reset link sent to email' });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ error: 'Failed to send reset email' });
        }
      });
    });
  });

// reset password api

const resetPassword = asyncHandler(async (req,res) => {

    const {NewPassword,ConfirmPassword} = req.body;

    const {token} = req.query;
    console.log(token);

    if(NewPassword !== ConfirmPassword){
        return res.status(401).json({error:"password does not match please fix it "});

    }

    if (!token || !NewPassword || ConfirmPassword.trim() === '') {
        return res.status(400).json({ error: 'Token and new password are required' });
      }

    const query = 'SELECT * FROM users WHERE resetToken = ?';
    connection.query(query, [token], async (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });

      if (results.length === 0) {
        return res.status(404).json({ error: 'Invalid or expired token' });
      }

      const user = results[0];

      // Check if the token has expired
      const isTokenExpired = moment().isAfter(moment(user.resetTokenExpiry));
      if (isTokenExpired) {
        return res.status(400).json({ error: 'Reset token has expired' });
      }

      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(NewPassword, salt);

      const updateQuery = `UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?`;
      connection.query(updateQuery, [hashedPassword, user.id], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to update password' });

        res.status(200).json({ message: 'Password reset successfully' });
      });
    });



})

export { signup, login, getUserDetails, forgotPassword, resetPassword };
