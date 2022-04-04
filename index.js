const express = require('express');
const multer = require("multer");
const sharp = require('sharp');
const fs = require('fs')
const cors = require('cors')
const app = express();

app.use(cors())
app.use('/static', express.static('static'))

const fileFilter = function (req, file, cb) {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error("Wrong file type");
    error.code = "WRONG_FILE_TYPE";
    return cb(error, false);
  }
  cb(null, true);
}

const MAX_SIZE = 200000000;

const upload = multer({
  dest: './uploads/',
  fileFilter,
  limits: {
    fileSize: MAX_SIZE
  }
})

const uploadPic = upload.single('file');
app.post("/uploadpic", (req, res) => {
  uploadPic(req, res, async (err) => {
    if (err) {
      if (err.code === "WRONG_FILE_TYPE") {
        res.status(358).json({ error: "Only images are allowed." })
      }
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(359).json({ error: `Too large. Max size is ${MAX_SIZE / 1000}KB.` })
      }
    }
    // 必須寫上else if而非if。否則，有err时，req.file為undefined。那麼，執行了上面的if後，會接著執行這裡的。會報錯：不能在res.json了之後，又用一次res.json。
    else if (!req.file) {
      res.json({ alert: "You have upload NOTHING" })
    }
    else {
      try {
        await sharp(req.file.path).resize(300).toFile(`./static/${req.file.originalname}`);

        fs.unlink(req.file.path, () => {
          res.json({ uploadedFile: req.file, uploadedFileAddress: `/static/${req.file.originalname}` })
        })
      } catch (error) {
        console.log(error)
        res.status(999).json({ error });
      }
    }
  })
});

app.listen(3344, () => { console.log("Running on localhost:3344") })