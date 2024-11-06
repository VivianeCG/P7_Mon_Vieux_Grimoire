const Book = require('../model/book_model');
const fs = require('fs');

exports.getAllBooks = (req, res, next) => {
    Book.find()
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(400).json({ error }));
   }

exports.getOneBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error }));
    }

exports.getBestRatings = (req, res, next) => {
    Book.find().sort({ averageRating: -1 }).limit(3) // Trie par note décroissante 
    .then(books => res.status(200).json(books))
    .catch(error => res.status(500).json({ error }));
   };

exports.createBook = (req, res, next) => {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;

    const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl:`${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    book.save()
    .then(() => res.status(201).json({message: 'livre enregistré'}))
    .catch((error) => res.status(400).json({error}));
    }

exports.rateBook = (req, res, next) => {
    const bookId = req.params.id;
    const userId = req.auth.userId;
    const grade = parseInt(req.body.grade, 10);
    if (grade < 0 || grade > 5) {
        return res.status(400).json({message: 'la note doit être un chiffre entre 0 et 5' });
    } 
    //récupération du livre
    Book.findOneAndUpdate({ _id: bookId })
    .then((book) => {
        if(!book){
            return res.status(404).json({ error })
        };
        //vérification que le livre n'a pas déjà été noté par l'utilisateur
        const existingRating = book.ratings.find(rating => rating.userId === userId);
        if (existingRating){
            return res.status(400).json({ message: 'Vous avez déjà noté ce livre'});
        }
        //ajouter id user et grade au tableau rating du livre
        book.ratings.push({userId, grade});
        //mettre à jour average rating
        const totalRating = book.ratings.reduce((sum, ratings) => sum + ratings.grade, 0);
        book.averageRating = totalRating / book.ratings.length;
        //sauvegarde du résultat
        book.save()
        .then(() => res.status(201).json(book))
        .catch(error => res.status(500).json({ error }));
    })
    .catch((error) => res.status(404).json({ error }));
   }

exports.modifyBook = (req, res, next) => {
    const bookObject = req.file ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
    delete bookObject._userId;
    Book.findOne({ _id: req.params.id })
    .then((book) => {
        if (book.userId != req.auth.userId) {
            res.status(403).json({ message: 'unauthorized request' });
        } else {
            Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
            .then(() => res.status(200).json({ message: 'Livre modifié'}))
            .catch((error) => res.status(401).json({ error }));
        }
    })
    .catch((error) => res.status(400).json({ error }));
    }

exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
    .then((book) => {
        if (book.userId != req.auth.userId) {
            res.status(403).json({ message: 'unauthorized request' });
        } else {
            const filename = book.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, ()=>{
                Book.deleteOne({ _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Livre supprimé'}))
                    .catch(error => res.status(401).json({ error }));
            })
        }
    })
    .catch((error) => res.status(500).json({ error }));
    }