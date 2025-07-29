# Vérificateur de Clés Steam

Ce script Python automatise la vérification du statut des clés Steam via le site Steamworks Partner.

## ✨ Fonctionnalités

- **Lecture automatique** d'un fichier CSV contenant des clés Steam
- **Vérification automatisée** via https://partner.steamgames.com/querycdkey/
- **Support multi-colonnes** : `key_1` et `key_2` (optionnel)
- **Saisie robuste** : caractère par caractère pour éviter les erreurs
- **Détection améliorée** : support des formats de couleur RGB et HEX
- **Filtrage intelligent** : basé sur la colonne `status` pour éviter les vérifications inutiles
- **Sauvegarde automatique** des résultats dans `steam-keys_with_status.csv`
- **Interface utilisateur claire** avec progression en temps réel
- **Gestion des erreurs** et protection contre les abus
- **Délais aléatoires** entre les vérifications pour éviter la détection

## 🔧 Prérequis

### 1. Accès Steamworks
- Vous devez avoir un compte Steamworks Partner valide
- Accès au site https://partner.steamgames.com/querycdkey/

### 2. Installation des dépendances
```bash
pip install pandas selenium webdriver-manager
```

### 3. Navigateur Chrome
- Chrome ou Chromium doit être installé sur votre système
- Le driver sera téléchargé automatiquement via webdriver-manager

## 📋 Format du fichier CSV

### Structure requise
Votre fichier CSV doit être nommé `steam-keys.csv` et contenir :
- Une colonne `key_1` avec les clés Steam principales
- Une colonne `key_2` avec les clés Steam secondaires (optionnel)
- Une colonne `status` pour le filtrage (les lignes avec `status` vide seront ignorées)

### Exemple de structure :
```csv
steam tag,key_1,key_2,status,date creation,A envoyer ?,Status,type,medium,object,message,user name,lang,email,nb_followers,avg_views,tags_top10
Game1,XXXXX-XXXXX-XXXXX,YYYYY-YYYYY-YYYYY,active,2024-01-01,Oui,Sent,Review,Twitch,Our Game,Great game!,streamer1,fr,test@email.com,1000,500,gaming
Game2,AAAAA-AAAAA-AAAAA,,active,2024-01-02,Oui,Pending,Review,YouTube,Our Game,Amazing!,streamer2,en,test2@email.com,2000,1000,indie
```

### Colonnes générées automatiquement :
- `key_1_status` : Statut de la clé principale
- `key_2_status` : Statut de la clé secondaire (si présente)

## 🚀 Utilisation

### 1. Préparation
```bash
# 1. Clonez ou téléchargez le script
# 2. Placez votre fichier CSV dans le même répertoire
# 3. Nommez-le steam-keys.csv
```

### 2. Exécution
```bash
python3 steam_key_checker.py
```

### 3. Processus
1. **Vérification** : Le script lit le CSV et compte les clés à vérifier
2. **Filtrage** : Seules les lignes avec une colonne `status` non vide sont vérifiées
3. **Connexion** : Un navigateur s'ouvre, connectez-vous à Steamworks
4. **Vérification automatique** : Le script vérifie chaque clé une par une
5. **Sauvegarde** : Les résultats sont sauvegardés automatiquement

### 4. Résultats
Les statuts possibles dans les colonnes `key_X_status` :
- **"Activée"** : Clé déjà utilisée/activée (couleur bleue sur Steamworks)
- **"Non activée"** : Clé valide et disponible (couleur rouge sur Steamworks)
- **"Invalide"** : Clé non valide ou expirée
- **"Erreur: ..."** : Problème lors de la vérification (message détaillé)

## ⚙️ Configuration

### Variables modifiables dans le script :
```python
CSV_FILE_PATH = "steam-keys.csv"        # Nom du fichier CSV
MIN_DELAY = 1                           # Délai minimum entre vérifications (secondes)
MAX_DELAY = 10                          # Délai maximum entre vérifications (secondes)
CHECK_KEY_2 = True                      # Vérifier aussi la colonne key_2
```

### Mode headless (sans interface graphique)
Décommentez la ligne 39 dans le script :
```python
chrome_options.add_argument("--headless")
```

## 🛡️ Sécurité et bonnes pratiques

### Protection contre la détection
- **Délais aléatoires** : Entre 1 et 10 secondes entre chaque vérification
- **User-Agent naturel** : Le navigateur apparaît comme normal
- **Saisie humanisée** : Caractère par caractère avec micro-pauses
- **Options anti-détection** : Masquage des signatures d'automatisation

### Gestion des interruptions
- **Ctrl+C** : Interrompt proprement et sauvegarde les résultats partiels
- **Sauvegarde continue** : Les résultats sont mis à jour en temps réel
- **Reprise automatique** : Les clés déjà vérifiées sont ignorées

### Confidentialité
- **Aucun logging** des clés dans les fichiers temporaires
- **Communication directe** uniquement avec le site officiel Steamworks
- **Données locales** : Tout reste sur votre machine

## 🔍 Fonctionnalités avancées

### Filtrage intelligent
Le script ne vérifie que les lignes où :
- La colonne `status` n'est **pas vide**
- La clé n'a **pas déjà été vérifiée** (colonne `key_X_status` vide)
- La clé **existe et n'est pas vide**

### Double vérification
- **Validation de saisie** : Vérifie que la clé est bien dans le champ
- **Contrôle post-soumission** : Confirme que la clé a été soumise
- **Re-tentative automatique** : En cas d'échec de saisie

### Détection de statut robuste
- **Couleurs HEX** : `#67c1f5` (Activée), `#e24044` (Non activée)
- **Couleurs RGB** : `rgb(103, 193, 245)` (Activée), `rgb(226, 64, 68)` (Non activée)
- **Texte** : Détection par contenu textuel en fallback
- **Multi-méthodes** : Plusieurs stratégies de détection en cascade

## 🚨 Dépannage

### "Champ cdkey non trouvé"
- ✅ Vérifiez que vous êtes bien connecté à Steamworks
- ✅ La page se charge-t-elle correctement ?
- ✅ Testez manuellement la page querycdkey

### "Impossible de saisir la clé correctement"
- ✅ Vérifiez que la clé n'a pas de caractères spéciaux
- ✅ Vérifiez le format : `XXXXX-XXXXX-XXXXX`
- ✅ Problème possible : confusion entre `0` (zéro) et `O` (lettre O)

### "La clé n'a pas été soumise correctement"
- ✅ Problème réseau ou page lente
- ✅ Augmentez le délai dans `time.sleep(3)`
- ✅ Vérifiez votre connexion Internet

### Erreurs de ChromeDriver
- ✅ Chrome est-il installé ? (`google-chrome --version`)
- ✅ Réinstallez webdriver-manager : `pip install --upgrade webdriver-manager`

### Résultats inattendus
- ✅ Vérifiez manuellement quelques clés sur le site Steamworks
- ✅ Comparez avec le script de debug : `debug_single_key.py`

## 📊 Statistiques de performance

Le script affiche en temps réel :
- Nombre total de clés à vérifier
- Répartition par colonne (`key_1` / `key_2`)
- Statistiques de filtrage
- Progression avec temps d'attente
- Résumé final par statut

### Exemple de sortie :
```
🔍 Début de la vérification de 125 clés...
   - 75 clés dans key_1
   - 50 clés dans key_2

📊 Filtrage par colonne 'status':
   - 75/120 clés key_1 sélectionnées (status non vide)
   - 50/80 clés key_2 sélectionnées (status non vide)

[1/125] Vérification key_1: 6NC3F-THA8...
   Statut: Activée
   Attente de 7.2 secondes...

📊 Résumé des statuts:
  Key_1:
    Activée: 45
    Non activée: 30
  Key_2:
    Activée: 25
    Non activée: 25

🎯 Total de clés vérifiées: 125
```

## 🔧 Scripts auxiliaires

### `debug_single_key.py`
Script de debug pour tester une clé spécifique avec diagnostic détaillé :
```bash
python3 debug_single_key.py
```

### Configuration personnalisée
Pour adapter le script à vos besoins, modifiez les constantes en haut du fichier :
```python
CSV_FILE_PATH = "mon-fichier.csv"    # Votre fichier
MIN_DELAY = 2                        # Plus conservateur
MAX_DELAY = 15                       # Plus d'espacement
CHECK_KEY_2 = False                  # Ignorer key_2
```

## 📈 Limites et recommandations

### Limites techniques
- **Connexion Internet** stable requise
- **Site Steamworks** doit être accessible
- **Chrome/Chromium** uniquement supporté
- **Rate limiting** : respecter les délais pour éviter la détection

### Recommandations d'usage
- **Lots de 50-100 clés** maximum par session
- **Heures creuses** pour éviter la surcharge du site
- **Backup régulier** de vos données
- **Test préalable** avec quelques clés

### Performances attendues
- **~6 clés/minute** en moyenne (avec délais de sécurité)
- **100 clés ≈ 15-20 minutes**
- **500 clés ≈ 1h30-2h**

---

## 🎯 Version et changelog

**Version actuelle** : 2.0 (Décembre 2024)
- ✅ Saisie caractère par caractère
- ✅ Détection RGB/HEX améliorée  
- ✅ Validation de saisie robuste
- ✅ Support multi-colonnes
- ✅ Filtrage intelligent par `status`
- ✅ Gestion d'erreurs détaillée 