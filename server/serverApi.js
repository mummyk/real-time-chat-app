const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const mysql = require("mysql2");
const crypto = require("crypto");

const app = express();
const router = express.Router();
const server = http.createServer(app);
const io = socketIo(server, {
	cors: {
		origin: "http://localhost:8080", // Allow requests from this origin
		methods: ["GET", "POST"],
	},
});
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Now you can use the key for encryption or decryption
// ...

// Middleware for authentication
const authenticateUser = async (req, res, next) => {
	const userId = req.header("userId");
	const receiverId = req.header("recieverId"); // Corrected typo in the header name

	if (!receiverId) {
		return res.status(406).json({ message: "No user with that id" });
	}

	if (!userId) {
		return res.status(401).json({ message: "Unauthorized: No token provided" });
	}

	try {
		// Check if a key already exists

		const sender = await getUserById(userId);
		const receiver = await getUserById(receiverId);

		const senderInfo = extractUserInfo(sender, ["id", "name", "email"]);
		const receiverInfo = extractUserInfo(receiver, ["id", "name", "email"]);

		req.senderInfo = senderInfo;
		req.receiverInfo = receiverInfo;

		next();
	} catch (err) {
		console.error("Error:", err);
		res.status(500).json({ message: "Error getting user data" });
	}
};

router.use(authenticateUser);

const sockets = {};
let isOnline = false;
let isSocketInitialized = false;

io.on("connection", (socket) => {
	console.log(`A user with id=${socket.id} connected`);

	const userId = socket.handshake.headers.userid;
	const receiverId = socket.handshake.headers.recieverid;

	console.log(userId);
	// Add the socket to the sockets object
	sockets[userId] = socket.id;
	console.log(`Socket for user ${userId} added to sockets object`);
	console.log(sockets);

	if (sockets[userId]) {
		isOnline = true;
	}

	if (sockets[userId] && sockets[receiverId]) {
		// Normalize the order of IDs and concatenate
		const normalizedIds = [userId, receiverId].sort();
		const dmChat = normalizedIds.join("");

		socket.join(dmChat);
	}

	isSocketInitialized = true;

	socket.on("disconnect", () => {
		console.log(`User ${socket.id}  disconnected`);
		const userId = Object.keys(sockets).find((key) => sockets[key] === socket);
		if (userId) {
			delete sockets[userId];
			console.log(`User ${userId} disconnected`);
		}
	});
});

// Database connection for MongoDB
const dbUrl = "mongodb://127.0.0.1:27017/realtime_chat";
mongoose.connect(dbUrl);
mongoose.connection
	.once("open", function () {
		console.log("Database connected successfully");
	})
	.on("error", function (err) {
		console.error("Database connection error:", err);
	});

const Message = mongoose.model("Message", {
	sender: String,
	message: mongoose.Schema.Types.Mixed, // Change the type to Mixed
	receiver: String,
	timestamp: {
		type: Date,
		default: Date.now,
	},
});

// Function to retrieve or generate key (replace with your logic)
const retrieveOrGenerateKey = () => {
	// Replace this with your actual key retrieval or generation logic
	return crypto.randomBytes(32);
};

router.get("/messages", async (req, res) => {
	try {
		const receiverId = req.receiverInfo.id;
		const senderId = req.senderInfo.id;
		const messages = await Message.find({
			$or: [
				{ sender: senderId, receiver: receiverId },
				{ sender: receiverId, receiver: senderId },
			],
		}).sort({ timestamp: 1 }); // Sort messages by timestamp in ascending order

		const formattedMessages = messages.map((message) => {
			return {
				sender: message.sender,
				receiver: message.receiver,
				content: decryptMessage(message.message), // Decrypt the message content
				timestamp: message.timestamp,
			};
		});

		res.json(formattedMessages);
	} catch (err) {
		console.error("Error retrieving messages:", err);
		res.status(500).json({ message: "Internal Server Error" });
	}
});

router.post("/messages", async (req, res) => {
	// Check if the socket initialization has occurred
	if (!isSocketInitialized) {
		return res.status(500).json({ message: "Socket not initialized yet" });
	}

	try {
		const senderInfo = req.senderInfo;
		const receiverInfo = req.receiverInfo;

		const senderId = senderInfo.id;
		const receiverId = receiverInfo.id;
		const content = encryptMessage(req.body.message);

		const newMessage = new Message({
			sender: senderId,
			message: content,
			receiver: receiverId,
			timestamp: Date.now(),
		});

		await newMessage.save();

		// Emit the message to the DM room
		const normalizedIds = [senderId, receiverId].sort();
		const dmChat = normalizedIds.join("");
		io.to(dmChat).emit("privateMessage", {
			sender: senderId,
			receiver: receiverId,
			message: decryptMessage(content),
			timestamp: newMessage.timestamp, // Include the timestamp in the emitted message
		});

		res.sendStatus(200);
	} catch (err) {
		console.error("Error posting message:", err);
		res.status(500).json({ message: "Internal Server Error" });
	}
});

function getUserById(userId) {
	return new Promise((resolve, reject) => {
		const connection = mysql.createConnection({
			host: "157.90.167.161",
			user: "devancestry",
			password: "6B37rhSkPMWuDOR",
			database: "devancestry",
		});

		connection.connect((err) => {
			if (err) {
				reject("Error connecting to MySQL");
			} else {
				connection.query(
					"SELECT * FROM users WHERE id = ?",
					[userId],
					(queryError, results) => {
						connection.end(); // Close the connection

						if (queryError) {
							reject("Error executing SQL query");
						}

						if (results.length > 0) {
							resolve(results[0]);
						} else {
							reject("User not found");
						}
					}
				);
			}
		});
	});
}

function extractUserInfo(user, fields) {
	const userInfo = {};
	fields.forEach((field) => {
		userInfo[field] = user[field];
	});
	return userInfo;
}

// Function to encrypt a message
const encryptMessage = (message) => {
	const key = retrieveOrGenerateKey();
	const iv = crypto.randomBytes(16); // Use a fixed IV length (16 bytes for AES-256-CBC)
	const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
	let encrypted = cipher.update(message, "utf-8", "hex");
	encrypted += cipher.final("hex");

	// Save the key and IV along with the encrypted data to MongoDB
	const encryptedData = {
		key: key.toString("hex"),
		iv: iv.toString("hex"),
		content: encrypted,
	};

	// Save encryptedData to MongoDB
	// (Replace this with your actual MongoDB save logic)
	// MongoDB save logic should check if the key already exists and update if necessary
	// This example assumes a simple array structure for storing keys and encrypted data
	// You should replace this with your actual MongoDB schema and save logic
	saveEncryptedData(encryptedData);

	return encryptedData; // Return the encrypted data object
};

// Function to decrypt a message
const decryptMessage = (encryptedData) => {
	// Parse the key, IV, and content from the saved message
	const key = Buffer.from(encryptedData.key, "hex");
	const iv = Buffer.from(encryptedData.iv, "hex");
	const content = encryptedData.content;

	// Use the key and IV for decryption
	const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
	let decrypted = decipher.update(content, "hex", "utf-8");
	decrypted += decipher.final("utf-8");

	return decrypted;
};

// Function to save encrypted data to MongoDB
const saveEncryptedData = async (encryptedData) => {
	// Replace this with your actual MongoDB save logic
	// MongoDB save logic should check if the key already exists and update if necessary
	// This example assumes a simple array structure for storing keys and encrypted data
	// You should replace this with your actual MongoDB schema and save logic
	// For example:
	// YourModel.updateOne({ key: encryptedData.key }, encryptedData, { upsert: true })
	// Function to save encrypted data to MongoDB

	try {
		// Use findOneAndUpdate to check if the key already exists and update if necessary
		await Message.findOneAndUpdate(
			{ "message.key": encryptedData.key },
			{ $set: { message: encryptedData } },
			{ upsert: true }
		);
		console.log("Encrypted data saved to MongoDB:", encryptedData);
	} catch (error) {
		console.error("Error saving encrypted data to MongoDB:", error);
	}
};

// Use the router for all routes starting with '/api'
app.use("/api", router);

// Serve the socket.io.js file
app.get("/socket.io", (req, res) => {
	res.sendFile(__dirname + "/node_modules/socket.io/client-dist/socket.io.js");
});

// Serve static files
app.use(express.static(__dirname));

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
