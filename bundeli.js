const express = require('express');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const {db , dbimage , dbkissan} = require('./db');
const session = require("express-session");
const FileStore = require('session-file-store')(session);
const fetch = require('node-fetch');
const axios = require('axios');
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

app.get('/', async (req, res) => {
  const number = req.session.phoneNumber
  const user = dbkissan.prepare(`SELECT * FROM kissan WHERE number='${number}'`).all();
  user.length>0 ? res.redirect('/home'):res.render('login');

});

app.get('/home', async(req, res) => {
  const number = req.session.phoneNumber
  const user = dbkissan.prepare(`SELECT * FROM kissan WHERE number='${number}'`).all();


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


app.get('/query', async(req, res) => {
  const number = req.session.phoneNumber
  const user = dbkissan.prepare(`SELECT * FROM kissan WHERE number='${number}'`).all();


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


app.post('/', (req, res) => {

  const { code, phonenumber } = req.body;
  const user = dbkissan.prepare(`SELECT * FROM kissan WHERE number='${phonenumber}'`).all();

  code === randomCode?
    user.length > 0 ? res.redirect("/") : res.render("profile/createprofile")
  :res.render("logins/kissanlogin" , {number:phonenumber});
  
});




app.get('/chat', (req, res) => {
  const posts = db.prepare('SELECT * FROM posts ORDER BY timestamp DESC').all();
  const images = dbimage.prepare('SELECT * FROM images ').all();

  res.render('chat', { posts , images });
});

app.get('/allposts', (req, res) => {
  const number =  req.session.phoneNumber;

  const posts = db.prepare(`SELECT * FROM posts WHERE number='${number}' ORDER BY timestamp DESC` ).all();
  const images = dbimage.prepare(`SELECT * FROM images WHERE number='${number}'`).all()

  res.render('query', { chats:posts , images});
});

app.post('/create', upload.array('images', 5), async (req, res) => {
  const number =  req.session.phoneNumber;

  const { content } = req.body;
  if (!content) {
    return res.status(400).send('Content is required');
  }

  const imagePromises = [];

  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const compressedImageBuffer = await sharp(file.buffer)
        .resize({ width: 800 })
        .webp({ quality: 40 })
        .toBuffer();

      if (compressedImageBuffer.length > 100000) {
        return res.status(400).send('Image size exceeds 100KB');
      }

      imagePromises.push(compressedImageBuffer);
    }
  }

  const images = await Promise.all(imagePromises);
  
  db.prepare('INSERT INTO posts (chat, number) VALUES (?,?)').run(content , number);
  const post = db.prepare(`SELECT * FROM posts WHERE chat='${content}'`).all();

  console.log('done till here');


  for (const imageBuffer of images) {
    dbimage.prepare('INSERT INTO images (id,images , number) VALUES (?,? , ?)').run( post[0].id, imageBuffer ,number);

  }

  res.render('partials/postform')
});

// app.get('/admin', (req, res) => {
//   const posts = db.prepare('SELECT * FROM posts').all();
//   res.render('admin', { posts });
// });

// app.get('/edit/:id', (req, res) => {
//   const postId = req.params.id;
//   const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);

//   if (!post) {
//     res.status(404).send('Post not found');
//   } else {
//     res.render('edit', { post });
//   }
// });

// app.post('/edit/:id', upload.single('image'), async (req, res) => {
//   const postId = req.params.id;
//   const { title, content } = req.body;
//   if (!title || !content) {
//     return res.status(400).send('Title and content are required');
//   }

//   let compressedImageBuffer = null;

//   if (req.file) {
//     try {
//       compressedImageBuffer = await sharp(req.file.buffer)
//         .resize({ width: 800 })
//         .jpeg({ quality: 60 })
//         .toBuffer();

//       if (compressedImageBuffer.length > 100000) {
//         return res.status(400).send('Image size exceeds 100KB');
//       }
//     } catch (error) {
//       console.error('Error compressing image:', error);
//       return res.status(500).send('Image compression failed');
//     }
//   }

//   db.prepare('UPDATE posts SET title = ?, content = ?, image = ? WHERE id = ?').run(
//     title,
//     content,
//     compressedImageBuffer,
//     postId
//   );

//   res.redirect('/admin');
// });

app.get('/delete/:id', (req, res) => {
  const postId = req.params.id;
 
    db.prepare('DELETE FROM posts WHERE id = ?').run(postId);

    dbimage.prepare('DELETE FROM images WHERE id = ?').run(postId);



  res.redirect('/allposts');
});

// app.get('/add', (req, res) => {
//   res.render('add');
// });

app.get('/kissanlogin', (req, res) => {
  res.render('logins/kissanlogin');
});

app.post('/createprofile', async (req, res) => {
  const number =  req.session.phoneNumber;
  const { name, fathername, gender, dob, pincode, address } = req.body;

  dbkissan.prepare(`INSERT INTO kissan (number,name , fathername , gender , dob , pincode , address) VALUES (?,?,?,?,?,?,?)`).run(number,name,fathername,gender ,dob,pincode,address)

  res.redirect('/');
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


app.get('/', async (req, res) => {
  // const number =  req.session.phoneNumber;

  // const chats = db.prepare('SELECT * FROM posts').all();

  // const name = dbkissan.prepare(
  //   `SELECT name FROM kissan WHERE number='${'+91'+number}'`
  // ).all();
  // console.log(name);
  // res.render('query', { chats: chats  , name:name[0].name , phonenumber:number} );
});

app.listen(7777, () => {
  console.log('Server is running on http://localhost:7777');
});
