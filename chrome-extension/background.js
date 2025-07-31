/**
 * Background Service Worker - Steam Keys Checker Extension
 * Gère la communication entre popup et content script
 */

// État global de l'extension
let extensionState = {
    isChecking: false,
    currentResults: [],
    totalKeys: 0,
    checkedKeys: 0,
    csvData: null,
    config: null,
    currentKey: '',
    startTime: null
};

// Installation de l'extension
chrome.runtime.onInstalled.addListener((details) => {
    console.log('🔑 Steam Keys Checker Extension installée', details);
    
    // Créer un menu contextuel (optionnel) - seulement si la permission est accordée
    try {
        chrome.contextMenus.create({
            id: 'steamKeysChecker',
            title: 'Vérifier avec Steam Keys Checker',
            contexts: ['selection'],
            documentUrlPatterns: ['https://partner.steamgames.com/*']
        });
    } catch (error) {
        console.log('Menu contextuel non créé:', error);
    }
});

// Gestion des messages entre popup et content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message reçu:', message);
    
    switch (message.action || message.type) {
        case 'getExtensionState':
            // Retourner l'état actuel de l'extension
            sendResponse({
                isChecking: extensionState.isChecking,
                currentResults: extensionState.currentResults,
                totalKeys: extensionState.totalKeys,
                checkedKeys: extensionState.checkedKeys,
                csvData: extensionState.csvData,
                config: extensionState.config,
                currentKey: extensionState.currentKey
            });
            return false; // Réponse synchrone
            
        case 'checkingStarted':
            extensionState.isChecking = true;
            extensionState.totalKeys = message.total;
            extensionState.checkedKeys = 0;
            extensionState.currentResults = [];
            extensionState.startTime = Date.now();
            extensionState.currentKey = '';
            
            // Sauvegarder l'état
            saveExtensionState();
            
            // Mettre à jour l'icône de l'extension
            updateExtensionIcon(true);
            break;
            
        case 'progress':
            extensionState.checkedKeys = message.current;
            extensionState.currentKey = message.currentKey || '';
            
            // Sauvegarder l'état
            saveExtensionState();
            
            // Relayer le message vers le popup s'il est ouvert
            broadcastToPopup(message);
            break;
            
        case 'keyChecked':
            extensionState.currentResults.push(message.result);
            
            // Sauvegarder l'état
            saveExtensionState();
            
            // Relayer le message vers le popup
            broadcastToPopup(message);
            break;
            
        case 'checkingCompleted':
            extensionState.isChecking = false;
            extensionState.currentResults = message.results;
            
            // Sauvegarder l'état final
            saveExtensionState();
            
            // Mettre à jour l'icône de l'extension
            updateExtensionIcon(false);
            
            // Relayer le message vers le popup
            broadcastToPopup(message);
            
            // Notifier l'utilisateur de la fin
            notifyUserOfCompletion(message.results);
            
            break;
            
        case 'checkingError':
            extensionState.isChecking = false;
            
            // Sauvegarder l'état
            saveExtensionState();
            
            // Mettre à jour l'icône de l'extension
            updateExtensionIcon(false);
            
            // Relayer l'erreur vers le popup
            broadcastToPopup(message);
            
            // Afficher une notification d'erreur
            showNotification('Steam Keys Checker - Erreur', message.error, 'error');
            break;
            
        case 'checkingStopped':
            extensionState.isChecking = false;
            extensionState.currentResults = message.results;
            
            // Sauvegarder l'état
            saveExtensionState();
            
            // Mettre à jour l'icône de l'extension
            updateExtensionIcon(false);
            
            // Relayer le message vers le popup
            broadcastToPopup(message);
            break;
            
        case 'resetState':
            // Réinitialiser complètement l'état de l'extension
            extensionState = {
                isChecking: false,
                currentResults: [],
                totalKeys: 0,
                checkedKeys: 0,
                csvData: null,
                config: null,
                currentKey: '',
                startTime: null
            };
            
            // Sauvegarder l'état réinitialisé
            saveExtensionState();
            
            // Mettre à jour l'icône de l'extension
            updateExtensionIcon(false);
            break;
            
        case 'stopChecking':
            // Message d'arrêt du popup - le relayer vers le content script
            console.log('🛑 Arrêt demandé par le popup, relais vers le content script');
            relayToContentScript(message);
            sendResponse({ success: true });
            break;
            
        case 'getExtensionState':
            // Le popup demande l'état actuel
            sendResponse(extensionState);
            break;
            
        case 'resetState':
            // Réinitialiser l'état
            extensionState = {
                isChecking: false,
                currentResults: [],
                totalKeys: 0,
                checkedKeys: 0,
                csvData: null,
                config: null,
                currentKey: '',
                startTime: null
            };
            
            // Sauvegarder l'état
            saveExtensionState();
            
            // Mettre à jour l'icône de l'extension
            updateExtensionIcon(false);
            
            sendResponse({ success: true });
            break;
            
        case 'saveState':
            if (message.csvData) extensionState.csvData = message.csvData;
            if (message.config) extensionState.config = message.config;
            
            // Sauvegarder l'état
            saveExtensionState();
            
            sendResponse({ success: true });
            break;
    }
});

// Gestion du menu contextuel
if (chrome.contextMenus && chrome.contextMenus.onClicked) {
    chrome.contextMenus.onClicked.addListener((info, tab) => {
        if (info.menuItemId === 'steamKeysChecker') {
            // Ouvrir le popup ou effectuer une action
            chrome.action.openPopup();
        }
    });
}

// Gestion du clic sur l'icône de l'extension
chrome.action.onClicked.addListener((tab) => {
    // Si une vérification est en cours, ouvrir le popup pour montrer le progrès
    if (extensionState.isChecking) {
        chrome.action.openPopup();
    }
});

// Fonction pour diffuser un message vers le popup
async function broadcastToPopup(message) {
    try {
        // Essayer d'envoyer le message vers le popup
        await chrome.runtime.sendMessage({
            ...message,
            fromBackground: true
        });
    } catch (error) {
        // Le popup n'est probablement pas ouvert, c'est normal
        console.log('Popup non ouvert, message non envoyé:', message.type);
    }
}

// Fonction pour relayer un message vers le content script
async function relayToContentScript(message) {
    try {
        // Trouver l'onglet Steamworks actif
        const tabs = await chrome.tabs.query({ 
            url: "https://partner.steamgames.com/*",
            active: true 
        });
        
        if (tabs.length > 0) {
            // Envoyer le message au content script
            await chrome.tabs.sendMessage(tabs[0].id, message);
            console.log('✅ Message d\'arrêt envoyé au content script');
        } else {
            console.log('⚠️ Aucun onglet Steamworks actif trouvé');
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi du message d\'arrêt:', error);
    }
}

// Fonction pour sauvegarder l'état de l'extension
function saveExtensionState() {
    chrome.storage.local.set({
        extensionState: extensionState,
        lastUpdate: Date.now()
    });
}

// Fonction pour restaurer l'état de l'extension
async function restoreExtensionState() {
    try {
        const result = await chrome.storage.local.get(['extensionState', 'lastUpdate']);
        if (result.extensionState && result.lastUpdate) {
            // Vérifier que les données ne sont pas trop anciennes (24h)
            const hoursSinceLastUpdate = (Date.now() - result.lastUpdate) / (1000 * 60 * 60);
            if (hoursSinceLastUpdate < 24) {
                extensionState = { ...extensionState, ...result.extensionState };
                console.log(`State restored: ${extensionState.currentResults.length} results`);
                
                // Mettre à jour l'icône si une vérification était en cours
                if (extensionState.isChecking) {
                    updateExtensionIcon(true);
                }
            }
        }
    } catch (error) {
        console.error('Erreur lors de la restauration de l\'état:', error);
    }
}

// Fonction pour mettre à jour l'icône de l'extension
function updateExtensionIcon(isChecking) {
    if (isChecking) {
        // Icône avec indicateur de progression
        chrome.action.setIcon({
            path: {
                "16": "icons/icon16.png",
                "32": "icons/icon32.png",
                "48": "icons/icon48.png",
                "128": "icons/icon128.png"
            }
        });
        
        // Badge avec le nombre de clés vérifiées
        const progress = extensionState.totalKeys > 0 ? 
            Math.round((extensionState.checkedKeys / extensionState.totalKeys) * 100) : 0;
        chrome.action.setBadgeText({ text: `${progress}%` });
        chrome.action.setBadgeBackgroundColor({ color: '#67c1f5' });
        
        // Titre avec information sur la progression
        const title = `Verification in progress: ${extensionState.checkedKeys}/${extensionState.totalKeys} keys`;
        chrome.action.setTitle({ title: title });
    } else {
        // Icône normale
        chrome.action.setIcon({
            path: {
                "16": "icons/icon16.png",
                "32": "icons/icon32.png",
                "48": "icons/icon48.png",
                "128": "icons/icon128.png"
            }
        });
        
        // Supprimer le badge
        chrome.action.setBadgeText({ text: '' });
        
        // Titre normal
        chrome.action.setTitle({ title: 'Steam Keys Checker' });
    }
}

// Fonction pour notifier l'utilisateur de la fin de vérification
async function notifyUserOfCompletion(results) {
    const activated = results.filter(r => r.status === 'Activated').length;
    const notActivated = results.filter(r => r.status === 'Not activated').length;
    const errors = results.filter(r => r.status !== 'Activated' && r.status !== 'Not activated').length;
    
    const message = `Verification completed! ${results.length} keys processed.\n` +
                   `✅ ${activated} activated\n` +
                   `❌ ${notActivated} not activated\n` +
                   `⚠️ ${errors} errors`;
    
    // Afficher une notification
    showNotification('Steam Keys Checker - Completed', message, 'success');
    
    // Jouer un son de notification (si supporté)
    playNotificationSound();
    
    // Vérifier si l'utilisateur est sur Steamworks
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab.url && tab.url.includes('partner.steamgames.com')) {
            // Si on est sur Steamworks, ouvrir le popup automatiquement
            setTimeout(() => {
                chrome.action.openPopup();
            }, 1000);
        } else {
            // Si on n'est pas sur Steamworks, ouvrir quand même le popup pour afficher "Download completed"
            setTimeout(() => {
                chrome.action.openPopup();
            }, 1000);
        }
    } catch (error) {
        console.log('Error checking current tab, opening popup anyway:', error);
        // En cas d'erreur, ouvrir quand même le popup
        setTimeout(() => {
            chrome.action.openPopup();
        }, 1000);
    }
}

// Fonction pour afficher une notification
function showNotification(title, message, type = 'info') {
    // Utiliser les notifications du navigateur si disponibles
    if (chrome.notifications) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: title,
            message: message
        });
    } else {
        // Fallback: afficher dans la console
        console.log(`🔔 ${title}: ${message}`);
    }
}

// Fonction pour jouer un son de notification
function playNotificationSound() {
    // Créer un audio context pour jouer un son simple
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
        console.log('Notification sound not supported');
    }
}

// Gestion des onglets fermés
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    // Si l'onglet Steamworks est fermé pendant une vérification
    if (extensionState.isChecking) {
        console.log('Steamworks tab closed during verification');
        extensionState.isChecking = false;
        
        // Sauvegarder l'état
        saveExtensionState();
        
        // Mettre à jour l'icône
        updateExtensionIcon(false);
        
        broadcastToPopup({
            type: 'checkingError',
            error: 'Onglet Steamworks fermé pendant la vérification'
        });
    }
});

// Restaurer l'état au démarrage
restoreExtensionState();

// Sauvegarder l'état périodiquement
setInterval(() => {
    if (extensionState.currentResults.length > 0 || extensionState.isChecking) {
        saveExtensionState();
    }
}, 30000); // Toutes les 30 secondes 