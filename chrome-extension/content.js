/**
 * Content Script - Steam Keys Checker Extension
 * S'exécute directement sur partner.steamgames.com
 */

// Éviter la double injection du script
if (window.steamKeyCheckerInstance) {
    console.log('Content script déjà injecté, réutilisation de l\'instance existante');
    // Arrêter ici pour éviter la double injection
} else {
    console.log('Injection du content script');

class SteamKeyChecker {
    constructor() {
        this.isChecking = false;
        this.currentKeyIndex = 0;
        this.keys = [];
        this.results = [];
        this.delay = 2000; // 2 secondes entre chaque vérification
        
        // Écouter les messages du popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log('Content script - Message reçu:', request);
            
            try {
                switch (request.action || request.type) {
                    case 'getPageInfo':
                        const info = this.getPageInfo();
                        console.log('Content script - Page info:', info);
                        sendResponse(info);
                        return false; // Réponse synchrone
                        
                    case 'ping':
                        console.log('Content script - Ping reçu, envoi du pong');
                        sendResponse({ type: 'pong' });
                        return false; // Réponse synchrone
                        
                    case 'checkKeys':
                        console.log('Content script - Message checkKeys reçu avec', request.keys?.length, 'clés');
                        this.startKeyChecking(request.keys).then(() => {
                            console.log('Content script - Vérification terminée avec succès');
                            sendResponse({ success: true });
                        }).catch((error) => {
                            console.error('Content script - Erreur lors de la vérification:', error);
                            sendResponse({ success: false, error: error.message });
                        });
                        return true; // Réponse asynchrone
                        
                    case 'stopChecking':
                        this.stopChecking();
                        sendResponse({ success: true });
                        return false; // Réponse synchrone
                        
                    default:
                        console.log('Content script - Action inconnue:', request.action || request.type);
                        sendResponse({ error: 'Action inconnue' });
                        return false;
                }
            } catch (error) {
                console.error('Erreur dans le gestionnaire de messages:', error);
                sendResponse({ error: error.message });
                return false;
            }
        });
        
        console.log('🔑 Steam Keys Checker - Content script chargé');
    }
    

    
    getPageInfo() {
        const isOnSteamworks = window.location.hostname === 'partner.steamgames.com';
        const isOnQueryPage = window.location.pathname.includes('/querycdkey/');
        const hasKeyInput = !!document.querySelector('input[name="cdkey"]');
        
        return {
            isOnSteamworks,
            isOnQueryPage,
            hasKeyInput,
            url: window.location.href
        };
    }
    
    async startKeyChecking(keys) {
        if (this.isChecking) {
            throw new Error('Vérification déjà en cours');
        }
        
        // Vérifier qu'on est sur la bonne page
        if (!this.getPageInfo().hasKeyInput) {
            throw new Error('Veuillez naviguer vers la page de vérification des clés Steam');
        }
        
        this.isChecking = true;
        this.keys = keys;
        this.results = [];
        this.currentKeyIndex = 0;
        
        console.log(`🚀 Début de la vérification de ${keys.length} clés`);
        
        // Informer le popup du début
        chrome.runtime.sendMessage({
            type: 'checkingStarted',
            total: keys.length
        });
        
        try {
            for (let i = 0; i < keys.length && this.isChecking; i++) {
                this.currentKeyIndex = i;
                const key = keys[i];
                
                console.log(`[${i + 1}/${keys.length}] Vérification de la clé: ${key.value.substring(0, 10)}...`);
                
                // Informer le popup de la progression
                chrome.runtime.sendMessage({
                    type: 'progress',
                    current: i + 1,
                    total: keys.length,
                    currentKey: key.value.substring(0, 10) + '...'
                });
                
                const result = await this.checkSingleKey(key.value);
                
                this.results.push({
                    ...key,
                    status: result.status,
                    error: result.error
                });
                
                // Informer le popup du résultat
                chrome.runtime.sendMessage({
                    type: 'keyChecked',
                    key: key,
                    result: result,
                    index: i
                });
                
                // Délai entre les vérifications (sauf pour la dernière)
                if (i < keys.length - 1 && this.isChecking) {
                    console.log(`⏳ Attente de ${this.delay / 1000}s avant la prochaine vérification...`);
                    await this.sleep(this.delay);
                }
            }
            
            if (this.isChecking) {
                console.log('✅ Vérification terminée avec succès');
                chrome.runtime.sendMessage({
                    type: 'checkingCompleted',
                    results: this.results
                });
            }
            
        } catch (error) {
            console.error('❌ Erreur pendant la vérification:', error);
            chrome.runtime.sendMessage({
                type: 'checkingError',
                error: error.message
            });
        } finally {
            this.isChecking = false;
        }
    }
    
    async checkSingleKey(steamKey) {
        try {
            // 1. Trouver le champ input
            const keyInput = document.querySelector('input[name="cdkey"]');
            if (!keyInput) {
                throw new Error('Champ de saisie de clé non trouvé');
            }
            
            // 2. Effacer le champ et saisir la nouvelle clé
            keyInput.value = '';
            keyInput.focus();
            
            // Saisir caractère par caractère pour éviter les problèmes
            for (const char of steamKey) {
                keyInput.value += char;
                await this.sleep(50); // 50ms entre chaque caractère
            }
            
            // Vérifier que la clé a été correctement saisie
            if (keyInput.value !== steamKey) {
                throw new Error(`Erreur de saisie: attendu "${steamKey}", obtenu "${keyInput.value}"`);
            }
            
            // 3. Soumettre le formulaire
            const form = document.getElementById('queryForm');
            if (!form) {
                throw new Error('Formulaire de vérification non trouvé');
            }
            
            form.submit();
            
            // 4. Attendre le résultat
            await this.waitForResult();
            
            // 5. Extraire le statut
            const status = this.extractStatus();
            
            return { status };
            
        } catch (error) {
            console.error(`Erreur lors de la vérification de la clé ${steamKey}:`, error);
            return { 
                status: 'Error',
                error: error.message 
            };
        }
    }
    
    async waitForResult(timeout = 10000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkForResult = () => {
                // Vérifier si on a un résultat
                const statusElement = document.querySelector('td span[style*="color"]');
                
                if (statusElement) {
                    resolve();
                    return;
                }
                
                // Timeout
                if (Date.now() - startTime > timeout) {
                    reject(new Error('Timeout: aucun résultat reçu'));
                    return;
                }
                
                // Réessayer dans 100ms
                setTimeout(checkForResult, 100);
            };
            
            checkForResult();
        });
    }
    
    extractStatus() {
        try {
            // Chercher l'élément de statut avec couleur
            const statusSpan = document.querySelector('td span[style*="color"]');
            
            if (!statusSpan) {
                return 'Status not found';
            }
            
            const statusText = statusSpan.textContent.trim().toLowerCase();
            const statusStyle = statusSpan.getAttribute('style') || '';
            
            // Détecter le statut basé sur la couleur et le texte
            if (statusStyle.includes('#67c1f5') || 
                statusStyle.includes('rgb(103, 193, 245)') ||
                statusText.includes('activée')) {
                return 'Activated';
            }
            
            if (statusStyle.includes('#e24044') || 
                statusStyle.includes('rgb(226, 64, 68)') ||
                statusText.includes('non activée')) {
                return 'Not activated';
            }
            
            if (statusText.includes('invalid') || statusText.includes('invalide')) {
                return 'Invalid';
            }
            
            // Si on ne peut pas déterminer, retourner le texte brut
            return `Unknown: ${statusText}`;
            
        } catch (error) {
            console.error('Erreur lors de l\'extraction du statut:', error);
            return 'Error extracting status';
        }
    }
    
    stopChecking() {
        console.log('🛑 Arrêt de la vérification demandé');
        this.isChecking = false;
        
        chrome.runtime.sendMessage({
            type: 'checkingStopped',
            results: this.results
        });
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialiser le checker quand le DOM est prêt
if (!window.steamKeyCheckerInstance) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.steamKeyCheckerInstance = new SteamKeyChecker();
        });
    } else {
        window.steamKeyCheckerInstance = new SteamKeyChecker();
    }
} else {
    console.log('Instance de SteamKeyChecker déjà existante');
}

} // Fermeture du bloc de protection contre la double injection 