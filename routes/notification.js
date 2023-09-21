const express = require("express");
var router = express.Router();
const {db , dbimage , dbkissan, dbexpert} = require('../db');





router.get('/notification', (req, res) => {

    const number = req.session.phoneNumber
    const chats = db.prepare(`SELECT * FROM posts WHERE number='${number}'`).all();
    const images = dbimage.prepare(`SELECT * FROM images WHERE number='${number}'`).all()

    res.render('notification', { chats , images})
 
});

router.get('/viewnoti/:id', (req, res) => {

  const postId = req.params.id;

  const number = req.session.phoneNumber
  // const chats = db.prepare(`SELECT * FROM posts WHERE number='${number}'`).all();
  // const images = dbimage.prepare(`SELECT * FROM images WHERE number='${number}'`).all()
  db.prepare(`UPDATE posts SET status='solved' WHERE id='${postId}'`).run();
  res.redirect('/allposts')

});

router.get('/getnoti', (req, res) => {

  const number = req.session.phoneNumber
  // const chats = db.prepare(`SELECT * FROM posts WHERE number='${number}'`).all();
  // const images = dbimage.prepare(`SELECT * FROM images WHERE number='${number}'`).all()
  const post = db.prepare(`SELECT * FROM posts WHERE number='${number}' AND status='unsolved'`).all();

  res.render('bell', {noti:post.length>0 && post[0].reply ? '1' : '0'})

});







module.exports = router;