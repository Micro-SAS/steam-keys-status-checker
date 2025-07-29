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
    config: null
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
    
    switch (message.type) {
        case 'checkingStarted':
            extensionState.isChecking = true;
            extensionState.totalKeys = message.total;
            extensionState.checkedKeys = 0;
            extensionState.currentResults = [];
            break;
            
        case 'progress':
            extensionState.checkedKeys = message.current;
            // Relayer le message vers le popup s'il est ouvert
            broadcastToPopup(message);
            break;
            
        case 'keyChecked':
            extensionState.currentResults.push(message.result);
            // Relayer le message vers le popup
            broadcastToPopup(message);
            break;
            
        case 'checkingCompleted':
            extensionState.isChecking = false;
            extensionState.currentResults = message.results;
            // Relayer le message vers le popup
            broadcastToPopup(message);
            
            // Afficher une notification de fin (si supporté)
            if (chrome.notifications) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon48.png',
                    title: 'Steam Keys Checker',
                    message: `Vérification terminée! ${message.results.length} clés traitées.`
                });
            }
            break;
            
        case 'checkingError':
            extensionState.isChecking = false;
            // Relayer l'erreur vers le popup
            broadcastToPopup(message);
            
            // Afficher une notification d'erreur (si supporté)
            if (chrome.notifications) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon48.png',
                    title: 'Steam Keys Checker - Erreur',
                    message: message.error
                });
            }
            break;
            
        case 'checkingStopped':
            extensionState.isChecking = false;
            extensionState.currentResults = message.results;
            // Relayer le message vers le popup
            broadcastToPopup(message);
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
                config: null
            };
            sendResponse({ success: true });
            break;
            
        case 'saveState':
            if (message.csvData) extensionState.csvData = message.csvData;
            if (message.config) extensionState.config = message.config;
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

// Gestion des onglets fermés
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    // Si l'onglet Steamworks est fermé pendant une vérification
    if (extensionState.isChecking) {
        console.log('Onglet Steamworks fermé pendant la vérification');
        extensionState.isChecking = false;
        
        broadcastToPopup({
            type: 'checkingError',
            error: 'Onglet Steamworks fermé pendant la vérification'
        });
    }
});

// Sauvegarder l'état périodiquement
setInterval(() => {
    if (extensionState.currentResults.length > 0) {
        chrome.storage.local.set({
            lastResults: extensionState.currentResults,
            lastCheck: Date.now()
        });
    }
}, 30000); // Toutes les 30 secondes

// Restaurer l'état au démarrage
chrome.storage.local.get(['lastResults', 'lastCheck'], (result) => {
    if (result.lastResults && result.lastCheck) {
        // Si les résultats ont moins de 24h, les restaurer
        const hoursSinceLastCheck = (Date.now() - result.lastCheck) / (1000 * 60 * 60);
        if (hoursSinceLastCheck < 24) {
            extensionState.currentResults = result.lastResults;
            console.log(`Résultats restaurés: ${result.lastResults.length} clés`);
        }
    }
}); 