const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
//const { upload, optimizeImageMiddleware } = require('../middleware/multer-config');

const bookCtrl = require('../controller/book_controller');

router.post('/', auth, bookCtrl.createBook);
router.get('/bestrating', bookCtrl.getBestRatings);
router.get('/', bookCtrl.getAllBooks);
router.get('/:id', bookCtrl.getOneBook);
router.post('/:id/rating', auth, bookCtrl.rateBook);
router.put('/:id', auth, bookCtrl.modifyBook);
router.delete('/:id', auth, bookCtrl.deleteBook);



module.exports = router;