# Changelog - Steam Keys Checker Extension

## Version 1.1.0 - Vérification en arrière-plan

### Nouvelles fonctionnalités

#### 🔄 Vérification continue en arrière-plan
- **Problème résolu** : La vérification s'arrêtait quand le popup se fermait
- **Solution** : La vérification continue maintenant même si le popup n'est plus visible
- **Avantage** : Vous pouvez fermer le popup et faire autre chose pendant la vérification

#### 📊 Restauration de l'état de progression
- **Fonctionnalité** : Quand vous rouvrez le popup, il affiche automatiquement où en est la vérification
- **Informations affichées** :
  - Progression actuelle (X/Y clés vérifiées)
  - Temps écoulé depuis le début
  - Clé actuellement en cours de vérification
  - Compteurs en temps réel (activées, non activées, erreurs)

#### 🔔 Notifications de fin
- **Notification automatique** : Une notification apparaît quand la vérification est terminée
- **Son de notification** : Un son simple est joué pour attirer l'attention
- **Ouverture automatique du popup** : Le popup s'ouvre automatiquement pour afficher les résultats

#### 💾 Téléchargement automatique (optionnel)
- **Nouvelle option** : "Télécharger automatiquement le CSV à la fin de la vérification"
- **Avantage** : Plus besoin de cliquer manuellement pour télécharger les résultats
- **Configuration** : L'option est sauvegardée et restaurée automatiquement

#### 🎯 Indicateurs visuels
- **Badge sur l'icône** : L'icône de l'extension affiche le pourcentage de progression
- **Titre dynamique** : Le titre de l'icône indique le nombre de clés vérifiées
- **Clic sur l'icône** : Cliquer sur l'icône ouvre le popup pour voir la progression

#### 💾 Persistance des données
- **Sauvegarde automatique** : L'état de la vérification est sauvegardé toutes les 30 secondes
- **Restauration au redémarrage** : Si vous fermez le navigateur, l'état est restauré au redémarrage
- **Durée de conservation** : Les données sont conservées pendant 24h maximum

### Corrections de bugs

#### 🐛 Téléchargement automatique
- **Problème** : L'option de téléchargement automatique ne fonctionnait pas correctement
- **Solution** : Correction de la sauvegarde et restauration de l'option dans le localStorage
- **Amélioration** : L'option est maintenant correctement initialisée au démarrage

#### 🐛 Erreur de téléchargement manuel
- **Problème** : "Erreur lors du téléchargement des résultats" quand le popup se rouvre
- **Cause** : Les données CSV n'étaient pas correctement restaurées
- **Solution** : 
  - Ajout de vérifications de sécurité dans `downloadResults()`
  - Méthode `forceRestoreData()` pour récupérer les données depuis le background script
  - Restauration automatique des données si elles sont manquantes
  - Messages d'erreur plus détaillés pour faciliter le débogage

#### 🐛 Restauration des données
- **Problème** : Les données CSV n'étaient pas toujours restaurées correctement
- **Solution** : Amélioration de la méthode `checkExtensionState()` pour s'assurer que toutes les données sont restaurées avant d'afficher les résultats

### Améliorations techniques

#### Background Script amélioré
- Gestion complète de l'état de l'extension
- Communication bidirectionnelle avec le popup et le content script
- Sauvegarde et restauration automatiques des données

#### Content Script optimisé
- Communication directe avec le background script
- Continuation de la vérification même si le popup se ferme
- Gestion améliorée des erreurs et de l'arrêt

#### Popup intelligent
- Détection automatique d'une vérification en cours
- Restauration de l'interface avec les données actuelles
- Affichage du temps écoulé et de la progression
- Gestion robuste des données manquantes

### Utilisation

1. **Démarrer une vérification** : Comme avant, cliquez sur "Commencer la vérification"
2. **Fermer le popup** : Vous pouvez maintenant fermer le popup sans arrêter la vérification
3. **Voir la progression** : 
   - Cliquez sur l'icône de l'extension pour voir la progression
   - Le badge sur l'icône indique le pourcentage
4. **Fin de vérification** :
   - Une notification apparaît automatiquement
   - Le popup s'ouvre pour afficher les résultats
   - Le CSV se télécharge automatiquement si l'option est activée

### Configuration

- **Téléchargement automatique** : Cochez l'option dans la section "Configuration des colonnes"
- **L'option est sauvegardée** et restaurée automatiquement

### Compatibilité

- **Chrome/Edge** : Compatible avec les navigateurs basés sur Chromium
- **Manifest V3** : Utilise les dernières APIs Chrome
- **Permissions** : Aucune nouvelle permission requise 