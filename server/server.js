const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const mysql = require("mysql2");
const crypto = require("crypto");
const fetch = require("node-fetch");

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
  // Inside authenticateUser middleware
  console.log("authenticateUser middleware executed");

  // ... (rest of the middleware logic)
  const userId = req.header("userId");
  const receiverId = req.header("recieverId");
  const token = req.header("authorization"); // Corrected typo in the header name
  const familyId = req.header("family");
  const dynastyId = req.header("dynasty");

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    // Check if a key already exists

    // Check if the it is a family message or it is a single message, by checking if the familyName is empty
    if (!receiverId) {
      if (!familyId) {
        if (!dynastyId) {
          return res.status(406).json({ message: "No user was provided" });
        }
      }
    } else {
      req.family_input = familyId;
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
    console.log(req.token);

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
let isOnline = false;
let isSocketInitialized = false;

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
          console.log(dynastyData);
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
  ids: String,
  types: String,
  sender: String,
  message: mongoose.Schema.Types.Mixed, // Change the type to Mixed
  receiver: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const FamilyMessage = mongoose.model("FamilyMessage", {
  ids: String,
  types: String,
  familyName: String,
  sender: String,
  senderImage: String,
  message: mongoose.Schema.Types.Mixed, // Change the type to Mixed
  receiver: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const DynastyMessage = mongoose.model("DynastyMessage", {
  ids: String,
  types: String,
  dynastyName: String,
  sender: String,
  senderImage: String,
  message: mongoose.Schema.Types.Mixed, // Change the type to Mixed
  receiver: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const MyChatList = mongoose.model("MyChatList", {
  owner: String,
  connect: String,
  type: String,
  familyName: String,
  dynastyName: String,
  profile_picture_sender: String,
  profile_picture_reciever: String,
  message: mongoose.Schema.Types.Mixed, // Change the type to Mixed
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
        ids: message.ids,
        type: message.type,
        sender: message.sender,
        receiver: message.receiver,
        message: decryptMessage(message.message), // Decrypt the message content
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

    // Emit the message to the DM room
    const normalizedIds = [senderId, "single", receiverId].sort();
    const dmChat = normalizedIds.join("");

    const newMessage = new Message({
      ids: `${parseInt(senderId, 10) + parseInt(receiverId, 10)}`,
      types: "single",
      sender: senderId,
      message: content,
      receiver: receiverId,
      timestamp: Date.now(),
    });

    await newMessage.save();
    const profile_pics_sender = await getUserById(parseInt(senderId, 10)).then(
      (data) => {
        return data.profile_picture;
      }
    );

    const profile_pics_reciever = await getUserById(
      parseInt(receiverId, 10)
    ).then((data) => {
      return data.profile_picture;
    });
    // update the mychat list
    const filter = {
      $or: [
        { owner: senderId, connect: receiverId, type: "single" },
        { owner: receiverId, connect: senderId, type: "single" },
      ],
    };
    const replacement = {
      // Include the fields you want to update and their new values
      // For example, updating the 'message' field
      $set: {
        owner: senderId,
        connect: receiverId,
        message: content,
        profile_picture_sender: profile_pics_sender,
        profile_picture_reciever: profile_pics_reciever,
        // Include other fields to update as needed
      },
    };
    // Use updateOne to replace the document with the new data
    try {
      // Use updateOne to replace the document with the new data
      const result = await MyChatList.updateOne(filter, replacement);

      console.log("Update Result:", result);

      if (result.modifiedCount > 0) {
        console.log("Last chat list updated successfully.");
      } else {
        const newMyChatList = new MyChatList({
          owner: senderId,
          connect: receiverId,
          type: "single",
          profile_picture_sender: profile_pics_sender,
          profile_picture_reciever: profile_pics_reciever,
          message: content, // Change the type to Mixed
          timestamp: Date.now(),
        });

        await newMyChatList.save();
        console.log(`Saved new data did not update`);
        console.log("No documents matched the filter criteria.");
      }
    } catch (error) {
      console.error("Error during update:", error);
    }

    io.to(dmChat).emit("privateMessage", {
      ids: `${parseInt(senderId, 10) + parseInt(receiverId, 10)}`,
      types: "single",
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
    const familyId = req.header("family");
    const messages = await FamilyMessage.find({
      $or: [{ receiver: familyId }, { sender: familyId }],
    }).sort({ timestamp: 1 }); // Sort messages by timestamp in ascending order

    const formattedMessages = messages.map((message) => {
      return {
        ids: message.ids,
        types: message.type,
        sender: message.sender,
        senderImage: message.senderImage,
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
    const tokens = req.header("authorization");

    if (!tokens) {
      return res
        .status(500)
        .json({ message: "Authentication token is needed" });
    }
    const familyId = req.header("family");

    // Fetch family data
    const familyResponse = await fetch(
      "https://dev.fatherlandancestry.com/api/v1/joined-family",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: tokens,
        },
      }
    );

    if (!familyResponse.ok) {
      // Handle error
      throw new Error(`HTTP error! Status: ${familyResponse.status}`);
    }

    const familyData = await familyResponse.json();

    // Set req.familyDetails
    const familyDetails = familyData.map((item) => ({
      id: item.family.id,
      name: item.family.name,
      pics: item.family.profile_picture,
    }));

	console.log(familyDetails);

    const senderInfo = req.senderInfo;

    const senderId = senderInfo.id;
    const content = encryptMessage(req.body.message);

    const isIdInArray = familyDetails.some(
      (item) => item.id === parseInt(familyId, 10)
    );

    const profile_pics_sender = await getUserById(parseInt(senderId, 10)).then(
      (data) => {
        return data.profile_picture;
      }
    );
    if (isIdInArray) {
      // check if the family id is in the data and get the picture and name
      const familyInfo = familyDetails.find(
        (item) => item.id === parseInt(familyId, 10)
      );
      const familyName = familyInfo.name;
      const profile_pics_reciever = familyInfo.pics;
	console.log(`${familyInfo} + ${profile_picd_reciever}`)
      if (familyInfo) {
        const newFamilyMessage = new FamilyMessage({
          ids: `${parseInt(senderId, 10) + parseInt(familyId, 10)}`,
          types: "family",
          familyName: familyName,
          sender: senderId,
          senderImage: profile_pics_sender,
          message: content,
          receiver: familyId,
          timestamp: Date.now(),
        });
        await newFamilyMessage.save();
        // update the mychat list
        const filter = { owner: familyId, type: "family" };
        const replacement = {
          // Include the fields you want to update and their new values
          // For example, updating the 'message' field
          $set: {
            owner: familyId,
            connect: senderId,
            familyName: familyName,
            message: content,
            profile_picture_sender: profile_pics_sender,
            profile_picture_reciever: profile_pics_reciever,
            // Include other fields to update as needed
          },
        };
        // Use updateOne to replace the document with the new data
        try {
          // Use updateOne to replace the document with the new data
          const result = await MyChatList.updateOne(filter, replacement);

          console.log("Update Result:", result);

          if (result.modifiedCount > 0) {
            console.log("Last chat list updated successfully.");
          } else {
            const newMyChatList = new MyChatList({
              owner: familyId,
              connect: senderId,
              type: "family",
              familyName: familyName,
              profile_picture_sender: profile_pics_reciever,
              profile_picture_reciever: profile_pics_sender,
              message: content, // Change the type to Mixed
              timestamp: Date.now(),
            });

            await newMyChatList.save();
            console.log(`Saved new data did not update`);
            console.log("No documents matched the filter criteria.");
          }
        } catch (error) {
          console.error("Error during update:", error);
        }

        //Emit to family sockets
        const normalizedIds = [senderId, "family", familyId].sort();
        const familyDmChat = normalizedIds.join("");

        io.to(familyDmChat).emit("familyMessage", {
          ids: `${parseInt(senderId, 10) + parseInt(familyId, 10)}`,
          types: "family",
          sender: senderId,
          receiver: familyId,
	  profile_pics:profile_pics_sender,
          message: decryptMessage(content),
          timestamp: newFamilyMessage.timestamp, // Include the timestamp in the emitted message
        });
      } else {
        res.status(401).json({ message: "Unautorized" });
      }
    } else {
      res.status(401).json({ message: "Unautorized" });
    }

    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/***************************************** END *****************************************/

/************************************* Dynasty message **********************************/

router.get("/dynasty-messages", async (req, res) => {
  try {
    const dynastyId = req.header("dynasty");
    const messages = await DynastyMessage.find({
      $or: [{ sender: dynastyId }, { receiver: dynastyId }],
    }).sort({ timestamp: 1 }); // Sort messages by timestamp in ascending order

    const formattedMessages = messages.map((message) => {
      return {
        ids: message.ids,
        types: message.type,
        sender: message.sender,
        senderImage: message.senderImage,
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
	const tokens = req.header("authorization");

    if (!tokens) {
      return res
        .status(500)
        .json({ message: "Authentication token is needed" });
    }
    const dynastyId = req.header("dynasty");
    const senderInfo = req.senderInfo;
    const senderId = senderInfo.id;
    const content = encryptMessage(req.body.message);

	// Fetch family data
    const dynastyResponse = await fetch(
		`https://dev.fatherlandancestry.com/api/v1/joined-dynasty/${senderId}`,
		{
		  method: "GET",
		  headers: {
			"Content-Type": "application/json",
			Authorization: tokens,
		  },
		}
	  );
  
	  if (!dynastyResponse.ok) {
		// Handle error
		throw new Error(`HTTP error! Status: ${familyResponse.status}`);
	  }
  
	  const dynastyData = await dynastyResponse.json();
  
	  // Set req.dynastyDetails
	  const dynastyDetails = dynastyData.map((item) => ({
		id: item.Dynasty.id,
		name: item.Dynasty.name,
		pics: item.Dynasty.profile_picture,
	  }));
		console.log(dynastyDetails);

	  const isIdInArray = dynastyDetails.some(
		(item) => item.id === parseInt(dynastyId, 10)
	  );

	  const profile_pics_sender = await getUserById(parseInt(senderId, 10)).then(
		(data) => {
		  return data.profile_picture;
		}
	  );

	  if (isIdInArray) {
		// check if the dynasty id is in the data and get the picture and name
		const dynastyInfo = dynastyDetails.find(
		  (item) => item.id === parseInt(dynastyId, 10)
		);
		const dynastyName = dynastyInfo.name;
		const profile_pics_reciever = dynastyInfo.pica;
		console.log(`${dynastyName} + ${profile_pics_reciever}`);
		if (dynastyInfo) {
		  const newDynastyMessage = new DynastyMessage({
			ids: `${parseInt(senderId, 10) + parseInt(dynastyId, 10)}`,
			types: "dynasty",
			dynastyName: dynastyName,
			sender: senderId,
			senderImage: profile_pics_sender,
			message: content,
			receiver: dynastyId,
			timestamp: Date.now(),
		  });
		  await newDynastyMessage.save();
		  // update the mychat list
		  const filter = { owner: dynastyId, type: "dynasty" };
		  const replacement = {
			// Include the fields you want to update and their new values
			// For example, updating the 'message' field
			$set: {
			  owner: dynastyId,
			  connect: senderId,
			  dynastyName: dynastyName,
			  message: content,
			  profile_picture_sender: profile_pics_reciever,
			  profile_picture_reciever: profile_pics_sender,
			  // Include other fields to update as needed
			},
		  };
		  // Use updateOne to replace the document with the new data
		  try {
			// Use updateOne to replace the document with the new data
			const result = await MyChatList.updateOne(filter, replacement);
			console.log("Update Result:", result);
  
			if (result.modifiedCount > 0) {
			  console.log("Last chat list updated successfully.");
			} else {
			  const newMyChatList = new MyChatList({
				owner: dynastyId,
				connect: senderId,
				type: "dynasty",
				dynastyName: dynastyName,
				profile_picture_sender: profile_pics_reciever,
				profile_picture_reciever: profile_pics_sender,
				message: content, // Change the type to Mixed
				timestamp: Date.now(),
			  });
  
			  await newMyChatList.save();
			  console.log(`Saved new data did not update`);
			  console.log("No documents matched the filter criteria.");
			}
		  } catch (error) {
			console.error("Error during update:", error);
		  }
  
		  //Emit to dynasty sockets
		  const normalizedIds = [senderId, "dynasty", dynastyId].sort();
		  const dynastyDmChat = normalizedIds.join("");
  
		  io.to(dynastyDmChat).emit("dynastyMessage", {
			ids: `${parseInt(senderId, 10) + parseInt(dynastyId, 10)}`,
			types: "dynasty",
			sender: senderId,
			profile_pics:profile_pics_reciever,
			receiver: dynastyId,
			message: decryptMessage(content),
			timestamp: newDynastyMessage.timestamp, // Include the timestamp in the emitted message
		  });
		} else {
		  res.status(401).json({ message: "Unautorized" });
		}
	  } else {
		res.status(401).json({ message: "Unautorized" });
	  }
  
	  res.sendStatus(200);
  } catch (err) {
    console.error("Error posting message:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/*************************************** Get all messages and save to last massage db *******************/

router.get("/last-messages-list", async (req, res) => {
  try {
    const senderId = req.senderInfo.id;

    const messages = await MyChatList.find({
      $or: [{ owner: senderId }, { connect: senderId }],
    }).sort({ timestamp: -1 });

    const formattedMessages = await Promise.all(
      messages.map(async (message) => {
        let receiverName;
        if (parseInt(message.owner, 10) != senderId) {
          receiverName = await getUserById(parseInt(message.owner, 10)).then(
            (data) => {
              return data.name;
            }
          );
        } else {
          receiverName = await getUserById(parseInt(message.connect, 10)).then(
            (data) => {
              return data.name;
            }
          );
        }
        return {
          ids: message.ids,
          types: message.type,
          owner: message.owner,
          connect: message.connect,
          connect_name: receiverName,
          profile_picture_sender: message.profile_picture_sender,
          profile_picture_reciever: message.profile_picture_reciever,
          content: decryptMessage(message.message),
          timestamp: message.timestamp,
        };
      })
    );
    res.json(formattedMessages);
  } catch (err) {
    console.error("Error retrieving messages:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/*************************************** END ******************************************/

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
  //saveEncryptedData(encryptedData);

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
