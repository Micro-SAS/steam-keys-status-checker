# 🔑 Steam Keys Status Checker - Application Desktop

**Outil automatisé de vérification des clés Steam via Steamworks Partner avec interface graphique moderne**

---

## ✨ Fonctionnalités

- **Interface graphique intuitive** avec Tkinter
- **Lecture automatique** d'un fichier CSV contenant des clés Steam
- **Vérification automatisée** via https://partner.steamgames.com/querycdkey/
- **Support multi-colonnes** : `key_1` et `key_2` (optionnel)
- **Saisie robuste** : caractère par caractère pour éviter les erreurs
- **Détection améliorée** : support des formats de couleur RGB et HEX
- **Filtrage intelligent** : basé sur la colonne de filtrage pour éviter les vérifications inutiles
- **Sauvegarde automatique** des résultats avec timestamp
- **Interface utilisateur moderne** avec progression en temps réel
- **Gestion des erreurs** et protection contre les abus
- **Délais aléatoires** entre les vérifications pour éviter la détection
- **Exécutable distributable** pour faciliter l'installation

## 🚀 Installation et Utilisation

### Option 1 : Exécutable (Recommandé)

1. **Téléchargez l'exécutable** depuis les [Releases GitHub](https://github.com/Micro-SAS/steam-keys-status-checker/releases)
2. **Double-cliquez** sur `SteamKeysChecker.exe` (Windows) ou `SteamKeysChecker` (Mac/Linux)
3. **Suivez l'interface** graphique

### Option 2 : Script Python

```bash
# 1. Clonez le repository
git clone https://github.com/Micro-SAS/steam-keys-status-checker.git
cd steam-keys-status-checker

# 2. Installez les dépendances
# Windows
install.bat

# Mac/Linux
./install.sh

# 3. Lancez l'application
python steam_keys_gui.py
```

## 📋 Guide d'utilisation

### 1. **Interface principale**
![Interface](docs/interface.png)

### 2. **Étapes d'utilisation**

1. **📁 Choisir fichier CSV** : Cliquez sur "Choisir fichier CSV" et sélectionnez votre fichier
2. **⚙️ Configuration** :
   - Cochez "J'ai 2 colonnes de clés Steam" si nécessaire
   - Ajustez les noms des colonnes (par défaut : `key_1`, `key_2`)
   - Configurez la colonne de filtrage (par défaut : `to check`)
3. **🚀 Lancer la vérification** :
   - Cliquez sur "Lancer la vérification"
   - Chrome s'ouvrira automatiquement
   - Connectez-vous à votre compte Steamworks
   - Confirmez pour démarrer la vérification automatique
4. **📊 Suivre la progression** : La barre de progression et les logs vous informent en temps réel
5. **💾 Récupérer les résultats** : Le CSV avec les statuts sera sauvegardé automatiquement

## 🔧 Format du fichier CSV

### Structure requise
Votre fichier CSV doit contenir :
- **Une colonne `key_1`** avec les clés Steam principales
- **Une colonne `key_2`** avec les clés Steam secondaires (optionnel)
- **Une colonne de filtrage** (par défaut `to check`) pour déterminer quelles lignes traiter

### Exemple de structure :
```csv
steam tag,key_1,key_2,to check,date creation,Status,type,medium
Game1,XXXXX-XXXXX-XXXXX,YYYYY-YYYYY-YYYYY,true,2024-01-01,Sent,Review,Twitch
Game2,AAAAA-AAAAA-AAAAA,,true,2024-01-02,Pending,Review,YouTube
Game3,BBBBB-BBBBB-BBBBB,CCCCC-CCCCC-CCCCC,false,2024-01-03,Draft,Review,Blog
```

### Colonnes générées automatiquement :
- `key_1_status` : Statut de la clé principale
- `key_2_status` : Statut de la clé secondaire (si présente)

## 📊 Statuts détectés

- **"Activated"** : Clé déjà utilisée/activée (couleur bleue sur Steamworks)
- **"Not activated"** : Clé valide et disponible (couleur rouge sur Steamworks)
- **"Invalid"** : Clé non valide ou expirée
- **"Error: ..."** : Problème lors de la vérification (message détaillé)

## 🛡️ Sécurité et bonnes pratiques

### Protection contre la détection
- **Délais aléatoires** : Entre 1 et 10 secondes entre chaque vérification
- **User-Agent naturel** : Le navigateur apparaît comme normal
- **Saisie humanisée** : Caractère par caractère avec micro-pauses
- **Options anti-détection** : Masquage des signatures d'automatisation

### Gestion des interruptions
- **Bouton Arrêter** : Interrompt proprement et sauvegarde les résultats partiels
- **Sauvegarde continue** : Les résultats sont mis à jour en temps réel
- **Reprise automatique** : Les clés déjà vérifiées sont ignorées

### Confidentialité
- **Exécution locale** : Tout reste sur votre machine
- **Aucun logging** des clés dans les fichiers temporaires
- **Communication directe** uniquement avec le site officiel Steamworks
- **Données privées** : Aucune donnée n'est envoyée à des tiers

## ⚙️ Configuration avancée

### Variables modifiables dans le code :
```python
STEAMWORKS_URL = "https://partner.steamgames.com/querycdkey/"
MIN_DELAY = 1                           # Délai minimum entre vérifications (secondes)
MAX_DELAY = 10                          # Délai maximum entre vérifications (secondes)
```

### Colonnes configurables :
- **Colonne 1** : Nom de la première colonne de clés (défaut: `key_1`)
- **Colonne 2** : Nom de la deuxième colonne de clés (défaut: `key_2`)
- **Colonne filtre** : Nom de la colonne de filtrage (défaut: `to check`)

## 🔨 Développement

### Prérequis de développement
- Python 3.8+
- Chrome ou Chromium installé
- Compte Steamworks Partner valide

### Installation pour développement
```bash
git clone https://github.com/Micro-SAS/steam-keys-status-checker.git
cd steam-keys-status-checker
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

### Créer un exécutable
```bash
python build_app.py
```

## 🚨 Dépannage

### Problèmes courants

#### "Champ cdkey non trouvé"
- ✅ Vérifiez que vous êtes bien connecté à Steamworks
- ✅ La page se charge-t-elle correctement ?
- ✅ Testez manuellement la page querycdkey

#### "Impossible de saisir la clé correctement"
- ✅ Vérifiez que la clé n'a pas de caractères spéciaux
- ✅ Vérifiez le format : `XXXXX-XXXXX-XXXXX`
- ✅ Problème possible : confusion entre `0` (zéro) et `O` (lettre O)

#### Erreurs de ChromeDriver
- ✅ Chrome est-il installé ? (`google-chrome --version`)
- ✅ L'application télécharge automatiquement ChromeDriver
- ✅ Vérifiez votre connexion Internet

### Logs et debugging
- Les logs sont affichés en temps réel dans l'interface
- Un fichier de log est créé automatiquement : `steam_keys_checker_YYYYMMDD_HHMMSS.log`

## 📈 Performance

### Statistiques attendues
- **~6 clés/minute** en moyenne (avec délais de sécurité)
- **100 clés ≈ 15-20 minutes**
- **500 clés ≈ 1h30-2h**

### Recommandations d'usage
- **Lots de 50-100 clés** maximum par session
- **Heures creuses** pour éviter la surcharge du site
- **Test préalable** avec quelques clés

## 🎯 Version et changelog

**Version actuelle** : 2.0 Desktop (Janvier 2025)
- ✅ Interface graphique moderne avec Tkinter
- ✅ Exécutable distributable
- ✅ Saisie caractère par caractère
- ✅ Détection RGB/HEX améliorée  
- ✅ Validation de saisie robuste
- ✅ Support multi-colonnes
- ✅ Filtrage intelligent par colonne
- ✅ Gestion d'erreurs détaillée
- ✅ Progression temps réel
- ✅ Sauvegarde automatique avec timestamp

---

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Ouvrir des [Issues](https://github.com/Micro-SAS/steam-keys-status-checker/issues) pour signaler des bugs
- Proposer des [Pull Requests](https://github.com/Micro-SAS/steam-keys-status-checker/pulls) pour des améliorations
- Partager vos suggestions d'amélioration

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

**Créé par [Micro-SAS](https://github.com/Micro-SAS)** | **Steam Keys Status Checker v2.0** 