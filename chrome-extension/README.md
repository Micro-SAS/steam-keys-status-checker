# 🔑 Steam Keys Checker - Extension Chrome

Extension Chrome pour vérifier automatiquement le statut de vos clés Steam via Steamworks Partner.

## 🚀 Installation

### Méthode 1: Mode développeur (Recommandé pour test)

1. **Téléchargez l'extension**
   - Clonez ce repository ou téléchargez le dossier `chrome-extension`

2. **Ouvrez Chrome**
   - Allez dans `chrome://extensions/`
   - Activez le "Mode développeur" (coin supérieur droit)

3. **Chargez l'extension**
   - Cliquez sur "Charger l'extension non empaquetée"
   - Sélectionnez le dossier `chrome-extension`

4. **Vérification**
   - L'icône Steam Keys Checker devrait apparaître dans la barre d'outils
   - Épinglez-la pour un accès facile

### Méthode 2: Chrome Web Store (À venir)

L'extension sera bientôt disponible sur le Chrome Web Store pour une installation en un clic.

## 📋 Utilisation

### Étape 1: Préparer votre fichier CSV

Votre fichier CSV doit contenir :
- **Au moins une colonne de clés Steam** (ex: `key_1`, `steam_key`)
- **Optionnel**: Une deuxième colonne de clés (ex: `key_2`)
- **Optionnel**: Une colonne "à vérifier" (ex: `to_check`) avec `true`/`false`

Exemple de structure :
```csv
creator_name,key_1,key_2,to_check
John Doe,XXXXX-XXXXX-XXXXX,YYYYY-YYYYY-YYYYY,true
Jane Smith,ZZZZZ-ZZZZZ-ZZZZZ,,false
```

### Étape 2: Utiliser l'extension

1. **Connectez-vous à Steamworks**
   - Ouvrez [Steamworks Partner](https://partner.steamgames.com)
   - Connectez-vous avec vos identifiants
   - Naviguez vers la page de vérification des clés

2. **Lancez l'extension**
   - Cliquez sur l'icône Steam Keys Checker dans Chrome
   - Suivez les étapes dans l'interface :
     - 📁 Importez votre fichier CSV
     - ⚙️ Configurez les colonnes
     - 🔗 Vérifiez la connexion Steamworks
     - 🚀 Lancez la vérification

3. **Récupérez les résultats**
   - Suivez la progression en temps réel
   - Téléchargez le CSV avec les statuts
   - Les résultats incluent : `Activated`, `Not activated`, `Error`

## ✨ Fonctionnalités

- ✅ **Interface moderne** et intuitive
- ✅ **Glisser-déposer** pour l'import de fichiers
- ✅ **Configuration automatique** des colonnes
- ✅ **Progression en temps réel** avec compteurs
- ✅ **Gestion d'erreurs** robuste
- ✅ **Sauvegarde automatique** des résultats
- ✅ **Support de 1 ou 2 colonnes** de clés
- ✅ **Filtrage conditionnel** (colonne "to_check")

## 🔧 Configuration avancée

### Colonnes supportées

L'extension détecte automatiquement :
- **Clés Steam** : colonnes contenant "key", "clé", "steam", "code"
- **Vérification** : colonnes contenant "check", "vérif", "verify"

### Valeurs de vérification

Pour la colonne "à vérifier", ces valeurs sont considérées comme `true` :
- `true`, `True`, `TRUE`
- `1`
- `yes`, `Yes`, `YES`
- `oui`, `Oui`, `OUI`
- `vrai`, `Vrai`, `VRAI`

## 🛡️ Sécurité et confidentialité

- ✅ **Données locales** : Vos clés ne quittent jamais votre navigateur
- ✅ **Connexion directe** : Communication directe avec Steamworks
- ✅ **Pas de serveur tiers** : Aucune donnée transmise à des serveurs externes
- ✅ **Code open source** : Code entièrement vérifiable

## 🐛 Dépannage

### L'extension ne se charge pas
- Vérifiez que le mode développeur est activé
- Assurez-vous que tous les fichiers sont présents
- Rechargez l'extension dans `chrome://extensions/`

### Erreur "Aucun onglet Steamworks trouvé"
- Ouvrez [partner.steamgames.com](https://partner.steamgames.com)
- Connectez-vous à votre compte
- Naviguez vers la page de vérification des clés

### La vérification s'arrête
- Vérifiez votre connexion internet
- Assurez-vous de rester connecté à Steamworks
- Ne fermez pas l'onglet Steamworks pendant la vérification

### Problèmes de CSV
- Vérifiez que votre fichier est au format CSV
- Assurez-vous qu'il y a au moins un en-tête et une ligne de données
- Utilisez des virgules comme séparateurs

## 📊 Limitations

- **Vitesse** : ~30 clés/minute (limitation Steamworks)
- **Navigateur** : Chrome/Edge uniquement (Manifest V3)
- **Connexion** : Nécessite une connexion Steamworks active

## 🔄 Mises à jour

L'extension se met à jour automatiquement quand installée via le Chrome Web Store. 
En mode développeur, rechargez manuellement l'extension pour appliquer les mises à jour.

## 📞 Support

- 🐛 **Bugs** : Ouvrez une issue sur GitHub
- 💡 **Suggestions** : Proposez vos idées via les issues
- 📚 **Documentation** : Consultez le README principal du projet

## 📜 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

---

**Développé avec ❤️ pour la communauté Steam** 