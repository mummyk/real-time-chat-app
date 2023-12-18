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
	fetch("http://localhost:3000/api/messages", {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			userId: userId, // Include the userId header if needed for authentication
			recieverId: recUserId,
			family: room, // Include the recieverId header if needed for authentication
			Authorization:
				"Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiNDg3YWQ3MjMwZWVkY2M0ZjMzOWY3ZTJhZGEwYTc0ZGIwMTFiMTk5NTI2OThkYWRmNGQ1OGNmODU4N2MyNmM4ODAxMjExMTBmMzA0YTEwMjciLCJpYXQiOjE3MDI2MzM3ODcuNzE3MjQ3LCJuYmYiOjE3MDI2MzM3ODcuNzE3MjQ5LCJleHAiOjE3MzQyNTYxODcuNzE2NDEyLCJzdWIiOiIzMiIsInNjb3BlcyI6W119.lrlgNLaK16LM4njKrvXQ-ARgG8n9MLX_3smPHjG6ZXiaacwVQQFRugsE15E1i4VWjGtLR7CoSAquGp8WoADBh3P5aSEMHXyCZcMOuD7L-q2iztDpJAr0-qj67lfl0d_MJBjGjrdFMphpGhulKHWth89AGSMznWDhtSHPLIxM7vbpskYf_PzlxQQ_nDoIECHQxEalpQbYqVJSyrP93DAcazUhnWCYBZ7YnREsrdYa5WiY0VuOLguYEk8K7Y6ETmRdMSEVZAr3VK3NJnrwPHP8SZONqKbo8FncT17loPEH8LN-jrguVgDCUe3genNI5wWVGJFqWVy8RUMf2Sg7C3_7CYcZjUrvz0DRrx4DuKcTndBpBob69xdAzjDFj9gQkX-voAEhoeiF6IbMzPWO-hs6ne9veqQr2lHIun8nvp4dTVc-sn4DmyelkyZL13RsdM-GKLnVgytrlvhauuLY8ZK0Mmwce6aPfzyp0yCa4e3JWvxNZq6hUvVD0X8BGL-Tht3h1KjWPpIOujPXMRoMux6F6TpGpl8-1TbBRdp6C7MGvN22c3Kgf8UrjaBpXAeieh1_Ni2dGsT_p6t0UV1PsmXokOQjzGCkDUFeURMTO0vn4QbAsjhliWixf6JE7atDMQpWvZpkQkciHvyRI9gbpORIh_qzsjsS-VPRgzwMznnM7nA",
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
	const socket = io("http://localhost:3000", {
		transportOptions: {
			polling: {
				extraHeaders: {
					userId: userId,
					//recieverId: recUserId,
					Authorization:
						"Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiNDg3YWQ3MjMwZWVkY2M0ZjMzOWY3ZTJhZGEwYTc0ZGIwMTFiMTk5NTI2OThkYWRmNGQ1OGNmODU4N2MyNmM4ODAxMjExMTBmMzA0YTEwMjciLCJpYXQiOjE3MDI2MzM3ODcuNzE3MjQ3LCJuYmYiOjE3MDI2MzM3ODcuNzE3MjQ5LCJleHAiOjE3MzQyNTYxODcuNzE2NDEyLCJzdWIiOiIzMiIsInNjb3BlcyI6W119.lrlgNLaK16LM4njKrvXQ-ARgG8n9MLX_3smPHjG6ZXiaacwVQQFRugsE15E1i4VWjGtLR7CoSAquGp8WoADBh3P5aSEMHXyCZcMOuD7L-q2iztDpJAr0-qj67lfl0d_MJBjGjrdFMphpGhulKHWth89AGSMznWDhtSHPLIxM7vbpskYf_PzlxQQ_nDoIECHQxEalpQbYqVJSyrP93DAcazUhnWCYBZ7YnREsrdYa5WiY0VuOLguYEk8K7Y6ETmRdMSEVZAr3VK3NJnrwPHP8SZONqKbo8FncT17loPEH8LN-jrguVgDCUe3genNI5wWVGJFqWVy8RUMf2Sg7C3_7CYcZjUrvz0DRrx4DuKcTndBpBob69xdAzjDFj9gQkX-voAEhoeiF6IbMzPWO-hs6ne9veqQr2lHIun8nvp4dTVc-sn4DmyelkyZL13RsdM-GKLnVgytrlvhauuLY8ZK0Mmwce6aPfzyp0yCa4e3JWvxNZq6hUvVD0X8BGL-Tht3h1KjWPpIOujPXMRoMux6F6TpGpl8-1TbBRdp6C7MGvN22c3Kgf8UrjaBpXAeieh1_Ni2dGsT_p6t0UV1PsmXokOQjzGCkDUFeURMTO0vn4QbAsjhliWixf6JE7atDMQpWvZpkQkciHvyRI9gbpORIh_qzsjsS-VPRgzwMznnM7nA",
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
		fetch("http://localhost:3000/api/messages", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				userId: userId,
				recieverId: recUserId,
				family: room, // Fix the typo in "receiverId"
				Authorization:
					"Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiNDg3YWQ3MjMwZWVkY2M0ZjMzOWY3ZTJhZGEwYTc0ZGIwMTFiMTk5NTI2OThkYWRmNGQ1OGNmODU4N2MyNmM4ODAxMjExMTBmMzA0YTEwMjciLCJpYXQiOjE3MDI2MzM3ODcuNzE3MjQ3LCJuYmYiOjE3MDI2MzM3ODcuNzE3MjQ5LCJleHAiOjE3MzQyNTYxODcuNzE2NDEyLCJzdWIiOiIzMiIsInNjb3BlcyI6W119.lrlgNLaK16LM4njKrvXQ-ARgG8n9MLX_3smPHjG6ZXiaacwVQQFRugsE15E1i4VWjGtLR7CoSAquGp8WoADBh3P5aSEMHXyCZcMOuD7L-q2iztDpJAr0-qj67lfl0d_MJBjGjrdFMphpGhulKHWth89AGSMznWDhtSHPLIxM7vbpskYf_PzlxQQ_nDoIECHQxEalpQbYqVJSyrP93DAcazUhnWCYBZ7YnREsrdYa5WiY0VuOLguYEk8K7Y6ETmRdMSEVZAr3VK3NJnrwPHP8SZONqKbo8FncT17loPEH8LN-jrguVgDCUe3genNI5wWVGJFqWVy8RUMf2Sg7C3_7CYcZjUrvz0DRrx4DuKcTndBpBob69xdAzjDFj9gQkX-voAEhoeiF6IbMzPWO-hs6ne9veqQr2lHIun8nvp4dTVc-sn4DmyelkyZL13RsdM-GKLnVgytrlvhauuLY8ZK0Mmwce6aPfzyp0yCa4e3JWvxNZq6hUvVD0X8BGL-Tht3h1KjWPpIOujPXMRoMux6F6TpGpl8-1TbBRdp6C7MGvN22c3Kgf8UrjaBpXAeieh1_Ni2dGsT_p6t0UV1PsmXokOQjzGCkDUFeURMTO0vn4QbAsjhliWixf6JE7atDMQpWvZpkQkciHvyRI9gbpORIh_qzsjsS-VPRgzwMznnM7nA",
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
