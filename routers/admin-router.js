const express = require('express')
const { User } = require('../model/user');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const { RecoveryPassword } = require('../model/recoveryPassword'); 
const {
    checkAuthPayload , 
    checkEmailPayload , 
    checkPasswordPayload,
    signupResponse,
    signinResponse
} = require('../controllers/admin-controllers')

exports.router = (() => {
    const router = express.Router()
    // authentification
    router
    .route('/signup/')
    .post(
        checkAuthPayload,
        checkEmailPayload,
        checkPasswordPayload,
        signupResponse
    ),

    router
    .route('/signin/')
    .post(
        checkAuthPayload,
        checkEmailPayload,
        signinResponse
    )

    // perte du mot de passe
    router
    .route('/recovery-password/')
    .post(async (req, res) => {
      try {
        const { email } = req.body; 
        // Vérifie si l'utilisateur existe déjà
        const user = await User.findOne({ email });

        if (!user) {
          return res.status(400).json({ message: 'Email non trouvé' });
        }

        const slug = crypto.randomBytes(8).toString('hex');

        const recoveryLink = `http://localhost:3000/${slug}`;

        const recoveryPassword = new RecoveryPassword({
          slug,
          userId: user._id,
        });

        await recoveryPassword.save();

        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_ACCOUNT,
            pass: process.env.GMAIL_PASSWORD
          },
        });
  
        const mailOptions = {
          from: process.env.GMAIL_ACCOUNT,
          to: user.email,
          subject: 'Réinitialisation de mot de passe',
          text: `Cliquez sur le lien suivant pour réinitialiser votre mot de passe : ${recoveryLink}`,
        };
  
        // Envoie de l'e-mail
        await transporter.sendMail(mailOptions);
  
        res.status(200).json({ message: 'Un lien de récupération a été envoyé à votre adresse e-mail.' });
      } catch (error) {
        console.error('Erreur lors de la récupération du mot de passe:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du mot de passe.' });
      }
    });
  router
    .route('/new-password/')
    .post(
      async (req, res) => {
        try {
          const { password } = req.body;
          const { slug } = req.body;

          
          const recoveryPassword = await RecoveryPassword.findOne({ slug });

          if (!recoveryPassword) {
            return res.status(400).json({ message: 'Lien de récupération invalide.' });
          }

         
          const user = await User.findById(recoveryPassword.userId);

          if (!user) {
            return res.status(400).json({ message: 'Utilisateur non trouvé.' });
          }

          user.setPassword(password);
          await user.save();

          // Supprime l'entrée dans la collection recoveryPassword
          await recoveryPassword.remove();

          res.status(200).json({ message: 'Mot de passe mis à jour avec succès.' });
        } catch (error) {
          console.error('Erreur lors de la mise à jour du mot de passe:', error);
          res.status(500).json({ message: 'Erreur lors de la mise à jour du mot de passe.' });
        }
      }
    ),

    router
    .route('/ingredients')
    .post(async (req, res) => {
      try {
        const { ingredients } = req.body;
        const userId = req.user._id;

        // Ajoute les nouveaux ingrédients à la liste
        await User.findByIdAndUpdate(userId, { $push: { ingredients: { $each: ingredients } } });

        res.status(200).json({ message: 'Ingrédients ajoutés avec succès.' });
      } catch (error) {
        console.error('Erreur lors de l\'ajout d\'ingrédients:', error);
        res.status(500).json({ message: 'Erreur lors de l\'ajout d\'ingrédients.' });
      }
    })
    .get(async (req, res) => {
      try {
        const userId = req.user._id;

        // Récupère la liste des ingrédients de l'utilisateur
        const user = await User.findById(userId);
        const ingredients = user ? user.ingredients : [];

        res.status(200).json({ ingredients });
      } catch (error) {
        console.error('Erreur lors de la récupération des ingrédients:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des ingrédients.' });
      }
    })
    .delete(async (req, res) => {
      try {
        const userId = req.user._id;

        // Supprime tous les ingrédients de la liste
        await User.findByIdAndUpdate(userId, { $set: { ingredients: [] } });

        res.status(200).json({ message: 'Tous les ingrédients ont été supprimés.' });
      } catch (error) {
        console.error('Erreur lors de la suppression des ingrédients:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression des ingrédients.' });
      }
    });

  router
    .route('/ingredients/:index')
    .delete(async (req, res) => {
      try {
        const { index } = req.params;
        const userId = req.user._id;

        // Supprime l'ingrédient à l'index spécifié
        await User.findByIdAndUpdate(userId, { $pull: { ingredients: { _id: index } } });

        res.status(200).json({ message: 'Ingrédient supprimé avec succès.' });
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'ingrédient:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression de l\'ingrédient.' });
      }
    });










    
    return router
})()