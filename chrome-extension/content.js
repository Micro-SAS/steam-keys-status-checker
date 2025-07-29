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
        this.delay = 1000; // 1 seconde entre chaque vérification (plus rapide avec fetch)
        
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
        // Avec fetch(), on n'a plus besoin du champ input sur la page
        const hasKeyInput = true; // Toujours vrai avec l'approche fetch()
        
        return {
            isOnSteamworks,
            isOnQueryPage,
            hasKeyInput,
            url: window.location.href,
            method: 'fetch' // Indiquer qu'on utilise fetch()
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
            console.log(`🔍 Vérification de la clé via fetch(): ${steamKey}`);
            
            // 1. Construire l'URL de vérification
            const checkUrl = `https://partner.steamgames.com/querycdkey/cdkey?cdkey=${encodeURIComponent(steamKey)}`;
            console.log(`📤 Requête GET vers: ${checkUrl}`);
            
            // 2. Faire la requête avec les cookies de la session
            const response = await fetch(checkUrl, {
                method: 'GET',
                credentials: 'include', // Inclure les cookies de session
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'fr-FR,fr;q=0.8,en-US;q=0.5,en;q=0.3',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Referer': 'https://partner.steamgames.com/querycdkey/',
                    'User-Agent': navigator.userAgent,
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
            }
            
            // 3. Parser la réponse HTML
            const htmlText = await response.text();
            console.log(`📥 Réponse reçue (${htmlText.length} caractères), parsing du HTML...`);
            
            // Debug: Afficher un extrait de la réponse pour les 3 premières clés
            if (this.results.length < 3) {
                console.log(`🔍 DEBUG - Extrait HTML pour ${steamKey}:`, htmlText.substring(0, 1000));
            }
            
            // 4. Extraire le statut depuis le HTML
            const status = this.parseStatusFromHTML(htmlText, steamKey);
            console.log(`✅ Statut extrait: ${status} pour ${steamKey}`);
            
            return { status };
            
        } catch (error) {
            console.error(`❌ Erreur lors de la vérification de la clé ${steamKey}:`, error);
            return { 
                status: 'Error',
                error: error.message 
            };
        }
    }
    
    // Méthode waitForResult supprimée - non nécessaire avec fetch()
    
    parseStatusFromHTML(htmlText, steamKey) {
        try {
            console.log(`🔍 Parsing HTML pour ${steamKey}...`);
            
            // Créer un parser DOM temporaire
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            
            // Méthode 1: Rechercher les spans avec couleur dans les tableaux
            const statusSpans = doc.querySelectorAll('td span[style*="color"], span[style*="color"]');
            console.log(`🔍 ${statusSpans.length} spans avec couleur trouvés`);
            
            for (const span of statusSpans) {
                const statusText = span.textContent.trim();
                const statusColor = span.getAttribute('style') || '';
                
                console.log(`🔍 Span: "${statusText}" | Style: "${statusColor}"`);
                
                // Vérifier d'abord "NON activée" pour éviter les faux positifs
                if (statusText.toLowerCase().includes('non activée') || 
                    statusText.toLowerCase().includes('not activated') ||
                    (statusColor.includes('#e24044') || statusColor.includes('rgb(226, 64, 68)'))) {
                    console.log(`❌ Détecté: NOT ACTIVATED`);
                    return "Not activated";
                }
                
                // Puis vérifier "activée"
                if (statusText.toLowerCase().includes('activée') || 
                    statusText.toLowerCase().includes('activated') ||
                    (statusColor.includes('#67c1f5') || statusColor.includes('rgb(103, 193, 245)'))) {
                    console.log(`✅ Détecté: ACTIVATED`);
                    return "Activated";
                }
            }
            
            // Méthode 2: Rechercher dans tout le contenu textuel
            const bodyText = doc.body ? doc.body.textContent : htmlText;
            const lowerBodyText = bodyText.toLowerCase();
            
            console.log(`📄 Recherche dans le texte complet (${bodyText.length} caractères)...`);
            
            // Patterns plus spécifiques avec priorité à "NON activée"
            if (lowerBodyText.includes('non activée')) {
                console.log(`❌ Trouvé dans le texte: "non activée"`);
                return "Not activated";
            }
            
            if (lowerBodyText.includes('not activated')) {
                console.log(`❌ Trouvé dans le texte: "not activated"`);
                return "Not activated";
            }
            
            // Vérifier "activée" seulement si "non activée" n'est pas présent
            if (lowerBodyText.includes('activée')) {
                console.log(`✅ Trouvé dans le texte: "activée"`);
                return "Activated";
            }
            
            if (lowerBodyText.includes('activated')) {
                console.log(`✅ Trouvé dans le texte: "activated"`);
                return "Activated";
            }
            
            // Autres statuts
            if (lowerBodyText.includes('invalid') || lowerBodyText.includes('invalide')) {
                console.log(`⚠️ Trouvé: Invalid`);
                return "Invalid";
            }
            
            if (lowerBodyText.includes('not found') || lowerBodyText.includes('introuvable')) {
                console.log(`⚠️ Trouvé: Not found`);
                return "Not found";
            }
            
            console.warn(`⚠️ Aucun statut reconnu pour ${steamKey}`);
            console.log(`📄 Extrait du texte:`, lowerBodyText.substring(0, 500));
            return "Unknown status";
            
        } catch (error) {
            console.error(`❌ Erreur lors du parsing HTML pour ${steamKey}:`, error);
            return `Parse error: ${error.message}`;
        }
    }
    
    // Méthode legacy conservée pour compatibilité (non utilisée avec fetch)
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