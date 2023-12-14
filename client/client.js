import { io } from "socket.io-client";

let userId;
let recUserId;
let textarea = document.querySelector("#textarea");
let messageArea = document.querySelector(".message_area");
const joinRoomButton = document.getElementById("room-button");
let room;
let hostNmae = "http://chat.devhost.fatherlandancestry.com:3000/";

userId = prompt("Enter a user id");
recUserId = prompt("Enter a receiver id");
room = prompt("Enter a room name");

// Wrap your existing code inside the DOMContentLoaded event
document.addEventListener("DOMContentLoaded", function () {
	// Add the logic to make a GET request to /api/messages
	fetch("http://chat.devhost.fatherlandancestry.com:3000/api/messages", {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			userId: userId, // Include the userId header if needed for authentication
			recieverId: recUserId,
			family: room, // Include the recieverId header if needed for authentication
		},
	})
		.then((response) => response.json())
		.then((messages) => {
			// Handle the response from the server, e.g., display messages in the UI

			console.log("Received messages:", messages);
			// You can add code here to display the received messages in the UI
			messages.forEach((messaging) => {
				let msg = { sender: messaging.sender, message: messaging.content };
				appendMessage(msg);
			});
		})
		.catch((error) => {
			console.error("Error fetching messages:", error);
			// Handle errors if needed
		});

	// Existing code here

	// Add the userId as a header when connecting
	const socket = io("http://chat.devhost.fatherlandancestry.com:3000", {
		transportOptions: {
			polling: {
				extraHeaders: {
					userId: userId,
					recieverId: recUserId,
					family: room,
				},
			},
		},
	});

	socket.on("connect", () => {
		let msg = { sender: userId, message: `connected user ${socket.id}` };
		appendMessage(msg);
	});

	// Add the listener for the "privateMessage" event
	socket.on("privateMessage", (data) => {
		// Handle the private message received from the server
		console.log("Private message received:", data);
		const senderid = data.sender;
		const content = data.message;
		let msgs = { sender: senderid, message: content };
		appendMessage(msgs);
		// You can now update your UI or perform any other actions based on the received message
	});

	textarea.addEventListener("keyup", (e) => {
		if (e.key === "Enter") {
			sendMessage(e.target.value);
			textarea.value = "";
		}
	});

	function sendMessage(msg) {
		fetch("http://chat.devhost.fatherlandancestry.com:3000/api/messages", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				userId: userId,
				recieverId: recUserId,
				family: room, // Fix the typo in "receiverId"
			},
			body: JSON.stringify({ message: msg }),
		})
			.then((response) => {
				if (!response.ok) {
					// Check for non-JSON responses
					if (response.status === 406) {
						return response.text(); // Return the response as plain text
					}
					throw new Error(`HTTP error! Status: ${response.status}`);
				}
				// Parse the response as JSON
				return response.json();
			})
			.then((data) => {
				// Check if data is a string (plain text response)
				JSON.stringify(data);
				// Successfully sent the message
				let msgs = { sender: userId, message: msg };
				//appendMessage(msgs);
			})
			.catch((error) => {
				// Log and handle the error
				console.error("Error sending message:", error.message);
			});
	}

	function appendMessage(msg) {
		let mainDiv = document.createElement("div");
		let className;

		// Add a conditional statement to check the sender value
		if (msg.sender === userId) {
			className = "outgoing";
		} else if (msg.sender === recUserId) {
			className = "incoming";
		}
		mainDiv.classList.add(className, "message");

		let markup = `<h4>${msg.sender}</h4>
       <p>${msg.message}</p>`;

		mainDiv.innerHTML = markup;

		messageArea.appendChild(mainDiv);
	}

	joinRoomButton.addEventListener("click", () => {
		do {
			room = prompt("Enter a room name");
		} while (!room);
		console.log(room);
	});
});
