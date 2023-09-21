const express = require("express");
var router = express.Router();
const {db , dbimage , dbkissan, dbexpert} = require('../db');


router.get('/expert', (req, res) => {
    
    const chats = db.prepare(`SELECT * FROM posts`).all();
  
    const images = dbimage.prepare(`SELECT * FROM images`).all()
    
    req.session.expertname?res.render('expert' , {chats , images}):res.render('logins/expertlogin');
    
  });
  
router.post("/expertlogin", async (req, res) => {
    const { name, password } = req.body;
  
    const chats = db.prepare(`SELECT * FROM posts`).all();
  
    const images = dbimage.prepare(`SELECT * FROM images`).all()
    const expert = dbexpert.prepare(
      `SELECT * FROM experts WHERE user='${name}' AND pass='${password}'`
    ).all();
  
  
    if (expert.length > 0) {
        req.session.expertname = name
      res.render("expert" , {chats , images});
    } else {
      res.redirect("/expert");
    }
  });
  
router.get("/expertdash", async (req, res) => {
  
    const chats = db.prepare(`SELECT * FROM posts`).all();
  
    const images = dbimage.prepare(`SELECT * FROM images`).all()
  
    res.render('partials/allposts',{chats , images});
  
  });
  
router.get('/replypost/:id', async (req, res) => {
  
    const postid = req.params.id;
  
    const post = db.prepare(`SELECT * FROM posts WHERE id='${postid}' `).all()
    const postimages = dbimage.prepare(`SELECT * FROM images WHERE id='${postid}' `).all()
  
    res.render('expert/replypost' , {post , postimages})
  
  });
  
  
router.post('/expertreply', async (req, res) => {
  
    const {reply , number ,id} = req.body
  
    db.prepare('UPDATE posts SET reply=? WHERE number=? AND id=?').run(reply , number , id)
    // dbexpert.prepare(`UPDATE chats SET reply='${reply}', status='solved' WHERE number='${number}'`).run();
  
  
    res.redirect('/expert')
  });



  module.exports = router;