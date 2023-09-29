const express = require('express');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');

const {db , dbimage , dbkissan, dbexpert , dbadmin} = require('./db');
const session = require("express-session");
const FileStore = require('session-file-store')(session);
const fetch = require('node-fetch');
const axios = require('axios');
const Promise = require('bluebird'); // Install via npm
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.set('view engine', 'ejs');
app.use(express.static('public'));

var randomCode;

app.use(session({
  secret: 'your-secret-key',
  store: new FileStore({
    path: '/session/bundeli', // Choose a directory to store session files
    ttl: 86400 // Session expiration time in seconds (optional)
  }),
  resave: false,
  saveUninitialized: true
}));

/////////////////////////////////////////
const expertRouter = require("./routes/expert.js");
const notificationRouter = require("./routes/notification.js");
const adminRouter = require("./routes/admin.js");

app.use("/", expertRouter);
app.use("/", notificationRouter);
app.use("/", adminRouter);

////////////////////////////////////////




app.get('/', async (req, res) => {
  const number = req.session.phoneNumber
  const user = dbkissan.prepare(`SELECT * FROM kissan WHERE number='${number}'`).all();
  user.length>0 ? res.redirect('/home'):res.render('login');

});

app.post('/', (req, res) => {

  const { code, phonenumber } = req.body;
  const user = dbkissan.prepare(`SELECT * FROM kissan WHERE number='${phonenumber}'`).all();

  code === randomCode?
    user.length > 0 ? res.redirect("/") : res.render("profile/createprofile" )
  :res.render("logins/kissanlogin" , {number:phonenumber , user});
  
});

app.get('/home', async(req, res) => {
  const number = req.session.phoneNumber
  const user = dbkissan.prepare(`SELECT * FROM kissan WHERE number='${number}'`).all();
  // const lang = dbkissan.prepare(`SELECT * FROM kissan WHERE number='${number}'`).all()
  // const post = db.prepare(`SELECT * FROM posts WHERE number='${number}' AND status='unsolved'`).all();

  try {
    const response = await axios.get(
      'https://api.openweathermap.org/data/2.5/weather?id=1273587&appid=404ae0fc6125b1b2ac81edc980993a31'
    );
    
    user.length>0 ?res.render('home' , { weather: response.data, phonenumber:number ,user:user[0] }):res.redirect('/');
  } catch (error) {
    console.log('Error:', error);
    res.sendStatus(500); // Send an error response to the client
  }

});

app.get('/query', async(req, res) => {
  const number = req.session.phoneNumber
  const user = dbkissan.prepare(`SELECT * FROM kissan WHERE number='${number}'`).all();

  // const post = db.prepare(`SELECT * FROM posts WHERE number='${number}' AND status='unsolved'`).all();

  try {
    const response = await axios.get(
      'https://api.openweathermap.org/data/2.5/weather?id=1273587&appid=404ae0fc6125b1b2ac81edc980993a31'
    );
    
    user.length>0 ?res.render('home' , { weather: response.data, phonenumber:number }):res.redirect('/');
  } catch (error) {
    console.log('Error:', error);
    res.sendStatus(500); // Send an error response to the client
  }

});

app.get('/chat', (req, res) => {
  const number =  req.session.phoneNumber;
  const user = dbkissan.prepare(`SELECT * FROM kissan WHERE number='${number}'`).all();


  const posts = db.prepare('SELECT * FROM posts ORDER BY timestamp DESC').all();
  const images = dbimage.prepare('SELECT * FROM images ').all();
  // const post = db.prepare(`SELECT * FROM posts WHERE number='${number}' AND status='unsolved'`).all();



  res.render('chat', { posts , images  , user:user[0] });
});

app.get('/allposts', (req, res) => {
  const number =  req.session.phoneNumber;
  const user = dbkissan.prepare(`SELECT * FROM kissan WHERE number='${number}'`).all();

  const posts = db.prepare(`SELECT * FROM posts WHERE number='${number}' ORDER BY timestamp DESC` ).all();
  const images = dbimage.prepare(`SELECT * FROM images WHERE number='${number}'`).all()

  res.render('query', { chats:posts , images , user:user[0]});
});


app.post('/create', upload.array('images', 5), async (req, res) => {
  const number =  req.session.phoneNumber;

  const { content } = req.body;
  if (!content) {
    return res.status(400).send('Content is required');
  }

  // const imagePromises = [];

  const images = await Promise.map(req.files || [], async (file) => {
    const compressedImageBuffer = await sharp(file.buffer)
      .resize({ width: 800 })
      .webp({ quality: 40 })
      .toBuffer();

    if (compressedImageBuffer.length > 100000) {
      throw new Error('Image size exceeds 100KB');
    }

    return compressedImageBuffer;
  }, { concurrency: 4 }); 

  // const images = await Promise.all(imagePromises);
  
  db.prepare('INSERT INTO posts (chat, number) VALUES (?,?)').run(content , number);
  const post = db.prepare(`SELECT * FROM posts WHERE chat='${content}'`).all();

 

  for (const imageBuffer of images) {
    dbimage.prepare('INSERT INTO images (id,images , number) VALUES (?,? , ?)').run( post[0].id, imageBuffer ,number);

  }

  res.render('partials/postform')
});


app.get('/delete/:id', (req, res) => {
  const postId = req.params.id;
 
    db.prepare('DELETE FROM posts WHERE id = ?').run(postId);

    dbimage.prepare('DELETE FROM images WHERE id = ?').run(postId);



  res.redirect('/allposts');
});



app.get('/kissanlogin', (req, res) => {
  res.render('logins/kissanlogin');
});

app.post('/createprofile', async (req, res) => {
  const number =  req.session.phoneNumber;
  const { name, fathername, gender, dob, pincode, address } = req.body;

  dbkissan.prepare(`INSERT INTO kissan (number,name , fathername , gender , dob , pincode , address) VALUES (?,?,?,?,?,?,?)`).run(number,name,fathername,gender ,dob,pincode,address)

  res.redirect('/');
});

app.get('/userprofile', async (req, res) => {
  const number =  req.session.phoneNumber;

  
  const result = dbkissan.prepare(
    `SELECT * FROM kissan WHERE number='${number}'`
  ).all();

  console.log(result);

  res.render('profile/userprofile', { phonenumber: number, user: result[0] });
});





async function  sendmessage(number , message) {
  try {
    


    const apiUrl = 'https://wapi.kamingo.in/send-message'; // Replace with the actual API URL

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ number: number, message: message }),
    });



    if (response.ok) {
      const responseData = await response.json();
      console.log('API Response:', responseData);

    } else {
      console.error('API Error:', response.status);
      // Send a JSON response with status 'error'
    }
  } catch (error) {
    console.error('Error:', error);

  }
}


app.post("/sendcode", async (req, res) => {
  console.log(req.body.phonenumber);
  const { phonenumber } = req.body;

  req.session.phoneNumber = phonenumber;

  const generateRandomCode = () => {
    const codeLength = 4;
    let code = "";
    for (let i = 0; i < codeLength; i++) {
      code += Math.floor(Math.random() * 10); // Generate a random digit (0-9)
    }
    return code;
  };

  randomCode = generateRandomCode();

  const message ="Your Bundeli Kisan Authentication Code is : " + "*" + randomCode + "*";


  sendmessage(phonenumber, message)
    .then(() => {
      console.log("Message sent successfully");
      const result =db.prepare(`SELECT * FROM posts WHERE number='${phonenumber}'`).all();
      if (result.length < 1) {
        db.prepare('INSERT INTO posts (number) VALUES (?)').run(phonenumber);
      }

    })
    .catch((error) => {
      console.error("Error sending message:", error);
      res.sendStatus(500); // Send an error response to the client
    });
    res.render("logins/kissanlogin", { number: phonenumber});

});





app.get('/admin', (req, res) => {

  const experts = dbexpert.prepare(`SELECT * FROM experts`).all()
  res.render('admin' , {experts});
});

app.post('/createxpert', async (req, res) => {
  const {name , password} = req.body
  dbexpert.prepare(`INSERT INTO experts (user , pass) VALUES (? , ?)`).run(name,password)
  res.redirect('/admin')
});

app.post('/updateprofile', async (req, res) => {
  const number =  req.session.phoneNumber;
  const { name, fathername, gender, dob, pincode, address, lang } = req.body;

  dbkissan.prepare(
    `UPDATE kissan SET name=?, fathername=?, gender=?, dob=?, pincode=?, address=? , lang=? WHERE number=?`
  ).run(name, fathername, gender, dob, pincode, address, lang , number);

  res.redirect('/home');
});


app.get('/privacy', (req, res) => {
  res.render('privacy');
});


app.get('/video', async (req, res) => {
  const post = dbadmin.prepare(`SELECT * FROM adminposts`).all()

  res.redirect(`${post[0].url}`)
});

app.get('/mandi', async (req, res) => {
  const number =  req.session.phoneNumber
  const post = dbadmin.prepare(`SELECT * FROM adminposts`).all()

  const user = dbkissan.prepare(`SELECT * FROM kissan WHERE number='${number}'`).all();

  res.render('mandi' ,{ phonenumber: number , posts:post[0] , user:user[0] })
});
app.listen(7777, () => {
  console.log('Server is running on http://localhost:7777');
});
