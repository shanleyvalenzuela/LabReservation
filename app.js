
//npm init -y
//npm i express express-handlebars body-parser mongodb express-session connect-mongo 

const express = require('express');
const server = express();

const bodyParser = require('body-parser');
server.use(express.json()); 
server.use(express.urlencoded({ extended: true }));

const handlebars = require('express-handlebars');
server.set('view engine', 'hbs');
server.engine('hbs', handlebars.engine({
    extname: 'hbs',
}));

const session = require('express-session');
const MongoStore = require('connect-mongo');

const bcrypt = require('bcrypt');

server.use(express.static('public'));

const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const { MongoClient } = require('mongodb');
const databaseURL = "mongodb://127.0.0.1:27017/";
const mongoClient = new MongoClient(databaseURL);

const databaseName = "userdb";
const collectionName = "userinfo";
const collectionName2 = "reservationdb";
let reservationCollection;

server.use(session({
  secret: 'key',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
      mongoUrl: databaseURL,
      dbName: databaseName,
      collectionName: 'sessions'
  }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

async function initialConntection(){
    let con = await mongoClient.connect();
    console.log("Attempt to create!");
    const dbo = mongoClient.db(databaseName);
    dbo.createCollection(collectionName);
    reservationCollection = dbo.collection(collectionName2);

    const col = dbo.collection(collectionName);
    const adminEmail = "admin@admin";
    const adminPass = "admin";
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPass, saltRounds);

    const existingAdmin = await col.findOne({ email: adminEmail });

    if (!existingAdmin) {
        const adminInfo = {
            firstName: "Admin",
            lastName: "User",
            email: adminEmail,
            program: "N/A",
            pass: hashedPassword
        };

        await col.insertOne(adminInfo);
        console.log("Admin user created with default credentials.");
    } else {
        console.log("Admin user already exists.");
  }
}
  initialConntection();

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/');
    }
}

const dataModule = require('./lab-data');
const labs_list = dataModule.getData('./data/LabData.json');
const timeslots = dataModule.getData('./data/Timeslots.json');

// Admin or student login
  server.get('/', function(req, resp){
    resp.render('admin_student', {
      layout: 'index_select',
      title: 'Select Login Page'
     });
    });

// Home
server.get('/home', isAuthenticated ,function(req, resp) {
  resp.render('labs-main', {
      layout: 'index-labs',
      title: 'Home Page',
      labs_list: labs_list
  });
});

server.get('/admin_home', isAuthenticated, function(req, resp) {
  resp.render('admin_home', {
    layout: 'index-labs',
    title:  'Home page',
    labs_list: labs_list
  });
});

// Admin Login
server.get('/admin_login', function(req, resp) {
  resp.render('admin_login', {
      layout: 'index_login',
      title: 'Admin Login Page'
  });
});

//User Login (Admin)
server.post('/read-admin', async function(req, resp){
  const dbo = mongoClient.db(databaseName);
  const col = dbo.collection(collectionName);
  const searchQuery = { email: req.body.adminemail};
  let val = await col.findOne(searchQuery);

  currentUser = val;
  console.log('Finding user');
  console.log('Inside: '+JSON.stringify(val));

  if(val != null && await bcrypt.compare(req.body.adminpass, val.pass)){
    req.session.user = { id: val._id, 
        email: val.email, 
        role: 'admin' };
  resp.render('admin_home', {
    layout: 'index-labs',
    title:  'Home page',
    labs_list: labs_list
  });
  }else{
    resp.render('failed_login',{
      layout: 'index_login',
      title:  'Failed Login Page',
      status: 'bad'
    });
  }
});

// Student Login
server.get('/student_login', function(req, resp) {
  resp.render('student_login', {
      layout: 'index_login',
      title: 'Student Login Page'
  });
});

let currentUser;
//User Login (Student)
server.post('/read-user', async function(req, resp){
  const
  dbo = mongoClient.db(databaseName);
  const col = dbo.collection(collectionName);
  const searchQuery = { email: req.body.email};
  let val = await col.findOne(searchQuery);

  currentUser = val;
  console.log('Finding user');
  console.log('Inside: '+JSON.stringify(val));

  if(val != null && await bcrypt.compare(req.body.pass, val.pass)){
    req.session.user = { id: val._id, 
        email: val.email, 
        role: 'student' };

    resp.render('labs-main', {
        layout: 'index-labs',
        title: 'COMPUTER LABORATORIES',
        labs_list: labs_list
    });
  }else{
    resp.render('failed_login',{
      layout: 'index_login',
      title:  'Failed Login Page',
      status: 'bad'
    });
  }
});

// User Reservation Page
server.get('/id/:id/:name/:loc', async function(req, resp) {
  const { id, name, loc } = req.params;

  try {
    resp.render('slots-main', {
      layout: 'index-slots',
      title: 'Reservation Page',
      lab_id: id,
      lab_name: name,
      lab_loc: loc,
      timeslots: timeslots,  // Ensure 'timeslots' is defined and available in this scope
      floor_layout: `${id}-layout`,
      labs_list: labs_list,  // Ensure 'labs_list' is defined and available in this scope
    });
  } catch (err) {
    console.error('Error fetching reservations:', err);
    resp.status(500).send('Internal Server Error');
  }
});

server.get('/admin_view/:id/:name/:loc', async function(req, resp) {
  const { id, name, loc } = req.params;

  try {
    
  const currentDate = new Date();
  const dateNow = currentDate.toLocaleDateString(); // Get the date
  const timeNow = currentDate.toLocaleTimeString(); // Get the time
  
    resp.render('slots-tech', {
      layout: 'index-slots',
      title: 'Reservation Page',
      lab_id: id,
      lab_name: name,
      lab_loc: loc,
      floor_layout: `${id}-layout`,
      labs_list: labs_list,  
      dateNow: dateNow,
      timeNow: timeNow
    });
  } catch (err) {
    console.error('Error fetching reservations:', err);
    resp.status(500).send('Internal Server Error');
  }
});

server.get('/reservations/:id/:date/:time', async function(req, resp) {
  const { id, date, time } = req.params;
  const { lab_name, lab_loc } = req.query;

  try {
    //console.log(`Fetching reservations for lab_id: ${id}, date: ${date}, time: ${time}`);
    //console.log(`Query parameters: lab_name: ${lab_name}, lab_loc: ${lab_loc}`);
    
    const matchingReservations = await reservationCollection.find({
      lab_id: id,
      date: date,
      timeslot: time
    }).toArray();


    //console.log('Matching Reservations:', JSON.stringify(matchingReservations));
    
    const reservedSeats = matchingReservations.map(reservation => ({
      seats: reservation.seats,
      reserver: reservation.reserver
    }));

    resp.status(200).json(reservedSeats);
  } catch (err) {
    console.error('Error fetching matching reservations:', err);
    resp.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});


server.get('/tech-reservations/:id/:date/:time', async function(req, resp) {
  const { id, date, time } = req.params;
  const { lab_name, lab_loc } = req.query;

  try {
    //console.log(`Fetching reservations for lab_id: ${id}, date: ${date}, time: ${time}`);
    //console.log(`Query parameters: lab_name: ${lab_name}, lab_loc: ${lab_loc}`);
    
    const matchingReservations = await reservationCollection.find({
      lab_id: id,
      date: date,
      timeslot: time
    }).toArray();


    //console.log('Matching Reservations:', JSON.stringify(matchingReservations));
    
    const reservedSeats = matchingReservations.map(reservation => ({
      seats: reservation.seats,
      reserver: reservation.reserver
    }));

    resp.status(200).json(reservedSeats);
  } catch (err) {
    console.error('Error fetching matching reservations:', err);
    resp.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

server.post('/reserve', async function(req, resp) {
  const { lab_id, lab_name, lab_loc, reservations } = req.body;
  const { firstName, lastName, email } = currentUser;  // Destructure the currentUser object to get the required attributes
  const reserver = currentUser;
  console.log(req.body); // Debugging line to check the incoming data

  try {
      // Insert each reservation into MongoDB
      const insertPromises = reservations.map(reservation => {
          return reservationCollection.insertOne({
              reserver,
              lab_id,
              lab_name,
              lab_loc,
              date: reservation.date,  
              timeslot: reservation.timeslot,  
              seats: reservation.seats  
          });
      });

      const insertResults = await Promise.all(insertPromises);
      console.log('Reservations saved to database:', insertResults);

      // Render confirmation page
      resp.render('confirmation_page_lab', {
          layout: 'confirmation',
          title: 'Confirmation Page',
          lab_id: lab_id,
          lab_name: lab_name,
          lab_loc: lab_loc,
          fName: firstName,
          lName: lastName,
          email: email,
          reservations: reservations
      });
  } catch (error) {
      console.error('Failed to save reservations:', error);
      resp.status(500).send('Failed to save reservations');
  }
});


server.post('/tech-reserve', async function(req, resp) {
  const { lab_id, lab_name, lab_loc, reservations } = req.body;
  const { firstName, lastName, email } = currentUser;  // Destructure the currentUser object to get the required attributes
  const reserver = currentUser;
  console.log(req.body); // Debugging line to check the incoming data

  try {
      // Insert each reservation into MongoDB
      const insertPromises = reservations.map(reservation => {
          return reservationCollection.insertOne({
              reserver,
              lab_id,
              lab_name,
              lab_loc,
              date: reservation.date,  
              timeslot: reservation.timeslot, 
              seats: reservation.seats  
          });
      });

      const insertResults = await Promise.all(insertPromises);
      console.log('Reservations saved to database:', insertResults);

      // Redirect to `/tech-reservations/${lab_id}/${date}/${timeslot}`
      
    resp.redirect(`/tech-reservations/${lab_id}/${date}/${timeslot}`);
  } catch (error) {
      console.error('Failed to save reservations:', error);
      resp.status(500).send('Failed to save reservations');
      resp.redirect(`/`);
  }
});

// Registration Page
server.get('/registration', function(req, resp) {
  resp.render('registration', {
      layout: 'index_reg',
      title: 'Registration Page'
  });
});

// create user
server.post('/create-user', upload.single('profileImage'), async function(req, resp) {
  try {
      // Debugging: Print the received form data
      console.log('Form data received:', req.body);

      const { firstName, lastName, email, program, pass } = req.body;

      // Check if pass is a valid string
      if (typeof pass !== 'string' || pass.trim() === '') {
          throw new Error('Invalid password');
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(pass, saltRounds);

      const info = {
          firstName,
          lastName,
          email,
          program,
          pass: hashedPassword,
          profileImage: req.file ? req.file.buffer : null
      };

      const dbo = mongoClient.db(databaseName);
      const col = dbo.collection(collectionName);

      let res = await col.insertOne(info);
      console.log('User created:', res);

      resp.render('home', {
          layout: 'index_home',
          title: 'Home Page'
      });
  } catch (error) {
      console.error('Error creating user:', error);
      resp.status(500).send('Internal Server Error');
  }
});

//User profile
const UserInfo = require('./profile');

server.get('/student_profile', async function(req, resp){
	const user = currentUser;
    const roomInfo = UserInfo.getRoom();
    const dbo = mongoClient.db(databaseName);
    const userCol = dbo.collection(collectionName);
    const reservationCol = dbo.collection(collectionName2);
    
    const reservations = await reservationCol.find({ 'reserver._id': new ObjectId(user._id) }).toArray();
    resp.render('student_profile', {
        layout: 'profile',
        title: 'User Page',
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        program: user.program,
        profileImage: user.profileImage,
        id: user._id,
        reservations: reservations // Add this line to pass reservations to the view
    });
});

const { ObjectId } = require('mongodb');

server.get('/view_profile/:id', async function(req, resp) {
  const { id } = req.params;
  const dbo = mongoClient.db(databaseName);
  const userCol = dbo.collection(collectionName);
  const reservationCol = dbo.collection(collectionName2);

  try {
      // Check if id is a valid ObjectId
      if (!ObjectId.isValid(id)) {
          console.log('Invalid user ID');
          return resp.status(400).send('Invalid user ID');
      }

      // Convert id to ObjectId
      const searchQuery = { _id: new ObjectId(id) };
      let val = await userCol.findOne(searchQuery);

      // Check if user was found
      if (!val) {
          console.log('User not found');
          return resp.status(404).send('User not found');
      }

      // Fetch user reservations
      const reservations = await reservationCol.find({ 'reserver._id': new ObjectId(id) }).toArray();

      // Set foundUser to the result
      const foundUser = val;
      console.log('Finding user');
      console.log('Inside: ' + JSON.stringify(foundUser));

      // Render the profile page with user data and reservations
      resp.render('student_profile', {
          layout: 'profile',
          title: 'User Page',
          firstName: foundUser.firstName,
          lastName: foundUser.lastName,
          email: foundUser.email,
          program: foundUser.program,
          profileImage: foundUser.profileImage,
          id: foundUser._id,
          reservations: reservations // Add this line to pass reservations to the view
      });
  } catch (error) {
      console.log('Error fetching user:', error);
      resp.status(500).send('Error fetching user');
  }
});

server.post('/update-profile', async function(req, resp) {
  const { userid, fname, lname, email, program, image } = req.body;
  const dbo = mongoClient.db(databaseName);
  const col = dbo.collection(collectionName);

  try {
    // Check if userid is a valid ObjectId
    if (!ObjectId.isValid(userid)) {
      console.log('Invalid user ID');
      return resp.status(400).send('Invalid user ID');
    }

    // Convert userid to ObjectId
    const searchQuery = { _id: new ObjectId(userid) };
    const updateQuery = {
      $set: {
        firstName: fname,
        lastName: lname,
        email,  // Ensure this matches your form field
        program,
        profileImage: image
      }
    };

    // Update user details
    const result = await col.updateOne(searchQuery, updateQuery);

    // Check if update was successful
    if (result.matchedCount === 0) {
        console.log('User not found');
        return resp.status(404).send('User not found');
    }

    // Redirect to the view_profile route with updated user ID
    resp.redirect(`/view_profile/${userid}`);
  } catch (error) {
    console.log('Error updating user details:', error);
    resp.status(500).send('Error updating user details');
  }
});

// Delete User and Reservations
server.post('/delete-account', async function(req, resp) {
  const { userId } = req.body; // Get user ID from request

  if (!userId) {
      return resp.status(400).send('User ID is required');
  }

  try {
      const dbo = mongoClient.db(databaseName);

      // Convert userId to ObjectId
      const userObjectId = new ObjectId(userId);
      
      // Delete user
      const userCol = dbo.collection(collectionName);
      const userDeletionResult = await userCol.deleteOne({ _id: userObjectId });
      
      if (userDeletionResult.deletedCount === 0) {
          console.log('User not found');
          return resp.status(404).send('User not found');
      }
      
      // Delete user reservations
      const reservationCol = dbo.collection(collectionName2);
      const reservationDeletionResult = await reservationCol.deleteMany({ "reserver._id": userObjectId });

      console.log('Reservations deleted:', reservationDeletionResult.deletedCount);

      // End user session
      req.session.destroy(err => {
          if (err) {
              return resp.status(500).send('Error ending session');
          }
          resp.clearCookie('connect.sid');
          resp.redirect('/');
      });
  } catch (error) {
      console.error('Error deleting account:', error);
      resp.status(500).send('Error deleting account');
  }
});

//Logout
server.get('/logout', function(req, resp) {
  req.session.destroy(err => {
      if (err) {
          return resp.redirect('/home');
      }
      resp.clearCookie('connect.sid');
      resp.redirect('/');
  });
});

// Confirmation Page Lab 
server.get('/confirmation_page_lab', function(req, resp) {
  resp.render('confirmation_page_lab', {
      layout: 'confirmation',
      title: 'Confirmation Page'
  });
});

// Tech Add Reservation  
server.get('/tech_add_reservation', function(req, resp) {
  resp.render('tech_add_reservation', {
      layout: 'index_tech_add',
      title: 'Tech Add Reservation',
    labs_list: labs_list,
    timeslots: timeslots
  });
});

server.post('/add-reservation', async function(req, resp){
  const dbo = mongoClient.db(databaseName);
  const reservationsCol = dbo.collection('reservations');
  const reservationInfo = {
      name: req.body.name,
      email: req.body.email,
      room: req.body.room,
      timeslot: req.body.timeslot,
      seat: req.body.seat
  };
  let result = await reservationsCol.insertOne(reservationInfo);
  console.log('Reservation added');
});

// Tech Del Reservation  
server.get('/tech_del_reservation', function(req, resp) {
  // Get current date and time
  const currentDate = new Date();
  const dateNow = currentDate.toLocaleDateString(); // Get the date
  const timeNow = currentDate.toLocaleTimeString(); // Get the time
  resp.render('tech_del_reservation', {
      layout: 'index_tech_del',
      title: 'Tech Del Reservation',
      dateNow: dateNow,
      timeNow: timeNow,
      labs_list
  });
});
server.post('/delete-reservation', async function(req, resp) {
  const dbo = mongoClient.db(databaseName);
  const reservationsCol = dbo.collection('reservations');

  const deleteQuery = {
    email: req.body.email,
    room: req.body.room
  };
  const result = await reservationsCol.deleteOne(deleteQuery);
  console.log('Reservation deleted:', result.deletedCount);

   if(val = null){
    resp.render('result',{
      layout: 'index',
      title:  'Result page',
      status: 'bad',
      msg:    'No reservation found (tech)'
    });
    };
});

//credits
server.get('/credits', function(req, resp) {
  resp.render('credits', {
      layout: 'index-labs',
      title: 'Credits'
  });
});

server.get('/profile-image/:email', async (req, res) => {
  try {
      const email = req.params.email;
      const dbo = mongoClient.db(databaseName);
      const col = dbo.collection(collectionName);

      const user = await col.findOne({ email: email });

      if (user && user.profileImage) {
          res.set('Content-Type', 'image/png'); // or the appropriate image content type
          res.send(user.profileImage);
      } else {
          res.status(404).send('Image not found');
      }
  } catch (error) {
      console.error('Error retrieving image:', error);
      res.status(500).send('Internal Server Error');
  }
});

//Only at the very end should the database be closed.
function finalClose(){
    console.log('Close connection at the end!');
    mongoClient.close();
    process.exit();
}

process.on('SIGTERM',finalClose);  //general termination signal
process.on('SIGINT',finalClose);   //catches when ctrl + c is used
process.on('SIGQUIT', finalClose); //catches other termination commands

// Start server
const port = process.env.PORT | 9090;
server.listen(port, function(){
    console.log('Listening at port '+port);
});