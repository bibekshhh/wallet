require('dotenv').config();
require('./config/database').connect();

// importing user model
const User = require('./model/user')

const bcrypt = require('bcryptjs')
const auth = require('./middleware/auth')
const jwt = require('jsonwebtoken')
const express = require('express');

const PORT = process.env.PORT || 5050;
const app = express()

app.use(express.json());

//register loigic
app.route('/register').post(async(req, res) => {

    try {

        //get inputs from user
        const { phone, email, password } = req.body;

        //validating user input
        if (!(phone && email && password)) {
            res.status(400).send('All the inputs are required')
        }

        //check if user already existis
        const oldUser = await User.findOne({ wallet_id: phone });

        if (oldUser) {
            return res.status(401).send('User already exists. Please login to continue.')
        }

        //encrypting password
        const encryptedPassword = await bcrypt.hash(password, 10)

        //save user in database
        const user = await User.create({
            wallet_id: phone,
            email: email.toLowerCase(),
            password: encryptedPassword,
            balance: 0
        });

        res.status(201).json(user)
    } catch (error) {
        console.log(error)
    }
});

//login logic goes here
app.route('/login').post(async(req, res) => {
    try {
        //get inputs from user
        const { email, password } = req.body;

        //validating inputs
        if (!(email && password)) {
            res.status(400).send('All the inputs are required')
        }

        //checking user credentials
        const existingUser = await User.findOne({ email })

        console.log(existingUser)

        if (existingUser && (await bcrypt.compare(password, existingUser.password))) {
            //create a token
            const token = jwt.sign({ wallet_id: existingUser.wallet_id, email },
                process.env.ACCESS_TOKEN_KEY, {
                    expiresIn: '1h'
                });

            //USER 
            res.status(200).json({ userDetails: existingUser, accessToken: token })
        }
        res.status(400).send('Invalid Credentials')
    } catch (error) {
        console.log(error)
    }
});

app.route('/welcome').get(auth, async(req, res) => {
    const userEmail = req.existingUser.email;

    const data = await User.findOne({ email: userEmail })
    res.status(200).json({ loggedIn: userEmail, userData: data })
});

app.route('/send').post(auth, async(req, res) => {
    try {
        //get inputs from user
        const { receiver, amount } = req.body;

        //validate inputs
        if (!(receiver && amount)) {
            res.status(400).send('All the inputs are required')
        }

        //  Current logged in userID 
        const loggedInUserEmail = req.existingUser.email;
        const loggedInSender = await User.findOne({ email: loggedInUserEmail })

        //check if receiver exists
        const receiverExists = await User.findOne({ wallet_id: receiver });

        if (!receiverExists) {
            res.status(400).send('Receiver does not exists.')
        }

        //check if user has enoughBalance
        const walletBalance = loggedInSender.balance;

        const newBalanceForSender = loggedInSender.balance - amount;
        const newBalanceForReceiver = receiverExists.balance + amount;

        if ((walletBalance >= amount) && receiverExists) {

            await User.findOneAndUpdate({ email: loggedInUserEmail }, {
                $set: {
                    balance: newBalanceForSender,
                },
                $push: {
                    transactions: {
                        "receiver": receiverExists.wallet_id,
                        "amount": amount,
                        "status": "Sent"
                    }
                }
            });

            await User.findOneAndUpdate({ wallet_id: receiver }, {
                $set: {
                    balance: newBalanceForReceiver,
                },
                $push: {
                    transactions: {
                        "sender": loggedInSender.wallet_id,
                        "amount": amount,
                        "status": "Receieved"
                    }
                }
            });
            res.status(200).send("Transaction Successful")
        }
        res.status(400).send('Insufficient Balance')
    } catch (error) {
        console.log(error)
    }
});

app.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`)
})