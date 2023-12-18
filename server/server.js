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

/****************************************** Middleware for authentication *************************************/
const authenticateUser = async (req, res, next) => {
	const userId = req.header("userId");
	const receiverId = req.header("recieverId"); // Corrected typo in the header name
	const familyId = req.header("family");

	if (!userId) {
		return res.status(401).json({ message: "Unauthorized: No token provided" });
	}

	try {
		// Check if a key already exists

		// Check if the it is a family message or it is a single message, by checking if the familyName is empty
		if (receiverId === "") {
			getFamilyByName(familyId)
				.then(async (family) => {
					const familyid = extractUserInfo(family, ["id", "name"]);
					req.familyDetails = familyid;
					getUserfromfamily(familyid.id)
						.then((userFamily) => {
							const userfamilyDetail = extractUserInfo(userFamily, [
								"id",
								"user_id",
								"family_id",
								"status",
							]);
							console.log(userfamilyDetail);
							req.userfamilyDetails = userfamilyDetail;
						})
						.catch((error) => {
							console.error(error);
						}); // This should log the family details if found
				})
				.catch((error) => {
					console.error(error); // Handle the error if family is not found or there is an issue
				});
		} else if (!receiverId) {
			return res.status(406).json({ message: "No user with that id" });
		} else {
			const receiver = await getUserById(receiverId);
			const receiverInfo = extractUserInfo(receiver, ["id", "name", "email"]);
			req.receiverInfo = receiverInfo;
		}

		const sender = await getUserById(userId);
		//const receiver = await getUserById(receiverId);

		const senderInfo = extractUserInfo(sender, ["id", "name", "email"]);
		//const receiverInfo = extractUserInfo(receiver, ["id", "name", "email"]);
		req.senderInfo = senderInfo;
		//req.receiverInfo = receiverInfo;

		next();
	} catch (err) {
		console.error("Error:", err);
		res.status(500).json({ message: "Error getting user data" });
	}
};

/**************************************  END *********************************************/

// Connecting to all route
router.use(authenticateUser);

/***************************************** Socket start *****************************************/
const sockets = {};
let familySocketList = [];
let myFamily = [];
let isOnline = false;
let isSocketInitialized = false;
maxRetries = 3;
let retries = 0;

io.on("connection", (socket) => {
	console.log(`A user with id=${socket.id} connected`);

	const userId = socket.handshake.headers.userid;
	const token = socket.handshake.headers.authorization;

	if (userId) {
		// Add the socket to the sockets object
		sockets[userId] = socket.id;
		console.log(`Socket for user ${userId} added to sockets object`);
		console.log(sockets);

		// Check if the user is online
		if (sockets[userId]) {
			isOnline = true;
			socket.emit("isOnline", { user: userId });
		}

		// // Get all my family family in the db

		fetch("https://dev.fatherlandancestry.com/api/v1/joined-family", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: token,
			},
		})
			.then((response) => {
				if (!response.ok) {
					if (response.status === 406) {
						return response.text();
					}
					throw new Error(`HTTP error! Status: ${response.status}`);
				}
				return response.json();
			})
			.then((data) => {
				if (Array.isArray(data)) {
					// Extract "id" and "name" values from each family object
					const familyData = data.map((item) => ({
						id: item.family.id,
						name: item.family.name,
					}));
					console.log({ familyData });
					// Join socket rooms based on family data
					familyData.forEach((family) => {
						// Normalize the order of IDs and concatenate
						const normalizedIds = [userId, "family", family.id].sort();
						const familyDmChat = normalizedIds.join("");

						socket.join(familyDmChat);
					});
					return { familyData }; // Return as JSON
				} else {
					throw new Error("Invalid response format");
				}
			})
			.catch((error) => {
				console.error("Error fetching family data:", error.message);
				throw error; // Re-throw the error
			});

		// Get usert dynasty
		fetch(
			`https://dev.fatherlandancestry.com/api/v1/joined-dynasty/${userId}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: token,
				},
			}
		)
			.then((response) => {
				if (!response.ok) {
					if (response.status === 406) {
						return response.text();
					}
					throw new Error(`HTTP error! Status: ${response.status}`);
				}
				return response.json();
			})
			.then((data) => {
				if (Array.isArray(data)) {
					// Extract "id" and "name" values from each family object
					const dynastyData = data.map((item) => ({
						id: item.Dynasty.id,
						name: item.Dynasty.name,
					}));
					// Join socket rooms based on family data
					dynastyData.forEach((dynasty) => {
						// Normalize the order of IDs and concatenate
						const normalizedIds = [userId, "dynasty", dynasty.id].sort();
						const dynastyDmChat = normalizedIds.join("");

						socket.join(dynastyDmChat);
					});
					console.log({ dynastyData });
					return { dynastyData }; // Return as JSON
				} else {
					console.log(data);
				}
			})
			.catch((error) => {
				console.error("Error fetching dynasty data:", error.message);
				throw error;
			});
	}

	getAllUsers().then((data) => {
		const userIds = data.map((item) => item.id);
		console.log(userIds);
		userIds.forEach((socksUserId) => {
			if (socksUserId !== userId) {
				// Normalize the order of IDs and concatenate
				const normalizedIds = [userId, "single", socksUserId].sort();
				const dmChat = normalizedIds.join("");

				socket.join(dmChat);
			}
		});
	});

	// if (sockets[userId] && sockets[receiverId]) {
	// 	// Normalize the order of IDs and concatenate
	// 	const normalizedIds = [userId, "single", receiverId].sort();
	// 	const dmChat = normalizedIds.join("");
	// 	console.log(dmChat);
	// 	socket.join(dmChat);
	// }

	isSocketInitialized = true;

	socket.on("disconnect", () => {
		console.log(`User ${socket.id}  disconnected`);
		const disconnectedUserId = Object.keys(sockets).find(
			(key) => sockets[key] === socket
		);
		if (disconnectedUserId) {
			delete sockets[userId];
			isOnline = false;
			console.log(`User ${userId} disconnected`);
		}
	});
});

/***************************************** END *****************************************/

/***************************************** All database connections *****************************************/

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

const FamilyMessage = mongoose.model("FamilyMessage", {
	sender: String,
	message: mongoose.Schema.Types.Mixed, // Change the type to Mixed
	receiver: String,
	timestamp: {
		type: Date,
		default: Date.now,
	},
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

function getAllUsers() {
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
					"SELECT * FROM users",

					(queryError, results) => {
						connection.end(); // Close the connection

						if (queryError) {
							reject("Error executing SQL query");
						}

						if (results.length > 0) {
							//resolve(results[0]);

							resolve(results);
						} else {
							reject("User not found");
						}
					}
				);
			}
		});
	});
}

// Function to retrieve or generate key (replace with your logic)
const retrieveOrGenerateKey = () => {
	// Replace this with your actual key retrieval or generation logic
	return crypto.randomBytes(32);
};

/***************************************** END *****************************************/

/**************************** Single user message **************************/

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
		const normalizedIds = [senderId, "single", receiverId].sort();
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

/***************************************** END *****************************************/

/************************************* Family message **********************************/

router.get("/family-messages", async (req, res) => {
	try {
		const familyInfo = req.familyDetails;
		const receiverId = familyInfo.name;
		const senderId = req.senderInfo.id;
		const messages = await FamilyMessage.find({
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

router.post("/family-messages", async (req, res) => {
	// Check if the socket initialization has occurred
	if (!isSocketInitialized) {
		return res.status(500).json({ message: "Socket not initialized yet" });
	}

	try {
		const senderInfo = req.senderInfo;
		const receiverInfo = req.receiverInfo;
		const familyInfo = req.familyDetails;

		const senderId = senderInfo.id;
		const receiverId = receiverInfo.id;
		const content = encryptMessage(req.body.message);

		const newFamilyMessage = new FamilyMessage({
			sender: senderId,
			message: content,
			receiver: familyInfo.name,
			timestamp: Date.now(),
		});

		await newFamilyMessage.save();

		//Emit to family sockets
		const familnameId = await getFamilyById(familyInfo.id);
		const normalizedIds = [userId, familnameId].sort();
		const familyDmChat = normalizedIds.join("");

		io.to(familyDmChat).emit("family chat message", {
			sender: senderId,
			receiver: familyInfo.name,
			message: decryptMessage(content),
			timestamp: newFamilyMessage.timestamp, // Include the timestamp in the emitted message
		});

		res.sendStatus(200);
	} catch (err) {
		console.error("Error posting message:", err);
		res.status(500).json({ message: "Internal Server Error" });
	}
});

/***************************************** END *****************************************/

/************************************* Dynasty message **********************************/

router.get("/dynasty-messages", async (req, res) => {
	try {
		const dynastyInfo = req.familyDetails;
		const receiverId = familyInfo.name;
		const senderId = req.senderInfo.id;
		const messages = await FamilyMessage.find({
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

router.post("/dynasty-messages", async (req, res) => {
	// Check if the socket initialization has occurred
	if (!isSocketInitialized) {
		return res.status(500).json({ message: "Socket not initialized yet" });
	}

	try {
		const senderInfo = req.senderInfo;
		const receiverInfo = req.receiverInfo;
		const familyInfo = req.familyDetails;

		const senderId = senderInfo.id;
		const receiverId = receiverInfo.id;
		const content = encryptMessage(req.body.message);

		const newFamilyMessage = new FamilyMessage({
			sender: senderId,
			message: content,
			receiver: familyInfo.name,
			timestamp: Date.now(),
		});

		await newFamilyMessage.save();

		//Emit to family sockets
		const familnameId = await getFamilyById(familyInfo.id);
		const normalizedIds = [userId, familnameId].sort();
		const familyDmChat = normalizedIds.join("");

		io.to(dynastyDmChat).emit("dynasty chat message", {
			sender: senderId,
			receiver: familyInfo.name,
			message: decryptMessage(content),
			timestamp: newFamilyMessage.timestamp, // Include the timestamp in the emitted message
		});

		res.sendStatus(200);
	} catch (err) {
		console.error("Error posting message:", err);
		res.status(500).json({ message: "Internal Server Error" });
	}
});

/*************************************** Get all user id, names, and images ******************************/

router.get("/all-users", async (req, res) => {
	getAllUsers().then((data) => {
		const userDetails = data.map((item) => {
			// Check if profile_picture is null
			const profilePicture = item.profile_picture
				? "https://dev.fatherlandancestry.com" + item.profile_picture
				: null;

			return {
				id: item.id,
				name: item.name,
				profile_picture: profilePicture,
			};
		});
		res.json(userDetails); // Assuming you want to send the userDetails as JSON response
	});
});

/*************************************** End *******************************************/

/***************************************** END *****************************************/

/***************************************** Function for handling repeated actions *****************************************/

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
/***************************************** END *****************************************/

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
server.listen(PORT, "0.0.0.0", () => {
	console.log(`Server is running on port ${PORT}`);
});
