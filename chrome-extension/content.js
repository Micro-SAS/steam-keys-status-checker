/**
 * Content Script - Steam Keys Checker Extension
 * S'exécute directement sur partner.steamgames.com
 */

console.log('🔑 Content script Steam Keys Checker chargé sur:', window.location.href);

// Éviter la double injection du script
if (window.steamKeyCheckerInstance) {
    console.log('⚠️ Instance de SteamKeyChecker déjà existante, réutilisation');
    // Réutiliser l'instance existante
} else {
    console.log('✅ Création d\'une nouvelle instance de SteamKeyChecker');

class SteamKeyChecker {
    constructor() {
        console.log('🚀 Initialisation de SteamKeyChecker');
        this.isChecking = false;
        this.currentKeyIndex = 0;
        this.keys = [];
        this.results = [];
        this.delay = 1000; // 1 seconde entre chaque vérification (plus rapide avec fetch)
        
        // Écouter les messages du popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log('📨 Message reçu dans content script:', request);
            try {
                switch (request.action || request.type) {
                    case 'getPageInfo':
                        const info = this.getPageInfo();
                        sendResponse(info);
                        return false; // Réponse synchrone
                        
                    case 'ping':
                        sendResponse({ type: 'pong' });
                        return false; // Réponse synchrone
                        
                    case 'checkConnection':
                        const isLoggedIn = this.checkIfLoggedIn();
                        sendResponse({ isLoggedIn });
                        return false; // Réponse synchrone
                        
                    case 'checkKeys':
                        this.startKeyChecking(request.keys).then(() => {
                            sendResponse({ success: true });
                        }).catch((error) => {
                            sendResponse({ success: false, error: error.message });
                        });
                        return true; // Réponse asynchrone
                        
                    case 'stopChecking':
                        console.log('🛑 Message d\'arrêt reçu dans content script');
                        this.stopChecking();
                        sendResponse({ success: true });
                        return false; // Réponse synchrone
                        
                    default:
                        console.log('❓ Action inconnue:', request.action || request.type);
                        sendResponse({ error: 'Action inconnue' });
                        return false;
                }
            } catch (error) {
                console.error('❌ Erreur dans le listener de messages:', error);
                sendResponse({ error: error.message });
                return false;
            }
        });
        
        console.log('✅ SteamKeyChecker initialisé avec succès');
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
    
    checkIfLoggedIn() {
        // Indicateurs que l'utilisateur N'EST PAS connecté
        const notLoggedInIndicators = [
            'se connecter', 'sign in', 'login', 'g_showlogindialog',
            'steam account', 'create account', 'forgotten password',
            'mot de passe oublié', 'sign in to steam'
        ];
        
        // Indicateurs que l'utilisateur EST connecté
        const loggedInIndicators = [
            'queryform', 'name="cdkey"', 'tableau de bord', 'partner dashboard',
            'déconnexion', 'logout', 'mon compte', 'my account', 'julintuity'
        ];
        
        const pageText = document.body.textContent.toLowerCase();
        
        // Vérifier les indicateurs de non-connexion
        for (const indicator of notLoggedInIndicators) {
            if (pageText.includes(indicator)) {
                return false;
            }
        }
        
        // Compter les indicateurs de connexion
        let loggedInScore = 0;
        for (const indicator of loggedInIndicators) {
            if (pageText.includes(indicator)) {
                loggedInScore++;
            }
        }
        
        return loggedInScore >= 2;
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
                console.log(`🔄 Itération ${i + 1}/${keys.length}, isChecking:`, this.isChecking);
                
                this.currentKeyIndex = i;
                const key = keys[i];
                
                // Informer le popup de la progression
                chrome.runtime.sendMessage({
                    type: 'progress',
                    current: i + 1,
                    total: keys.length,
                    currentKey: key.value.substring(0, 10) + '...'
                });
                
                const result = await this.checkSingleKey(key.value);
                
                // Si la vérification a été arrêtée, sortir de la boucle
                if (result.status === "Stopped") {
                    console.log("🛑 Vérification arrêtée pendant le traitement de la clé");
                    break;
                }
                
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
                
                // Délai aléatoire entre les vérifications (sauf pour la dernière)
                if (i < keys.length - 1 && this.isChecking) {
                    const delay = Math.floor(Math.random() * 9000) + 1000; // 1-10 secondes
                    console.log(`⏱️ Attente ${delay/1000} secondes... (isChecking: ${this.isChecking})`);
                    
                    // Diviser le délai en petites portions pour permettre l'arrêt
                    const delaySteps = Math.floor(delay / 100); // 100ms par étape
                    for (let step = 0; step < delaySteps && this.isChecking; step++) {
                        await this.sleep(100);
                    }
                    
                    // Si l'arrêt a été demandé pendant l'attente, sortir
                    if (!this.isChecking) {
                        console.log("🛑 Arrêt détecté pendant l'attente");
                        break;
                    }
                }
            }
            
            if (this.isChecking) {
                chrome.runtime.sendMessage({
                    type: 'checkingCompleted',
                    results: this.results
                });
            } else {
                chrome.runtime.sendMessage({
                    type: 'checkingStopped',
                    results: this.results
                });
            }
            
        } catch (error) {
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
            // Vérifier si l'arrêt a été demandé
            if (!this.isChecking) {
                return { status: "Stopped", error: null };
            }
            
            // 1. Construire l'URL de vérification
            const checkUrl = `https://partner.steamgames.com/querycdkey/cdkey?cdkey=${encodeURIComponent(steamKey)}`;
            
            // Vérifier si l'arrêt a été demandé
            if (!this.isChecking) {
                return { status: "Stopped", error: null };
            }
            
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
            
            // Vérifier si l'arrêt a été demandé
            if (!this.isChecking) {
                return { status: "Stopped", error: null };
            }
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
            }
            
            // 3. Parser la réponse HTML
            const htmlText = await response.text();
            
            // Vérifier si l'arrêt a été demandé
            if (!this.isChecking) {
                return { status: "Stopped", error: null };
            }
            
            const status = this.parseStatusFromHTML(htmlText, steamKey);
            
            return { status, error: null };
            
        } catch (error) {
            console.error(`❌ Erreur lors de la vérification de ${steamKey}:`, error);
            return { status: "Error", error: error.message };
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
        console.log('🛑 stopChecking() appelée');
        console.log('🛑 Arrêt de la vérification demandé...');
        console.log('🛑 État isChecking avant arrêt:', this.isChecking);
        
        this.isChecking = false;
        
        console.log('🛑 État isChecking après arrêt:', this.isChecking);
        
        // Informer le popup que l'arrêt a été effectué
        chrome.runtime.sendMessage({
            type: 'checkingStopped',
            results: this.results
        }).then(() => {
            console.log('✅ Message checkingStopped envoyé avec succès');
        }).catch(error => {
            console.log('⚠️ Erreur lors de l\'envoi du message d\'arrêt:', error);
        });
        
        console.log(`✅ Vérification arrêtée après ${this.results.length} clés traitées`);
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
    console.log('Instance de SteamKeyChecker déjà existante, réutilisation');
}

} // Fermeture du bloc de protection contre la double injection 