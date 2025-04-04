import User from '../models/user.js';// Assuming you have a User model defined
import transporter from '../config/email.js'; // Adjust the path as necessary
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import dotenv from 'dotenv';
dotenv.config();

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

 const checkUser = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findByEmail(email);
    
    if (user) {
      // User exists, send verification code for login
      const verificationCode = generateVerificationCode();
      await User.updateVerificationCode(email, verificationCode);
      
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Login Verification Code',
        text: `Your verification code is: ${verificationCode}`
      });
      
      return res.json({ exists: true, message: 'Verification code sent to email' });
    } else {
      // User doesn't exist
      return res.json({ exists: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};



const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (typeof password !== 'string') {
      return res.status(400).json({ message: 'Password must be a string' });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate verification code
    const verificationCode = generateVerificationCode();

    // Create user
    await User.create({
      name,
      email,
      password: hashedPassword,
      verificationCode
    });

    // Send verification email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email',
      text: `Your verification code is: ${verificationCode}`
    });

    res.json({ message: 'Registration successful. Please check your email for verification code.' });

  } catch (error) {
    console.error('Email Sending Error:', error);

    if (error.responseCode === 535) {
      return res.status(400).json({ message: 'Invalid email credentials. Please check your SMTP settings.' });
    }

    res.status(500).json({ message: 'Server error. Unable to send email.' });
  }
};




const verify = async (req, res) => {
  try {
    const { email, code } = req.body;
    const isVerified = await User.verifyEmail(email, code);
    
    if (isVerified) {
      // Generate JWT token
      const user = await User.findByEmail(email);
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      res.json({ success: true, token, user: { name: user.name, email: user.email } });
    } else {
      res.status(400).json({ success: false, message: 'Invalid verification code' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const{ email } = req.body;
    const user = await User.findByEmail(email);

    // Step 1: Check if user exists
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Step 2: Check if email is verified
    if (user.is_verified) {
      // Generate a new verification code
      const verificationCode = generateVerificationCode();

      // Save the new verification code in the database
      await User.updateVerificationCode(email, verificationCode);

      // Send verification email

      console.log(verificationCode);
      

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify Your Email',
        text: `Your verification code is: ${verificationCode}`
      });
      
      // Inform the user that a new verification code has been sent
      return res.status(200).json({ message: 'Email not verified. A new verification code has been sent to your email.' });
    }

    // Step 3: Verify Password
    // const isMatch = await bcrypt.compare(password, user.password);
    // if (!isMatch) {
    //   return res.status(400).json({ message: 'Invalid credentials' });
    // }

    // Step 4: Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, user: { name: user.name, email: user.email } });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


export default {
  checkUser,
  register,
  verify,
  login
};

