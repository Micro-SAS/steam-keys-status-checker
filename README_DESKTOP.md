# 🔑 Steam Keys Status Checker - Application Desktop

## 🚀 Démarrage Rapide

### Option 1 : Exécutable (Recommandé)
1. Téléchargez `SteamKeysChecker.exe` (Windows) ou `SteamKeysChecker` (Mac/Linux)
2. Double-cliquez pour lancer l'application
3. Suivez les instructions à l'écran

### Option 2 : Script Python
1. Installez Python 3.8+ sur votre système
2. Exécutez le script d'installation :
   - Windows : `install.bat`
   - Mac/Linux : `./install.sh`
3. Lancez l'application : `python steam_keys_gui.py`

## 📋 Utilisation

1. **Choisir fichier CSV** : Sélectionnez votre fichier de clés Steam
2. **Configuration** : 
   - Cochez "2 colonnes" si vous avez deux colonnes de clés
   - Ajustez les noms des colonnes si nécessaire
3. **Lancer la vérification** : Chrome s'ouvrira automatiquement
4. **Connexion Steamworks** : Connectez-vous dans la fenêtre Chrome
5. **Attendre** : La vérification se fait automatiquement
6. **Récupérer** : Le CSV avec les statuts sera sauvegardé

## 🔧 Configuration CSV

Votre fichier CSV doit contenir :
- **Colonnes de clés** : `key_1`, `key_2` (optionnel)
- **Colonne de filtrage** : `to check` (valeurs: true/false, 1/0, yes/no)

## 📊 Résultats

Les statuts suivants sont détectés :
- **Activated** : Clé déjà utilisée
- **Not activated** : Clé disponible
- **Invalid** : Clé non valide
- **Error** : Problème lors de la vérification

## ⚠️ Prérequis

- Compte Steamworks Partner valide
- Connexion Internet stable
- Chrome installé sur votre système

## 🆘 Support

En cas de problème :
1. Vérifiez que Chrome est installé
2. Vérifiez votre connexion Steamworks
3. Consultez les logs dans l'application
4. Contactez le support : [GitHub Issues](https://github.com/Micro-SAS/steam-keys-status-checker/issues)

---

**Version 2.0 Desktop** - Créé par [Micro-SAS](https://github.com/Micro-SAS)
