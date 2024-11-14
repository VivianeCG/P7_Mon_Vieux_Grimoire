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

exports.rateBook = async (req, res) => {
    try{
        //traiter le req.body (user id et ratings dans req body)
        const { userId, ratings} = req.body;
        const book = await Book.findById(req.params.id); 
        //condition si book id non trouvé erreur 404 libre non trouvé
        if (!book){
            return res.status(404).json({ message: "Livre non trouvé" });
        }
        //condition pour vérifier si le user n'a pas déjà noté le livre
        if (book.ratings.some((r) => r.userId === userId)){
            return res.status(400).json({message: 'Vous avez déjà noté ce livre'});
        }
        //const nouvelle note pour note entre max et min
        //faire le push sur ratings sur la const juste avant
        const newRating = { userId, ratings: Math.min(5, Math.max(0, ratings))};
        book.ratings.push(newRating);
        //mise à jour average
        book.averageRating = parseFloat((book.ratings.reduce((acc, curr) => acc + curr.grade, 0) / book.ratings.length).toFixed(1));
        await book.save();
        res.status(200).json(book);
    } catch (error) {
        //ensuite gestion des erreurs
        console.error('Erreur dans rateBook', error.message);
        res.status(400).json({ error: error.message });
    }
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