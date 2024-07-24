// Importe le module Express pour créer une application web.
const express = require("express");

// Importe le module MySQL pour interagir avec une base de données MySQL.
const mysql = require("mysql");

// Importe le module express-myconnection pour gérer les connexions MySQL dans Express.
const myConnection = require('express-myconnection'); 


// Importe le module nodemailer pour 
const nodemailer = require('nodemailer');

// Importe de l'ODM mongoose.
const mongoose = require('mongoose');

// Déclare les options de connexion pour la base de données MySQL.
const optionResto = {
    host :'localhost',
    user : 'root',
    password : '',
    port : 3306,
    database : 'resto-new'
 };



// Crée une instance de l'application Express.
const app = express();

// Définition du middleware pour connexion avec la bd
app.use(myConnection(mysql,optionResto,'pool'));

// Importe le module body-parser pour analyser les corps de requête entrants.
const bodyParser = require('body-parser');


// Définit le répertoire des vues pour l'application Express.
app.set("views","./views");

// Définit le moteur de rendu à utiliser (EJS).
app.set('view engine','ejs');

// Utilise body-parser pour analyser les données des formulaires URL-encodées.
app.use(bodyParser.urlencoded({ extended: true }));


// Sert les fichiers statiques depuis le répertoire "public".
app.use(express.static("public"));

//
//LnOKB9tJZsVkDGYP
//mongodb+srv://neronriad:LnOKB9tJZsVkDGYP@cluster0.o0ndras.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
const uri = "mongodb+srv://neronriad:LnOKB9tJZsVkDGYP@cluster0.o0ndras.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };
mongoose.connect(uri, clientOptions)
  .then(() => {
    console.log('MongoDB connected successfully.')
    mongoose.connection.db.admin().command({ ping: 1 });
  })
  .catch((err) => console.error('MongoDB connection error:', err));

  const Schema = mongoose.Schema;
  const comment = new Schema({
    pseudo: String,
    message: String,
    validation: Boolean,
  })
  const NewMessage = mongoose.model('NewMessage', comment);


// routes vers la page d'accueil
app.get("/",(req,res) => {
    res.render('accueil')
})

// routes vers la page du menu
app.get("/carte",(req,res) => {
    res.render('carte',{resultats: []})
})

// routes vers la page réservation
app.get("/reservation", (req, res) => {
    // Connexion à la base de données
    req.getConnection((error, connection) => {
        if (error) {
            console.error("Erreur de connexion à la base de données :", error);
            res.status(500).send("Une erreur s'est produite lors de la connexion à la base de données.");
        } else {
            // Requête SQL pour récupérer les tables disponibles
            const sql = "SELECT table_id, capacite FROM tabls WHERE disponible = 1";
            connection.query(sql, (error, results) => {
                if (error) {
                    console.error("Erreur lors de la récupération des tables :", error);
                    res.status(500).send("Une erreur s'est produite lors de la récupération des tables.");
                } else {
                    // Rendre la vue avec les données des tables
                    res.render('reservation', { tables: results });
                }
            });
        }
    });
});

// routes vers la page privatisation
app.get("/privatisation",(req,res) => {
    res.render('Privatisation')
})

// routes vers la page connexion
app.get("/connexion",(req,res) => {
    res.render('connexion')
})

// route pour l'authentificattion
app.post("/connexion", (req, res) => {
    console.log("Requête POST reçue sur /connexion");
    console.log(req.body);

    const email = req.body.email;
    const password = req.body.password;

    // Construction de la requête SQL avec des paramètres préparés
    const sql = `
        SELECT utilisateur.*, employes.role 
        FROM utilisateur 
        JOIN employes ON utilisateur.employe_id = employes.employe_id 
        WHERE email = ? AND password = ?
    `;

    // Exécution de la requête SQL avec les valeurs des paramètres préparés
    req.getConnection((error, connection) => {
        if (error) {
            console.error("Erreur lors de la connexion à la base de données :", error);
            return res.status(500).send("Une erreur s'est produite lors de la connexion à la base de données.");
        }

        connection.query(sql, [email, password], (error, results) => {
            if (error) {
                console.error("Erreur lors de l'exécution de la requête :", error);
                return res.status(500).send("Une erreur s'est produite lors de l'exécution de la requête.");
            }

            // Vérification si un utilisateur correspondant a été trouvé
            if (results.length > 0) {
                const utilisateur = results[0]; // Supposons que l'utilisateur est le premier résultat
                console.log("Utilisateur trouvé :", utilisateur.email);

                // Redirection en fonction du rôle de l'utilisateur
                if (utilisateur.role === 'Administrateur') {
                    res.redirect('/admin/utilisateur');
                } else if (utilisateur.role === 'gerant') {
                    res.redirect('/gerant/reserv');
                } else {
                    res.status(403).send("Accès non autorisé."); // Gérer les rôles supplémentaires si nécessaire
                }
            } else {
                // Aucun utilisateur correspondant trouvé, envoyer un message d'erreur
                res.status(401).send('Nom d\'utilisateur ou mot de passe incorrect.');
            }
        });
    });
});

// routes vers la page avis
app.get("/avis",(req,res) => {
    req.getConnection((erreur, connection)=>{
        if(erreur){
            console.log(erreur);
        }else{
            connection.query('SELECT * FROM avis WHERE `validation` = 1 ;', [], (erreur, resultat)=>{
                if(erreur){
                    console.log(erreur);
                }else{
                    console.log('avis cli',resultat);
                    res.render('avis',{resultat})
                }
            })
        }
    })
})


// routes vers la liste admin

// gestion des utilisateurs coté administrateur

app.get("/admin/utilisateur", (req, res) => {
    // Connexion à la base de données
    req.getConnection((error, connection) => {
        if (error) {
            console.log(error);
            // Gestion de l'erreur de connexion à la base de données
            res.status(500).send("Une erreur s'est produite lors de la connexion à la base de données.");
        } else {
            // Requête SQL pour récupérer les détails des utilisateurs avec leurs rôles d'employés
            connection.query(
                `SELECT u.utilisateur_id, u.email, u.password, u.nom, u.prenom, e.role
                 FROM utilisateur u
                 JOIN employes e ON u.employe_id = e.employe_id`,
                (error, resultat) => {
                    if (error) {
                        console.log(error);
                        // Gestion de l'erreur lors de l'exécution de la requête SQL
                        res.status(500).send("Une erreur s'est produite lors de la récupération des utilisateurs.");
                    } else {
                        // Filtrer les résultats si nécessaire (par exemple, exclure l'administrateur)
                        const filteredResultat = resultat.filter(user => user.role !== 'Administrateur');
                        // Rendre la vue 'admin/utilisateur' avec les données récupérées
                        res.render('admin/utilisateur', { newResultat: filteredResultat });
                    }
                }
            );
        }
    });
});
app.post("/admin/utilisateur/add", (req, res) => {
    const { email, password, nom, prenom, role } = req.body;

    // Connexion à la base de données
    req.getConnection((error, connection) => {
        if (error) {
            console.error("Erreur de connexion à la base de données :", error);
            res.status(500).send("Une erreur s'est produite lors de la connexion à la base de données.");
        } else {
            // Requête SQL pour récupérer employe_id basé sur le rôle
            connection.query(
                `SELECT employe_id FROM employes WHERE role = ?`,
                [role],
                (error, result) => {
                    if (error) {
                        console.error("Erreur lors de la récupération de l'employé :", error);
                        res.status(500).send("Une erreur s'est produite lors de la récupération de l'employé.");
                    } else if (result.length === 0) {
                        res.status(400).send("L'employé spécifié n'existe pas.");
                    } else {
                        const employeId = result[0].employe_id;

                        // Requête SQL pour ajouter l'utilisateur
                        connection.query(
                            `INSERT INTO utilisateur (email, password, nom, prenom, employe_id) VALUES (?, ?, ?, ?, ?)`,
                            [email, password, nom, prenom, employeId],
                            (error, result) => {
                                if (error) {
                                    console.error("Erreur lors de l'ajout de l'utilisateur :", error);
                                    res.status(500).send("Une erreur s'est produite lors de l'ajout de l'utilisateur.");
                                } else {
                                    res.redirect('/admin/utilisateur');
                                }
                            }
                        );
                    }
                }
            );
        }
    });
});
app.post("/admin/utilisateur/change/:email", (req, res) => {
    const emailId = req.params.email;
    console.log(`Email ID (param): ${emailId}`);
    
    const { email, password, nom, prenom, role } = req.body;
    console.log(`Email (body): ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Nom: ${nom}`);
    console.log(`Prenom: ${prenom}`);
    console.log(`Role: ${role}`);
    
    // Vérifier que toutes les données nécessaires sont présentes
    if (!email || !password || !nom || !prenom || !role) {
        console.error("Toutes les informations de l'utilisateur ne sont pas fournies.");
        return res.status(400).send("Toutes les informations de l'utilisateur doivent être fournies.");
    }

    // Connexion à la base de données
    req.getConnection((error, connection) => {
        if (error) {
            console.error("Erreur de connexion à la base de données :", error);
            return res.status(500).send("Une erreur s'est produite lors de la connexion à la base de données.");
        }
        
        // Requête SQL pour récupérer l'employe_id basé sur le rôle
        connection.query(`SELECT employe_id FROM employes WHERE role = ?`, [role], (error, results) => {
            if (error) {
                console.error("Erreur lors de la récupération de l'employe_id :", error);
                return res.status(500).send("Une erreur s'est produite lors de la récupération de l'employe_id.");
            }
            
            if (results.length === 0) {
                console.error("Aucun employé trouvé avec ce rôle.");
                return res.status(404).send("Aucun employé trouvé avec ce rôle.");
            }
            
            const employeId = results[0].employe_id;
            console.log(`Employe ID: ${employeId}`);
            
            // Requête SQL pour mettre à jour l'utilisateur
            connection.query(
                `UPDATE utilisateur
                 SET email = ?, password = ?, nom = ?, prenom = ?, employe_id = ?
                 WHERE email = ?`,
                [email, password, nom, prenom, employeId, emailId],
                (error, result) => {
                    if (error) {
                        console.error("Erreur lors de la modification de l'utilisateur :", error);
                        return res.status(500).send("Une erreur s'est produite lors de la modification de l'utilisateur.");
                    }
                    res.redirect('/admin/utilisateur');
                }
            );
        });
    });
});
app.post("/admin/utilisateur/delete/:email", (req, res) => {
    const email = req.params.email;

    // Connexion à la base de données
    req.getConnection((erreur, connection) => {
        if (erreur) {
            console.log("Erreur lors de la connexion à la base de données :", erreur);
            res.status(500).send("Une erreur s'est produite lors de la connexion à la base de données.");
        } else {
            // Exécuter la requête de suppression
            connection.query("DELETE FROM utilisateur WHERE email = ?", [email], (erreur, resultats) => {
                if (erreur) {
                    console.log("Erreur lors de l'exécution de la requête de suppression :", erreur);
                    res.status(500).send("Une erreur s'est produite lors de la suppression de l'utilisateur.");
                } else {
                    console.log("Utilisateur supprimé avec succès !");
                    res.redirect("/admin/utilisateur");
                }
            });
        }
    });
});


//gestion des tables coté administrateur

app.get("/admin/table", (req, res) => {
    // Connexion à la base de données
    req.getConnection((error, connection) => {
        if (error) {
            console.error("Erreur de connexion à la base de données :", error);
            res.status(500).send("Une erreur s'est produite lors de la connexion à la base de données.");
        } else {
            // Requête SQL pour récupérer les détails des tables en excluant celle avec table_id = 12
            const sql = `
                SELECT table_id, capacite, disponible, num_tabl 
                FROM tabls
                WHERE table_id != 12
            `;
            connection.query(sql, (error, result) => {
                if (error) {
                    console.error("Erreur lors de la récupération des tables :", error);
                    res.status(500).send("Une erreur s'est produite lors de la récupération des tables.");
                } else {
                    // Rendre la vue avec les données des tables
                    res.render('admin/table', { tables: result });
                }
            });
        }
    });
});
app.post("/admin/table/:table_id/disponible/:disponible",(req,res) => {
    const disponible = req.params.disponible === "1" ? '0' : '1';
    console.log(disponible);
    const tableId = req.params.table_id;
    console.log(tableId);
    console.log(req.params);
      // Connexion à la base de données
    req.getConnection((error, connection) => {
       if (error) {
           console.log(error);
           // Gestion de l'erreur de connexion à la base de données
           res.status(500).send("Une erreur s'est produite lors de la connexion à la base de données.");
       } else {
           // Exécution de la requête SQL pour mettre à jour l'avis
           connection.query(`UPDATE tabls SET  disponible = ? WHERE table_id = ?;`,
               [disponible, tableId],
               (error, result) => {
                   if (error) {
                       console.log(error);
                       // Gestion de l'erreur lors de l'exécution de la requête SQL
                       res.status(500).send("Une erreur s'est produite lors de la modification du service.");
                   } else {
                       // Redirection vers une page de confirmation ou une liste de avis
                       res.redirect('/admin/table');
                   }
               }
           );
       }
   })
})


// gestion des réservations coté administrateur

app.get("/admin/reservation",(req,res) => {
    // Connexion à la base de données
    req.getConnection((error, connection) => {
        if (error) {
            console.error("Erreur de connexion à la base de données :", error);
            res.status(500).send("Une erreur s'est produite lors de la connexion à la base de données.");
        } else {
            // Requête SQL pour récupérer les détails des réservations avec jointure
            const sql = `
               SELECT 
                    r.reserve_id, 
                    r.salle, 
                    r.date, 
                    r.heure, 
                    r.nom, 
                    r.prenom, 
                    r.email,
                    r.phone,
                    r.message,
                    t.capacite AS capacite, 
                    t.num_tabl AS num
                FROM 
                    reservation r
                JOIN 
                    tabls t ON r.table_id = t.table_id
            `;
            connection.query(sql, (error, results) => {
                if (error) {
                    console.error("Erreur lors de la récupération des réservations :", error);
                    res.status(500).send("Une erreur s'est produite lors de la récupération des réservations.");
                } else {
                    // Rendre la vue avec les données des réservations
                    console.log(results);
                    res.render('admin/reservation', { reservations: results });
                }
            });
        }
    });
});
app.post("/admin/reservation/add", (req, res) => {
    const { nom, prenom, email, phone, message, capacite, date, heure, salle } = req.body;
    console.log(nom, prenom, email, phone, message, capacite, date, heure, salle);
    console.log(nom);
    console.log(capacite);
    // Connexion à la base de données
    req.getConnection((error, connection) => {
        if (error) {
            console.error("Erreur de connexion à la base de données :", error);
            res.status(500).send("Une erreur s'est produite lors de la connexion à la base de données.");
        } else {
            // Requête SQL pour insérer la nouvelle réservation
            const sql = `
                INSERT INTO reservation (nom, prenom, email, phone, message, table_id, salle, date, heure)
                VALUES (?, ?, ?, ?, ?, 
                    (SELECT table_id FROM tabls WHERE capacite = ? AND disponible = 1 LIMIT 1), 
                    'non', ?, ?)
            `;

            connection.query(sql, [nom, prenom, email, phone, message, capacite, date, heure], (error, results) => {
                if (error) {
                    console.error("Erreur lors de l'ajout de la réservation :", error);
                    res.status(500).send("Une erreur s'est produite lors de l'ajout de la réservation.");
                } else {
                    // Mettre à jour la table sélectionnée comme non disponible
                    const updateTableSql = `
                        UPDATE tabls
                        SET disponible = 0
                        WHERE table_id = (SELECT table_id FROM reservation WHERE reserve_id = ?)
                    `;
                    connection.query(updateTableSql, [results.insertId], (updateError) => {
                        if (updateError) {
                            console.error("Erreur lors de la mise à jour de la disponibilité de la table :", updateError);
                            res.status(500).send("Une erreur s'est produite lors de la mise à jour de la disponibilité de la table.");
                        } else {
                            res.redirect('/admin/reservation');
                        }
                    });
                }
            });
        }
    });
});
app.post("/admin/reservation/delete/:nom", (req, res) => {
    const nom = req.params.nom;

    // Connexion à la base de données
    req.getConnection((error, connection) => {
        if (error) {
            console.error("Erreur de connexion à la base de données :", error);
            res.status(500).send("Une erreur s'est produite lors de la connexion à la base de données.");
        } else {
            // Requête SQL pour récupérer l'identifiant de la table de la réservation
            const getTableIdSql = `
                SELECT table_id FROM reservation WHERE nom = ?
            `;
            connection.query(getTableIdSql, [nom], (error, results) => {
                if (error) {
                    console.error("Erreur lors de la récupération de l'identifiant de la table :", error);
                    res.status(500).send("Une erreur s'est produite lors de la récupération de l'identifiant de la table.");
                } else if (results.length === 0) {
                    console.error("Aucune réservation trouvée avec le nom spécifié.");
                    res.status(404).send("Aucune réservation trouvée avec le nom spécifié.");
                } else {
                    const tableId = results[0].table_id;

                    // Requête SQL pour supprimer la réservation
                    const deleteReservationSql = `
                        DELETE FROM reservation
                        WHERE nom = ?
                    `;
                    connection.query(deleteReservationSql, [nom], (error, results) => {
                        if (error) {
                            console.error("Erreur lors de la suppression de la réservation :", error);
                            res.status(500).send("Une erreur s'est produite lors de la suppression de la réservation.");
                        } else {
                            // Mettre à jour la disponibilité de la table à nouveau disponible
                            const updateTableSql = `
                                UPDATE tabls
                                SET disponible = 1
                                WHERE table_id = ?
                            `;
                            connection.query(updateTableSql, [tableId], (updateError) => {
                                if (updateError) {
                                    console.error("Erreur lors de la mise à jour de la disponibilité de la table :", updateError);
                                    res.status(500).send("Une erreur s'est produite lors de la mise à jour de la disponibilité de la table.");
                                } else {
                                    res.redirect('/admin/reservation');
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});
app.post("/admin/reservation/change/:reserve_id", (req, res) => {
    const { reserve_id } = req.params;
    const { nom, prenom, email, phone, message, capacite, date, heure, salle } = req.body;

    req.getConnection((error, connection) => {
        if (error) {
            console.error("Erreur de connexion à la base de données :", error);
            res.status(500).send("Une erreur s'est produite lors de la connexion à la base de données.");
        } else {
            // Requête SQL pour récupérer l'ancienne table_id de la réservation
            const getOldTableSql = `
                SELECT table_id 
                FROM reservation 
                WHERE reserve_id = ?
            `;
            connection.query(getOldTableSql, [reserve_id], (error, oldTableResults) => {
                if (error) {
                    console.error("Erreur lors de la récupération de l'ancienne table :", error);
                    res.status(500).send("Une erreur s'est produite lors de la récupération de l'ancienne table.");
                } else {
                    const oldTableId = oldTableResults[0].table_id;

                    // Requête SQL pour trouver une nouvelle table disponible
                    const findNewTableSql = `
                        SELECT table_id 
                        FROM tabls 
                        WHERE capacite = ? AND disponible = 1 
                        LIMIT 1
                    `;
                    connection.query(findNewTableSql, [capacite], (error, newTableResults) => {
                        if (error) {
                            console.error("Erreur lors de la recherche d'une nouvelle table :", error);
                            res.status(500).send("Une erreur s'est produite lors de la recherche d'une nouvelle table.");
                        } else if (newTableResults.length === 0) {
                            res.status(400).send("Aucune table disponible pour la capacité spécifiée.");
                        } else {
                            const newTableId = newTableResults[0].table_id;

                            // Requête SQL pour mettre à jour la réservation
                            const updateReservationSql = `
                                UPDATE reservation
                                SET nom = ?, prenom = ?, email = ?, phone = ?, message = ?, salle = ?, date = ?, heure = ?, 
                                    table_id = ?
                                WHERE reserve_id = ?
                            `;
                            connection.query(updateReservationSql, [nom, prenom, email, phone, message, salle, date, heure, newTableId, reserve_id], (error, results) => {
                                if (error) {
                                    console.error("Erreur lors de la mise à jour de la réservation :", error);
                                    res.status(500).send("Une erreur s'est produite lors de la mise à jour de la réservation.");
                                } else {
                                    // Mettre à jour l'ancienne table comme disponible
                                    const updateOldTableSql = `
                                        UPDATE tabls
                                        SET disponible = 1
                                        WHERE table_id = ?
                                    `;
                                    connection.query(updateOldTableSql, [oldTableId], (updateOldError) => {
                                        if (updateOldError) {
                                            console.error("Erreur lors de la mise à jour de l'ancienne table :", updateOldError);
                                            res.status(500).send("Une erreur s'est produite lors de la mise à jour de l'ancienne table.");
                                        } else {
                                            // Mettre à jour la nouvelle table comme non disponible
                                            const updateNewTableSql = `
                                                UPDATE tabls
                                                SET disponible = 0
                                                WHERE table_id = ?
                                            `;
                                            connection.query(updateNewTableSql, [newTableId], (updateNewError) => {
                                                if (updateNewError) {
                                                    console.error("Erreur lors de la mise à jour de la nouvelle table :", updateNewError);
                                                    res.status(500).send("Une erreur s'est produite lors de la mise à jour de la nouvelle table.");
                                                } else {
                                                    res.redirect('/admin/reservation');
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});




// route pour gérer la confirmation de réservation
app.post("/confirme", (req, res) => {
    const { nom, prenom, email, phone, message, date, heure, capacite } = req.body;
    console.log('===========')
    console.log(capacite, nom, prenom, email, phone, message, date, heure);
    console.log('===========')
    
    req.getConnection((error, connection) => {
        if (error) {
            console.error("Erreur de connexion à la base de données :", error);
            res.status(500).send("Une erreur s'est produite lors de la connexion à la base de données.");
        } else {
            const sql = `
                INSERT INTO reservation (nom, prenom, email, phone, message, table_id, salle, date, heure)
                VALUES (?, ?, ?, ?, ?, ?, 'non', ?, ?) `;
            // (SELECT table_id FROM tabls WHERE capacite = ? AND disponible = 1 LIMIT 1)
            connection.query(sql, [nom, prenom, email, phone, message, capacite, 'non', date, heure], (error, results) => {
                if (error) {
                    console.error("Erreur lors de l'ajout de la réservation :", error);
                    res.status(500).send("Une erreur s'est produite lors de l'ajout de la réservation.");
                } else {
                    const updateTableSql = `
                        UPDATE tabls
                        SET disponible = 0
                        WHERE table_id = (SELECT table_id FROM reservation WHERE reserve_id = ?)
                    `;
                    connection.query(updateTableSql, [results.insertId], (updateError) => {
                        if (updateError) {
                            console.error("Erreur lors de la mise à jour de la disponibilité de la table :", updateError);
                            res.status(500).send("Une erreur s'est produite lors de la mise à jour de la disponibilité de la table.");
                        } else {
                          let transporter = nodemailer.createTransport({
                            service: 'SendGrid',
                            auth: {
                              user: 'apikey', // C'est toujours 'apikey' pour SendGrid
                              pass: 'SG.4FQ68nyYSeuo4gFS5zWTbQ.kemZddy9TG5BqqdyQ26QX8ZDkXz9Y8a67ViMXMuoFQ4'
                            }
                          });
                          let mailOptions = {
                            from: 'neron.riad@gmail.com',
                            to: email,
                            subject: 'Votre réservation est validée',
                            text: `Nous avons bien reçu votre réservation nous vous contacterons pour la confirmation`
                          };
                          transporter.sendMail(mailOptions, function(error, info){
                            if (error) {
                              return console.log(error);
                            }
                            console.log('Email envoyé: ' + info.response);
                            res.redirect('reservation'); // Rediriger vers une page de réservation
                          });
                        }
                    });
                }
            });
        }
    });
  });
  
// route pour gérer la confirmation de privatisation
app.post("/approuve", (req, res) => {
    const { salle, date, nom, prenom, phone, email, message } = req.body;
    console.log(salle, date, nom, prenom, phone, email, message );

    // Connexion à la base de données
    req.getConnection((error, connection) => {
        if (error) {
            console.error("Erreur de connexion à la base de données :", error);
            res.status(500).send("Une erreur s'est produite lors de la connexion à la base de données.");
        } else {
            // Requête SQL pour insérer la réservation
            const sql = "INSERT INTO reservation (salle, date, nom, prenom, phone, email, message, table_id) VALUES (?, ?, ?, ?, ?, ?, ?,?)";
            const salleId = salle === 'oui' ? 1 : 0; // Exemple de condition pour salle
            connection.query(sql, [salleId, date, nom, prenom, phone, email, message, 12], (error, result) => {
                if (error) {
                    console.error("Erreur lors de l'ajout de la réservation :", error);
                    res.status(500).send("Une erreur s'est produite lors de l'ajout de la réservation.");
                } else {
                    let transporter = nodemailer.createTransport({
                        service: 'SendGrid',
                        auth: {
                          user: 'apikey', // C'est toujours 'apikey' pour SendGrid
                          pass: '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'
                        }
                      });
                      let mailOptions = {
                        from: '',
                        to: req.body.email,
                        subject: 'Votre réservation est validée',
                        text: `Nous avons bien reçu votre réservation nous vous contacterons pour la confirmation`
                      };
                      transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                          return console.log(error);
                        }
                        console.log('Email envoyé: ' + info.response);
                        res.redirect('privatisation'); // Rediriger vers une page de privatisation
                      });
                }
            });
        }
    });
});


// routes vers la liste gérant

// gestion des réservations coté administrateur

app.get("/gerant/reserv",(req,res) => {
    // Connexion à la base de données
    req.getConnection((error, connection) => {
        if (error) {
            console.error("Erreur de connexion à la base de données :", error);
            res.status(500).send("Une erreur s'est produite lors de la connexion à la base de données.");
        } else {
            // Requête SQL pour récupérer les détails des réservations avec jointure
            const sql = `
               SELECT 
                    r.reserve_id, 
                    r.salle, 
                    r.date, 
                    r.heure, 
                    r.nom, 
                    r.prenom, 
                    r.email,
                    r.phone,
                    r.message,
                    t.capacite AS capacite, 
                    t.num_tabl AS num
                FROM 
                    reservation r
                JOIN 
                    tabls t ON r.table_id = t.table_id
            `;
            connection.query(sql, (error, results) => {
                if (error) {
                    console.error("Erreur lors de la récupération des réservations :", error);
                    res.status(500).send("Une erreur s'est produite lors de la récupération des réservations.");
                } else {
                    // Rendre la vue avec les données des réservations
                    console.log(results);
                    res.render('gerant/reserv', { reservations: results });
                }
            });
        }
    });
});
app.post("/gerant/reserv/add", (req, res) => {
    const { nom, prenom, email, phone, message, capacite, date, heure, salle } = req.body;
    console.log(nom, prenom, email, phone, message, capacite, date, heure, salle);
    // Connexion à la base de données
    req.getConnection((error, connection) => {
        if (error) {
            console.error("Erreur de connexion à la base de données :", error);
            res.status(500).send("Une erreur s'est produite lors de la connexion à la base de données.");
        } else {
            // Requête SQL pour insérer la nouvelle réservation
            const sql = `
                INSERT INTO reservation (nom, prenom, email, phone, message, table_id, salle, date, heure)
                VALUES (?, ?, ?, ?, ?, 
                    (SELECT table_id FROM tabls WHERE capacite = ? AND disponible = 1 LIMIT 1), 
                    'non', ?, ?)
            `;

            connection.query(sql, [nom, prenom, email, phone, message, capacite, date, heure], (error, results) => {
                if (error) {
                    console.error("Erreur lors de l'ajout de la réservation :", error);
                    res.status(500).send("Une erreur s'est produite lors de l'ajout de la réservation.");
                } else {
                    // Mettre à jour la table sélectionnée comme non disponible
                    const updateTableSql = `
                        UPDATE tabls
                        SET disponible = 0
                        WHERE table_id = (SELECT table_id FROM reservation WHERE reserve_id = ?)
                    `;
                    connection.query(updateTableSql, [results.insertId], (updateError) => {
                        if (updateError) {
                            console.error("Erreur lors de la mise à jour de la disponibilité de la table :", updateError);
                            res.status(500).send("Une erreur s'est produite lors de la mise à jour de la disponibilité de la table.");
                        } else {
                            res.redirect('gerant/reserv');
                        }
                    });
                }
            });
        }
    });
});
app.post("/gerant/reserv/delete/:nom", (req, res) => {
    const nom = req.params.nom;

    // Connexion à la base de données
    req.getConnection((error, connection) => {
        if (error) {
            console.error("Erreur de connexion à la base de données :", error);
            res.status(500).send("Une erreur s'est produite lors de la connexion à la base de données.");
        } else {
            // Requête SQL pour récupérer l'identifiant de la table de la réservation
            const getTableIdSql = `
                SELECT table_id FROM reservation WHERE nom = ?
            `;
            connection.query(getTableIdSql, [nom], (error, results) => {
                if (error) {
                    console.error("Erreur lors de la récupération de l'identifiant de la table :", error);
                    res.status(500).send("Une erreur s'est produite lors de la récupération de l'identifiant de la table.");
                } else if (results.length === 0) {
                    console.error("Aucune réservation trouvée avec le nom spécifié.");
                    res.status(404).send("Aucune réservation trouvée avec le nom spécifié.");
                } else {
                    const tableId = results[0].table_id;

                    // Requête SQL pour supprimer la réservation
                    const deleteReservationSql = `
                        DELETE FROM reservation
                        WHERE nom = ?
                    `;
                    connection.query(deleteReservationSql, [nom], (error, results) => {
                        if (error) {
                            console.error("Erreur lors de la suppression de la réservation :", error);
                            res.status(500).send("Une erreur s'est produite lors de la suppression de la réservation.");
                        } else {
                            // Mettre à jour la disponibilité de la table à nouveau disponible
                            const updateTableSql = `
                                UPDATE tabls
                                SET disponible = 1
                                WHERE table_id = ?
                            `;
                            connection.query(updateTableSql, [tableId], (updateError) => {
                                if (updateError) {
                                    console.error("Erreur lors de la mise à jour de la disponibilité de la table :", updateError);
                                    res.status(500).send("Une erreur s'est produite lors de la mise à jour de la disponibilité de la table.");
                                } else {
                                    res.redirect('/gerant/reserv');
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});
app.post("/gerant/reserv/change/:reserve_id", (req, res) => {
    const { reserve_id } = req.params;
    const { nom, prenom, email, phone, message, capacite, date, heure, salle } = req.body;

    req.getConnection((error, connection) => {
        if (error) {
            console.error("Erreur de connexion à la base de données :", error);
            res.status(500).send("Une erreur s'est produite lors de la connexion à la base de données.");
        } else {
            // Requête SQL pour récupérer l'ancienne table_id de la réservation
            const getOldTableSql = `
                SELECT table_id 
                FROM reservation 
                WHERE reserve_id = ?
            `;
            connection.query(getOldTableSql, [reserve_id], (error, oldTableResults) => {
                if (error) {
                    console.error("Erreur lors de la récupération de l'ancienne table :", error);
                    res.status(500).send("Une erreur s'est produite lors de la récupération de l'ancienne table.");
                } else {
                    const oldTableId = oldTableResults[0].table_id;

                    // Requête SQL pour trouver une nouvelle table disponible
                    const findNewTableSql = `
                        SELECT table_id 
                        FROM tabls 
                        WHERE capacite = ? AND disponible = 1 
                        LIMIT 1
                    `;
                    connection.query(findNewTableSql, [capacite], (error, newTableResults) => {
                        if (error) {
                            console.error("Erreur lors de la recherche d'une nouvelle table :", error);
                            res.status(500).send("Une erreur s'est produite lors de la recherche d'une nouvelle table.");
                        } else if (newTableResults.length === 0) {
                            res.status(400).send("Aucune table disponible pour la capacité spécifiée.");
                        } else {
                            const newTableId = newTableResults[0].table_id;

                            // Requête SQL pour mettre à jour la réservation
                            const updateReservationSql = `
                                UPDATE reservation
                                SET nom = ?, prenom = ?, email = ?, phone = ?, message = ?, salle = ?, date = ?, heure = ?, 
                                    table_id = ?
                                WHERE reserve_id = ?
                            `;
                            connection.query(updateReservationSql, [nom, prenom, email, phone, message, salle, date, heure, newTableId, reserve_id], (error, results) => {
                                if (error) {
                                    console.error("Erreur lors de la mise à jour de la réservation :", error);
                                    res.status(500).send("Une erreur s'est produite lors de la mise à jour de la réservation.");
                                } else {
                                    // Mettre à jour l'ancienne table comme disponible
                                    const updateOldTableSql = `
                                        UPDATE tabls
                                        SET disponible = 1
                                        WHERE table_id = ?
                                    `;
                                    connection.query(updateOldTableSql, [oldTableId], (updateOldError) => {
                                        if (updateOldError) {
                                            console.error("Erreur lors de la mise à jour de l'ancienne table :", updateOldError);
                                            res.status(500).send("Une erreur s'est produite lors de la mise à jour de l'ancienne table.");
                                        } else {
                                            // Mettre à jour la nouvelle table comme non disponible
                                            const updateNewTableSql = `
                                                UPDATE tabls
                                                SET disponible = 0
                                                WHERE table_id = ?
                                            `;
                                            connection.query(updateNewTableSql, [newTableId], (updateNewError) => {
                                                if (updateNewError) {
                                                    console.error("Erreur lors de la mise à jour de la nouvelle table :", updateNewError);
                                                    res.status(500).send("Une erreur s'est produite lors de la mise à jour de la nouvelle table.");
                                                } else {
                                                    res.redirect('/gerant/reserv');
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

//gestion des tables coté administrateur

app.get("/gerant/tablo", (req, res) => {
    // Connexion à la base de données
    req.getConnection((error, connection) => {
        if (error) {
            console.error("Erreur de connexion à la base de données :", error);
            res.status(500).send("Une erreur s'est produite lors de la connexion à la base de données.");
        } else {
            // Requête SQL pour récupérer les détails des tables en excluant celle avec table_id = 12
            const sql = `
                SELECT table_id, capacite, disponible, num_tabl 
                FROM tabls
                WHERE table_id != 12
            `;
            connection.query(sql, (error, result) => {
                if (error) {
                    console.error("Erreur lors de la récupération des tables :", error);
                    res.status(500).send("Une erreur s'est produite lors de la récupération des tables.");
                } else {
                    // Rendre la vue avec les données des tables
                    res.render('gerant/tablo', { tables: result });
                }
            });
        }
    });
});
app.post("/gerant/tablo/:table_id/disponible/:disponible",(req,res) => {
    const disponible = req.params.disponible === "1" ? '0' : '1';
    console.log(disponible);
    const tableId = req.params.table_id;
    console.log(tableId);
    console.log(req.params);
      // Connexion à la base de données
    req.getConnection((error, connection) => {
       if (error) {
           console.log(error);
           // Gestion de l'erreur de connexion à la base de données
           res.status(500).send("Une erreur s'est produite lors de la connexion à la base de données.");
       } else {
           // Exécution de la requête SQL pour mettre à jour l'avis
           connection.query(`UPDATE tabls SET  disponible = ? WHERE table_id = ?;`,
               [disponible, tableId],
               (error, result) => {
                   if (error) {
                       console.log(error);
                       // Gestion de l'erreur lors de l'exécution de la requête SQL
                       res.status(500).send("Une erreur s'est produite lors de la modification du service.");
                   } else {
                       // Redirection vers une page de confirmation ou une liste de avis
                       res.redirect('/gerant/tablo');
                   }
               }
           );
       }
   })
})



// gestion des avis coté gérant
app.get("/gerant/avis",(req,res) => {
    req.getConnection((erreur, connection)=>{
        if(erreur){
            console.log(erreur);
        }else{
            connection.query('SELECT * FROM avis;', [], (erreur, resultat)=>{
                if(erreur){
                    console.log(erreur);
                }else{
                    console.log('avis cli',resultat);
                    res.render('./gerant/avis',{resultat})
                }
            })
        }
    })
})
app.post('/gerant/avis/:avis_id/validation/:validation', async (req, res) => {
    const validation = req.params.validation === "1" ? 1 : null;
    const avisId = req.params.avis_id;
    console.log(req.params);
      // Connexion à la base de données
    req.getConnection((error, connection) => {
       if (error) {
           console.log(error);
           // Gestion de l'erreur de connexion à la base de données
           res.status(500).send("Une erreur s'est produite lors de la connexion à la base de données.");
       } else {
           // Exécution de la requête SQL pour mettre à jour l'avis
           connection.query(`UPDATE avis SET  validation = ? WHERE avis_id = ?;`,
               [validation, avisId],
               (error, result) => {
                   if (error) {
                       console.log(error);
                       // Gestion de l'erreur lors de l'exécution de la requête SQL
                       res.status(500).send("Une erreur s'est produite lors de la modification du service.");
                   } else {
                       // Redirection vers une page de confirmation ou une liste de avis
                       res.redirect('/gerant/avis');
                   }
               }
           );
       }
   })
})
app.post("/ajout_commentaire",(req,res)=>{
    let message = req.body.message;
    let pseudo = req.body.pseudo;
    
    req.getConnection((erreur, connection)=>{
     if(erreur){
         console.log(erreur);
     }else{
         connection.query(`INSERT INTO avis(message,pseudo) VALUES(?,?);`, [message,pseudo], (erreur, resultat)=>{
             if(erreur){
                 console.log(erreur);
             }else{
                 res.redirect('/avis');
             }
         })
      }
   })
});





app.listen(8080,()=>{
    console.log("Serveur en écoute...")
})