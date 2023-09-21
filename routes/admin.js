const express = require("express");
var router = express.Router();
const {db , dbimage , dbkissan, dbexpert , dbadmin} = require('../db');



router.post('/url', async(req, res) => {
    
    dbadmin.prepare(
      `UPDATE adminposts SET url = ? WHERE name = 'admin'`
    ).run(req.body.url);
    
    res.redirect('/admin');
  });
  



module.exports = router;