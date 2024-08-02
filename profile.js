// Fields:
//	- id - id number of user
//	- name - name of user
//	- year - year level of user
//	- program - course program of user
//	- contact - contact number of user

function getUser(){
	const fs = require('fs');
	let rawdata = fs.readFileSync('./profile.json');
	let userInfo = JSON.parse(rawdata);
    console.log('Fetched user info:', userInfo); // Log fetched data
	return userInfo;
}

module.exports.getUser = getUser;

// Fields:
//	- id - id number of room reservation
//	- room - name of reserved room by user
//	- status - status of reservation

function getRoom(){
	const fs = require('fs');
	let rawdata = fs.readFileSync('./room.json');
	let roomInfo = JSON.parse(rawdata);
    console.log('Rooms:', roomInfo); // Log fetched data
	return roomInfo;
}

module.exports.getRoom = getRoom;

