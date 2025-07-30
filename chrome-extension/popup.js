/**
 * Popup JavaScript - Steam Keys Checker Extension
 * Gère l'interface utilisateur et la communication avec le content script
 */

class SteamKeysPopup {
    constructor() {
        this.csvData = null;
        this.csvHeaders = [];
        this.config = {
            key1Column: '',
            key2Column: '',
            checkColumn: '',
            hasKey2: false
        };
        this.isChecking = false;
        this.results = [];
        this.currentStep = 'upload';
        this.autoDownloadTriggered = localStorage.getItem('autoDownloadTriggered') === 'true'; // Flag persistant
        
        this.initializeElements();
        this.attachEventListeners();
        this.checkSteamworksConnectionFirst();
        
        // Initialiser l'option de téléchargement automatique
        this.initializeAutoDownloadOption();
    }
    
    initializeElements() {
        // File upload elements
        this.csvFileInput = document.getElementById('csvFileInput');
        this.fileDropZone = document.getElementById('fileDropZone');
        this.selectFileBtn = document.getElementById('selectFileBtn');
        this.changeFileBtn = document.getElementById('changeFileBtn');
        this.fileInfo = document.getElementById('fileInfo');
        this.fileName = document.getElementById('fileName');
        this.fileStats = document.getElementById('fileStats');
        
        // Configuration elements
        this.key1Column = document.getElementById('key1Column');
        this.key2Column = document.getElementById('key2Column');
        this.key2ColumnGroup = document.getElementById('key2ColumnGroup');
        this.checkAllKeys = document.getElementById('checkAllKeys');
        this.checkFilteredKeys = document.getElementById('checkFilteredKeys');
        this.filterGroup = document.getElementById('filterGroup');
        this.filterColumn = document.getElementById('filterColumn');
        this.filterValue = document.getElementById('filterValue');
        this.hasKey2Checkbox = document.getElementById('hasKey2Checkbox');
        this.autoDownloadCheckbox = document.getElementById('autoDownloadCheckbox');
        
        // Connection elements
        this.connectionStatus = document.getElementById('connectionStatus');
        this.connectionText = document.getElementById('connectionText');
        this.connectionSpinner = document.getElementById('connectionSpinner');
        this.connectionSuccess = document.getElementById('connectionSuccess');
        this.connectionInstructions = document.getElementById('connectionInstructions');
        this.connectSteamworksBtn = document.getElementById('connectSteamworksBtn');
        
        // Processing elements

        this.startCheckingBtn = document.getElementById('startCheckingBtn');
        this.stopCheckingBtn = document.getElementById('stopCheckingBtn');
        

        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.currentKeyText = document.getElementById('currentKeyText');
        
        // Results counters
        this.activatedCount = document.getElementById('activatedCount');
        this.notActivatedCount = document.getElementById('notActivatedCount');
        this.errorCount = document.getElementById('errorCount');
        
        // Results elements
        this.resultsSummary = document.getElementById('resultsSummary');
        this.downloadResultsBtn = document.getElementById('downloadResultsBtn');
        this.newCheckBtn = document.getElementById('newCheckBtn');
        this.resultsTableBody = document.getElementById('resultsTableBody');
        
        // Status elements
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        
        // Modal elements
        this.errorModal = document.getElementById('errorModal');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorModalClose = document.getElementById('errorModalClose');
        this.errorModalOk = document.getElementById('errorModalOk');
        
        // Steamworks info modal elements
        this.steamworksInfoModal = document.getElementById('steamworksInfoModal');
        this.steamworksInfoModalClose = document.getElementById('steamworksInfoModalClose');
        this.steamworksInfoCancel = document.getElementById('steamworksInfoCancel');
        this.steamworksInfoContinue = document.getElementById('steamworksInfoContinue');
        
        // Step sections
        this.stepConnection = document.getElementById('stepConnection');
        this.stepUpload = document.getElementById('stepUpload');
        this.stepConfig = document.getElementById('stepConfig');
        this.stepProcessing = document.getElementById('stepProcessing');
        this.stepResults = document.getElementById('stepResults');
    }
    
    attachEventListeners() {
        // File upload
        this.selectFileBtn.addEventListener('click', () => this.csvFileInput.click());
        this.changeFileBtn.addEventListener('click', () => this.csvFileInput.click());
        this.csvFileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag & drop
        this.fileDropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.fileDropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.fileDropZone.addEventListener('drop', (e) => this.handleFileDrop(e));
        
        // Configuration
        this.key1Column.addEventListener('change', () => {
            this.updateKey2ColumnOptions();
            this.updateFilterColumnOptions();
            this.updateConfig();
        });
        this.key2Column.addEventListener('change', () => {
            this.updateFilterColumnOptions();
            this.updateConfig();
        });
        this.filterColumn.addEventListener('change', () => this.updateConfig());
        this.filterValue.addEventListener('change', () => this.updateConfig());
        this.hasKey2Checkbox.addEventListener('change', (e) => {
            this.key2ColumnGroup.style.display = e.target.checked ? 'block' : 'none';
            if (!e.target.checked) {
                this.key2Column.value = '';
            }
            this.updateConfig();
        });
        
        // Check scope radio buttons
        this.checkAllKeys.addEventListener('change', (e) => {
            this.filterGroup.style.display = 'none';
            this.updateConfig();
        });
        this.checkFilteredKeys.addEventListener('change', (e) => {
            this.filterGroup.style.display = 'block';
            this.updateConfig();
        });
        this.autoDownloadCheckbox.addEventListener('change', (e) => {
            localStorage.setItem('autoDownload', e.target.checked.toString());
            console.log('🔧 Option téléchargement automatique changée:', e.target.checked);
        });
        
        // Connection
        this.connectSteamworksBtn.addEventListener('click', () => this.connectToSteamworks());
        
        // Processing
        this.startCheckingBtn.addEventListener('click', () => this.startChecking());
        this.stopCheckingBtn.addEventListener('click', () => this.stopChecking());
        
        // Results
        this.downloadResultsBtn.addEventListener('click', () => this.downloadResults());
        this.newCheckBtn.addEventListener('click', () => this.resetToStart());
        
        // Modal
        this.errorModalClose.addEventListener('click', () => this.hideErrorModal());
        this.errorModalOk.addEventListener('click', () => this.hideErrorModal());
        
        // Steamworks info modal
        this.steamworksInfoModalClose.addEventListener('click', () => this.hideSteamworksInfoModal());
        this.steamworksInfoCancel.addEventListener('click', () => this.hideSteamworksInfoModal());
        this.steamworksInfoContinue.addEventListener('click', () => this.proceedToSteamworks());
        
        // Messages from background script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.fromBackground) {
                this.handleBackgroundMessage(message);
            }
        });
    }
    
        async checkSteamworksConnectionFirst() {
        this.updateStatus('processing', 'Checking Steamworks connection...');
        
        try {
            // Utiliser le content script pour vérifier la connexion
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url || !tab.url.includes('partner.steamgames.com')) {
                this.showConnectionInstructions();
                this.updateStatus('warning', 'Open Steamworks to check connection');
                return;
            }
            
            // Demander au content script de vérifier la connexion
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'checkConnection' });
            
            if (response && response.isLoggedIn) {
                this.showConnectionSuccess();
                this.updateStatus('success', 'Connected to Steamworks');
                
                // Passer automatiquement à l'étape 2 après un délai
                setTimeout(() => {
                    this.stepUpload.style.display = 'block';
                    this.updateStatus('info', 'Import your CSV file');
                }, 1500);
                
                await this.checkExtensionState();
            } else {
                this.showConnectionInstructions();
                this.updateStatus('warning', 'Steamworks connection required');
            }
            
        } catch (error) {
            this.showConnectionInstructions();
            this.updateStatus('warning', 'Open Steamworks to check connection');
        }
    }
    
    checkIfLoggedInToSteamworks(htmlText) {
        // Convertir en minuscules pour les vérifications
        const lowerHtml = htmlText.toLowerCase();
        
        // Indicateurs que l'utilisateur N'EST PAS connecté
        const notLoggedInIndicators = [
            'se connecter',  // Bouton "Se connecter" visible
            'sign in',       // Version anglaise
            'login',         // Page de login
            'g_showlogindialog', // Fonction de login mentionnée dans l'erreur
            'steam account', // Demande de compte Steam
            'create account', // Création de compte
            'forgotten password', // Mot de passe oublié
            'mot de passe oublié'
        ];
        
        // Vérifier les indicateurs de non-connexion
        for (const indicator of notLoggedInIndicators) {
            if (lowerHtml.includes(indicator)) {
                console.log(`❌ Indicateur de non-connexion trouvé: "${indicator}"`);
                return false;
            }
        }
        
        // Indicateurs que l'utilisateur EST connecté
        const loggedInIndicators = [
            'queryform',     // Formulaire de vérification des clés
            'name="cdkey"',  // Champ de saisie de clé
            'tableau de bord', // Dashboard Steamworks
            'partner dashboard', // Version anglaise
            'déconnexion',   // Option de déconnexion
            'logout',        // Version anglaise
            'mon compte',    // Accès au compte
            'my account'     // Version anglaise
        ];
        
        // Compter les indicateurs de connexion
        let loggedInScore = 0;
        for (const indicator of loggedInIndicators) {
            if (lowerHtml.includes(indicator)) {
                console.log(`✅ Indicateur de connexion trouvé: "${indicator}"`);
                loggedInScore++;
            }
        }
        
        // Considérer comme connecté si au moins 2 indicateurs positifs
        const isLoggedIn = loggedInScore >= 2;
        console.log(`📊 Score de connexion: ${loggedInScore}/8 indicateurs → ${isLoggedIn ? 'CONNECTÉ' : 'NON CONNECTÉ'}`);
        
        return isLoggedIn;
    }

    showConnectionSuccess() {
        this.connectionStatus.style.display = 'none';
        this.connectionInstructions.style.display = 'none';
        this.connectionSuccess.style.display = 'block';
        
        // Afficher l'étape suivante après un délai
        setTimeout(() => {
            this.stepUpload.style.display = 'block';
        }, 1000);
    }
    
    showConnectionInstructions() {
        this.connectionStatus.style.display = 'none';
        this.connectionSuccess.style.display = 'none';
        this.connectionInstructions.style.display = 'block';
    }
    
    async connectToSteamworks() {
        // Afficher la modal d'information avant d'ouvrir Steamworks
        this.showSteamworksInfoModal();
    }
    
    showSteamworksInfoModal() {
        this.steamworksInfoModal.style.display = 'flex';
    }
    
    hideSteamworksInfoModal() {
        this.steamworksInfoModal.style.display = 'none';
    }
    
    async proceedToSteamworks() {
        // Masquer la modal
        this.hideSteamworksInfoModal();
        
        // Ouvrir Steamworks dans un nouvel onglet
        await chrome.tabs.create({ 
            url: 'https://partner.steamgames.com/querycdkey/',
            active: true 
        });
        
        // Ne pas fermer le popup - laisser l'utilisateur revenir
        // Le popup reste ouvert pour que l'utilisateur puisse revenir
    }

    async checkExtensionState() {
        try {
            const state = await chrome.runtime.sendMessage({ type: 'getExtensionState' });
            
            // Si une vérification est en cours, restaurer l'état de progression
            if (state.isChecking) {
                this.isChecking = true;
                this.autoDownloadTriggered = false; // Réinitialiser le flag pour une vérification en cours
                localStorage.setItem('autoDownloadTriggered', 'false'); // Réinitialiser dans localStorage
                this.results = state.currentResults || [];
                
                // Restaurer les données CSV et config
                if (state.csvData) {
                    this.csvData = state.csvData;
                    this.csvHeaders = state.csvData.headers;
                }
                if (state.config) {
                    this.config = state.config;
                }
                
                // Afficher l'étape de traitement avec les données restaurées
                this.showProcessingStep();
                this.showProgressWithRestoredData(state);
                
                this.updateStatus('processing', `Vérification en cours: ${state.checkedKeys}/${state.totalKeys} clés`);
                return;
            }
            
            // Restaurer les résultats s'ils existent
            if (state.currentResults && state.currentResults.length > 0) {
                this.results = state.currentResults;
                
                // S'assurer que les données CSV sont restaurées avant d'afficher les résultats
                if (state.csvData) {
                    this.csvData = state.csvData;
                    this.csvHeaders = state.csvData.headers;
                }
                if (state.config) {
                    this.config = state.config;
                }
                
                this.showResults();
                return; // Ne pas restaurer le CSV si on a des résultats
            }
            
            // Restaurer le CSV et la config
            if (state.csvData) {
                this.csvData = state.csvData;
                this.csvHeaders = state.csvData.headers;
                
                // Afficher les informations du fichier
                this.fileName.textContent = state.csvData.filename;
                this.fileStats.textContent = `${state.csvData.rows.length} lignes, ${state.csvData.headers.length} colonnes`;
                
                this.fileDropZone.style.display = 'none';
                this.fileInfo.style.display = 'flex';
                
                // Passer à l'étape de configuration
                this.showConfigStep();
                
                // Restaurer la configuration
                if (state.config) {
                    this.config = state.config;
                    this.key1Column.value = state.config.key1Column || '';
                    this.key2Column.value = state.config.key2Column || '';
                    
                    // Restaurer le scope de vérification
                    if (state.config.checkScope === 'filtered') {
                        this.checkFilteredKeys.checked = true;
                        this.filterGroup.style.display = 'block';
                        this.filterColumn.value = state.config.filterColumn || '';
                        this.filterValue.value = state.config.filterValue || 'true';
                    } else {
                        this.checkAllKeys.checked = true;
                        this.filterGroup.style.display = 'none';
                    }
                    
                    this.hasKey2Checkbox.checked = state.config.hasKey2 || false;
                    this.key2ColumnGroup.style.display = (state.config.hasKey2 || false) ? 'block' : 'none';
                    
                    if (state.config.key1Column) {
                        this.showProcessingStep();
                    }
                }
                
                // Restaurer l'option de téléchargement automatique
                const autoDownload = localStorage.getItem('autoDownload') === 'true';
                this.autoDownloadCheckbox.checked = autoDownload;
                
                this.updateStatus('success', 'State restored');
            }
        } catch (error) {
            console.log('No previous state found');
        }
    }
    
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.loadCSVFile(file);
        }
    }
    
    handleDragOver(event) {
        event.preventDefault();
        this.fileDropZone.classList.add('dragover');
    }
    
    handleDragLeave(event) {
        event.preventDefault();
        this.fileDropZone.classList.remove('dragover');
    }
    
    handleFileDrop(event) {
        event.preventDefault();
        this.fileDropZone.classList.remove('dragover');
        
        const files = event.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'text/csv') {
            this.loadCSVFile(files[0]);
        } else {
            this.showError('Veuillez sélectionner un fichier CSV valide');
        }
    }
    
    async loadCSVFile(file) {
        try {
            this.updateStatus('processing', 'Chargement du fichier CSV...');
            
            const text = await this.readFileAsText(file);
            const lines = text.trim().split('\n');
            
            if (lines.length < 2) {
                throw new Error('Le fichier CSV doit contenir au moins un en-tête et une ligne de données');
            }
            
            // Parser les en-têtes
            this.csvHeaders = this.parseCSVLine(lines[0]);
            
            // Parser les données
            this.csvData = {
                headers: this.csvHeaders,
                rows: lines.slice(1).map(line => this.parseCSVLine(line)),
                filename: file.name
            };
            
            // Sauvegarder dans le background script
            await chrome.runtime.sendMessage({
                type: 'saveState',
                csvData: this.csvData
            });
            
            // Afficher les informations du fichier
            this.fileName.textContent = file.name;
            this.fileStats.textContent = `${this.csvData.rows.length} lignes, ${this.csvHeaders.length} colonnes`;
            
            this.fileDropZone.style.display = 'none';
            this.fileInfo.style.display = 'flex';
            
            // Passer à l'étape de configuration
            this.showConfigStep();
            
            this.updateStatus('success', 'CSV file loaded successfully');
            
        } catch (error) {
            console.error('Error loading file:', error);
            this.showError(`Loading error: ${error.message}`);
            this.updateStatus('error', 'Error loading file');
        }
    }
    
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('File reading error'));
            reader.readAsText(file);
        });
    }
    
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }
    
    showConfigStep() {
        this.stepConfig.style.display = 'block';
        
        // Remplir les sélecteurs de colonnes
        this.populateColumnSelectors();
        
        this.currentStep = 'config';
    }
    
    populateColumnSelectors() {
        // Vider les sélecteurs
        [this.key1Column, this.key2Column, this.filterColumn].forEach(select => {
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
        });
        
        // Ajouter les options pour la première colonne de clés
        this.csvHeaders.forEach(header => {
            const option = document.createElement('option');
            option.value = header;
            option.textContent = header;
            this.key1Column.appendChild(option);
        });
        
        // Ajouter les options pour la deuxième colonne de clés (exclure la première)
        this.updateKey2ColumnOptions();
        
        // Ajouter les options pour le filtre (exclure les colonnes de clés)
        this.updateFilterColumnOptions();
        
        // Auto-sélection intelligente
        this.autoSelectColumns();
    }
    
    updateKey2ColumnOptions() {
        // Sauvegarder la valeur actuellement sélectionnée
        const currentValue = this.key2Column.value;
        
        // Vider le select de la deuxième colonne
        while (this.key2Column.children.length > 1) {
            this.key2Column.removeChild(this.key2Column.lastChild);
        }
        
        // Ajouter les options en excluant la première colonne de clés
        this.csvHeaders.forEach(header => {
            if (header !== this.key1Column.value) {
                const option = document.createElement('option');
                option.value = header;
                option.textContent = header;
                this.key2Column.appendChild(option);
            }
        });
        
        // Restaurer la valeur sélectionnée si elle existe encore dans les nouvelles options
        if (currentValue && this.key2Column.querySelector(`option[value="${currentValue}"]`)) {
            this.key2Column.value = currentValue;
        } else {
            this.key2Column.value = '';
        }
    }
    
    updateFilterColumnOptions() {
        // Sauvegarder la valeur actuellement sélectionnée
        const currentValue = this.filterColumn.value;
        
        // Vider le select de filtrage
        while (this.filterColumn.children.length > 1) {
            this.filterColumn.removeChild(this.filterColumn.lastChild);
        }
        
        // Obtenir les colonnes sélectionnées pour les clés
        const selectedKeyColumns = [];
        if (this.key1Column.value) selectedKeyColumns.push(this.key1Column.value);
        if (this.key2Column.value) selectedKeyColumns.push(this.key2Column.value);
        
        // Ajouter les options en excluant les colonnes de clés
        this.csvHeaders.forEach(header => {
            if (!selectedKeyColumns.includes(header)) {
                const option = document.createElement('option');
                option.value = header;
                option.textContent = header;
                this.filterColumn.appendChild(option);
            }
        });
        
        // Restaurer la valeur sélectionnée si elle existe encore dans les nouvelles options
        if (currentValue && this.filterColumn.querySelector(`option[value="${currentValue}"]`)) {
            this.filterColumn.value = currentValue;
        } else {
            this.filterColumn.value = '';
        }
    }
    
    autoSelectColumns() {
        // Recherche intelligente des colonnes de clés
        const keyPatterns = ['key', 'clé', 'steam', 'code'];
        
        // Sélection automatique de la première colonne de clé
        const keyColumn = this.csvHeaders.find(header => 
            keyPatterns.some(pattern => header.toLowerCase().includes(pattern))
        );
        if (keyColumn) {
            this.key1Column.value = keyColumn;
        }
        
        // Mettre à jour les options après la sélection automatique
        this.updateKey2ColumnOptions();
        this.updateFilterColumnOptions();
        
        this.updateConfig();
    }
    
    async updateConfig() {
        this.config.key1Column = this.key1Column.value;
        this.config.key2Column = this.key2Column.value;
        this.config.checkScope = this.checkAllKeys.checked ? 'all' : 'filtered';
        this.config.filterColumn = this.filterColumn.value;
        this.config.filterValue = this.filterValue.value;
        this.config.hasKey2 = this.hasKey2Checkbox.checked;
        
        // Mettre à jour les options quand les colonnes de clés changent
        this.updateKey2ColumnOptions();
        this.updateFilterColumnOptions();
        
        // Sauvegarder la configuration dans le background script
        await chrome.runtime.sendMessage({
            type: 'saveState',
            config: this.config
        });
        
        // Vérifier si on peut passer à l'étape suivante
        if (this.config.key1Column) {
            this.showProcessingStep();
        } else {
            // Mettre à jour le texte du bouton même si on n'a pas encore de colonne sélectionnée
            this.prepareKeysSummary();
        }
    }
    
    showConnectionStep() {
        this.stepConnection.style.display = 'block';
        this.currentStep = 'connection';
        
        // Afficher directement les instructions sans vérifier la connexion
        this.showConnectionInstructions();
        this.updateStatus('info', 'Ouvrez Steamworks pour continuer');
        
        // Passer directement à l'étape de traitement
        this.showProcessingStep();
    }
    
    async checkSteamworksConnection() {
        try {
            this.updateStatus('processing', 'Checking Steamworks connection...');
            
            // Obtenir l'onglet actif
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            console.log('Active tab:', tab.url);
            
            // Vérifier si on est sur Steamworks
            if (tab.url && tab.url.includes('partner.steamgames.com')) {
                try {
                    // D'abord, injecter le content script au cas où
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['content.js']
                    }).catch(() => {
                        console.log('Content script already injected');
                    });
                    
                    // Attendre un peu pour que le script se charge
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Envoyer un message au content script
                    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getPageInfo' });
                    console.log('Content script response:', response);
                    
                    if (response && response.hasKeyInput) {
                        // Masquer le spinner et afficher l'étape suivante
                        this.connectionStatus.style.display = 'none';
                        this.connectionInstructions.style.display = 'none';
                        this.showProcessingStep();
                        this.updateStatus('success', 'Connected to Steamworks');
                    } else if (response && response.isOnSteamworks) {
                        this.showConnectionInstructions();
                        this.updateStatus('warning', 'Navigate to the key verification page');
                    } else {
                        this.showConnectionInstructions();
                        this.updateStatus('warning', 'Please go to partner.steamgames.com');
                    }
                } catch (msgError) {
                    console.error('Communication error with content script:', msgError);
                    this.showConnectionInstructions();
                    this.updateStatus('warning', 'Reload the Steamworks page and try again');
                }
            } else {
                this.showConnectionInstructions();
                this.updateStatus('warning', 'Steamworks connection required');
            }
            
        } catch (error) {
            console.error('Connection error:', error);
            this.showConnectionInstructions();
            this.updateStatus('warning', 'Connection error - Try again');
        }
    }
    
    showConnectionInstructions() {
        this.connectionStatus.style.display = 'none';
        this.connectionInstructions.style.display = 'block';
    }
    
    hideConnectionStep() {
        this.connectionStatus.style.display = 'none';
        this.connectionInstructions.style.display = 'none';
    }
    
    async openSteamworks() {
        await chrome.tabs.create({ 
            url: 'https://partner.steamgames.com/querycdkey/',
            active: true 
        });
        
        // Fermer le popup après ouverture
        window.close();
    }
    
    showProcessingStep() {
        // Afficher l'étape de traitement
        this.stepProcessing.style.display = 'block';
        this.currentStep = 'processing';
        
        // Préparer le résumé des clés seulement si on a une configuration
        if (this.config && this.config.key1Column) {
            this.prepareKeysSummary();
        }
    }
    
    prepareKeysSummary() {
        const keys = this.extractKeysFromCSV();
        
        // Mettre à jour le texte du bouton avec le nombre de clés en gras
        this.startCheckingBtn.innerHTML = `🔍 Check the status of <strong>${keys.length}</strong> Steam Keys`;
    }
    
    extractKeysFromCSV() {
        const keys = [];
        const key1Index = this.csvHeaders.indexOf(this.config.key1Column);
        const key2Index = this.config.hasKey2 ? this.csvHeaders.indexOf(this.config.key2Column) : -1;
        const filterIndex = this.config.checkScope === 'filtered' && this.config.filterColumn ? 
            this.csvHeaders.indexOf(this.config.filterColumn) : -1;
        
        this.csvData.rows.forEach((row, rowIndex) => {
            // Vérifier si cette ligne doit être vérifiée selon le scope
            let shouldCheck = true;
            
            if (this.config.checkScope === 'filtered' && filterIndex !== -1) {
                shouldCheck = this.shouldCheckRow(row[filterIndex]);
            }
            
            if (shouldCheck) {
                // Ajouter la clé principale
                if (key1Index !== -1 && row[key1Index] && row[key1Index].trim()) {
                    keys.push({
                        value: row[key1Index].trim(),
                        column: this.config.key1Column,
                        rowIndex: rowIndex,
                        originalRow: row
                    });
                }
                
                // Ajouter la clé secondaire si configurée
                if (key2Index !== -1 && row[key2Index] && row[key2Index].trim()) {
                    keys.push({
                        value: row[key2Index].trim(),
                        column: this.config.key2Column,
                        rowIndex: rowIndex,
                        originalRow: row
                    });
                }
            }
        });
        
        return keys;
    }
    
    shouldCheckRow(checkValue) {
        if (!checkValue) return false;
        
        const value = checkValue.toString().trim();
        const filterValue = this.config.filterValue || 'true';
        
        switch (filterValue) {
            case 'true':
                return ['true', '1', 'True', 'TRUE', 'vrai', 'Vrai', 'VRAI'].includes(value);
            case 'yes':
                return ['yes', 'Yes', 'YES', 'oui', 'Oui', 'OUI'].includes(value);
            case 'x':
                return ['x', 'X'].includes(value);
            default:
                return ['true', '1', 'True', 'TRUE', 'vrai', 'Vrai', 'VRAI'].includes(value);
        }
    }
    
    async startChecking() {
        try {
            this.isChecking = true;
            this.autoDownloadTriggered = false; // Réinitialiser le flag pour une nouvelle vérification
            localStorage.setItem('autoDownloadTriggered', 'false'); // Réinitialiser dans localStorage
            this.updateStatus('processing', 'Verification in progress...');
            
            // Masquer le bouton de démarrage, afficher celui d'arrêt
            this.startCheckingBtn.style.display = 'none';
            this.stopCheckingBtn.style.display = 'inline-flex';
            this.progressSection.style.display = 'block';
            
            // Réinitialiser les compteurs
            this.resetCounters();
            
            // Extraire les clés à vérifier
            const keys = this.extractKeysFromCSV();
            
            // Obtenir l'onglet Steamworks
            const tabs = await chrome.tabs.query({ 
                url: "https://partner.steamgames.com/*" 
            });
            
            if (!tabs || tabs.length === 0) {
                throw new Error('No Steamworks tab found. Please open Steamworks.');
            }
            
            // Chercher l'onglet avec /querycdkey/ exact en priorité
            let tab = tabs[0]; // Par défaut, premier onglet
            for (const t of tabs) {
                if (t.url === 'https://partner.steamgames.com/querycdkey/') {
                    tab = t;
                    break;
                }
            }
            // Si pas trouvé, chercher un onglet avec /querycdkey/ dans l'URL
            if (tab.url !== 'https://partner.steamgames.com/querycdkey/') {
                for (const t of tabs) {
                    if (t.url.includes('/querycdkey/')) {
                        tab = t;
                        break;
                    }
                }
            }
            
            // Vérifier que le content script est chargé et fonctionne
            try {
                const pingResponse = await chrome.tabs.sendMessage(tab.id, { type: 'ping' });
                if (!pingResponse || pingResponse.type !== 'pong') {
                    throw new Error('Content script is not responding correctly');
                }
            } catch (pingError) {
                if (pingError.message.includes('Could not establish connection')) {
                    throw new Error('Content script is not loaded. Make sure you are on partner.steamgames.com and reload the page.');
                } else if (pingError.message.includes('Receiving end does not exist')) {
                    throw new Error('No content script found. Open partner.steamgames.com and try again.');
                } else {
                    throw new Error(`Communication error: ${pingError.message}. Reload the Steamworks page.`);
                }
            }
            
            // Envoyer les clés au content script
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'checkKeys',
                keys: keys
            });
            
        } catch (error) {
            this.showError(`Error: ${error.message}`);
            this.stopChecking();
        }
    }
    
    async stopChecking() {
        try {
            this.isChecking = false;
            
            // Envoyer signal d'arrêt au background script
            await chrome.runtime.sendMessage({ 
                type: 'stopChecking',
                action: 'stopChecking'
            });
            
            this.updateStatus('warning', 'Verification stopped');
            
        } catch (error) {
            console.error('Error stopping:', error);
        } finally {
            this.startCheckingBtn.style.display = 'inline-flex';
            this.stopCheckingBtn.style.display = 'none';
        }
    }
    
    handleBackgroundMessage(message) {
        switch (message.type) {
            case 'progress':
                this.updateProgress(message.current, message.total);
                this.currentKeyText.textContent = `Checking: ${message.currentKey}`;
                break;
                
            case 'keyChecked':
                this.updateCounters(message.result.status);
                break;
                
            case 'checkingCompleted':
                this.results = message.results;
                this.showResults();
                break;
                
            case 'checkingError':
                this.showError(`Erreur: ${message.error}`);
                this.stopChecking();
                break;
                
            case 'checkingStopped':
                this.results = message.results;
                this.isChecking = false;
                
                // Réinitialiser les boutons
                this.startCheckingBtn.style.display = 'inline-flex';
                this.stopCheckingBtn.style.display = 'none';
                
                if (this.results.length > 0) {
                    this.showResults();
                    this.updateStatus('warning', `Vérification arrêtée - ${this.results.length} clés traitées`);
                } else {
                    this.updateStatus('warning', 'Vérification arrêtée - Aucune clé traitée');
                }
                break;
                
            case 'cleanupAutoDownloadFlag':
                // Nettoyer le flag de téléchargement automatique
                this.autoDownloadTriggered = false;
                localStorage.setItem('autoDownloadTriggered', 'false');
                console.log('🧹 Flag de téléchargement automatique nettoyé');
                break;
        }
    }
    
    updateProgress(current, total) {
        const percentage = (current / total) * 100;
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = `${current} / ${total} clés vérifiées`;
    }
    
    resetCounters() {
        this.activatedCount.textContent = '0';
        this.notActivatedCount.textContent = '0';
        this.errorCount.textContent = '0';
    }
    
    updateCounters(status) {
        if (status === 'Activated') {
            const count = parseInt(this.activatedCount.textContent) + 1;
            this.activatedCount.textContent = count.toString();
        } else if (status === 'Not activated') {
            const count = parseInt(this.notActivatedCount.textContent) + 1;
            this.notActivatedCount.textContent = count.toString();
        } else {
            const count = parseInt(this.errorCount.textContent) + 1;
            this.errorCount.textContent = count.toString();
        }
    }
    
    showResults() {
        this.stepResults.style.display = 'block';
        this.currentStep = 'results';
        
        // Masquer les étapes précédentes
        this.stepProcessing.style.display = 'none';
        
        // Générer le résumé
        this.generateResultsSummary();
        
        // Remplir le tableau de prévisualisation
        this.populateResultsTable();
        
        this.updateStatus('success', `Verification completed - ${this.results.length} keys processed`);
        
        // Télécharger automatiquement le CSV si l'option est activée ET que ce n'est pas déjà fait
        if (localStorage.getItem('autoDownload') === 'true' && !this.autoDownloadTriggered) {
            console.log('🔄 Auto-download enabled, launching in 1 second...');
            this.autoDownloadTriggered = true; // Marquer comme déclenché
            localStorage.setItem('autoDownloadTriggered', 'true'); // Sauvegarder dans localStorage
            setTimeout(async () => {
                console.log('📥 Launching auto-download...');
                await this.downloadResults();
            }, 1000);
        } else if (localStorage.getItem('autoDownload') === 'true' && this.autoDownloadTriggered) {
            console.log('❌ Auto-download already performed');
        } else {
            console.log('❌ Auto-download disabled');
        }
        
        // Réinitialiser les boutons
        this.startCheckingBtn.style.display = 'inline-flex';
        this.stopCheckingBtn.style.display = 'none';
        this.isChecking = false;
    }
    
    generateResultsSummary() {
        const activated = this.results.filter(r => r.status === 'Activated').length;
        const notActivated = this.results.filter(r => r.status === 'Not activated').length;
        const errors = this.results.filter(r => r.status !== 'Activated' && r.status !== 'Not activated').length;
        
        this.resultsSummary.innerHTML = `
            <div class="summary-stats">
                <div class="stat-item activated">
                    <span class="stat-value">${activated}</span>
                    <span class="stat-label">Activated</span>
                </div>
                <div class="stat-item not-activated">
                    <span class="stat-value">${notActivated}</span>
                    <span class="stat-label">Not activated</span>
                </div>
                <div class="stat-item error">
                    <span class="stat-value">${errors}</span>
                    <span class="stat-label">Errors</span>
                </div>
            </div>
        `;
    }
    
    populateResultsTable() {
        this.resultsTableBody.innerHTML = '';
        
        this.results.forEach(result => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${result.value.substring(0, 15)}...</td>
                <td class="status-${result.status.toLowerCase().replace(' ', '-')}">${result.status}</td>
            `;
            this.resultsTableBody.appendChild(row);
        });
    }
    
    async downloadResults() {
        try {
            // Vérifier que les données nécessaires sont disponibles
            if (!this.csvData || !this.csvHeaders || !this.results) {
                console.log('Missing data, attempting restoration...');
                
                // Essayer de restaurer les données depuis le background script
                const restored = await this.forceRestoreData();
                
                if (!restored || !this.csvData || !this.csvHeaders || !this.results) {
                    throw new Error('Unable to retrieve data necessary for download');
                }
            }
            
            // Créer le CSV avec les résultats
            const csvContent = this.generateResultsCSV();
            
            // Créer et télécharger le fichier
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `steam_keys_results_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Nettoyer l'URL créée
            URL.revokeObjectURL(url);
            
            this.updateStatus('success', 'Results downloaded');
            
        } catch (error) {
            console.error('Erreur lors du téléchargement:', error);
            this.showError(`Erreur lors du téléchargement des résultats: ${error.message}`);
        }
    }
    
    generateResultsCSV() {
        // Créer les en-têtes avec les colonnes de statut
        const headers = [...this.csvHeaders];
        if (this.config.key1Column && !headers.includes(`${this.config.key1Column}_status`)) {
            headers.push(`${this.config.key1Column}_status`);
        }
        if (this.config.hasKey2 && this.config.key2Column && !headers.includes(`${this.config.key2Column}_status`)) {
            headers.push(`${this.config.key2Column}_status`);
        }
        
        let csv = headers.join(',') + '\n';
        
        // Ajouter les données avec les statuts
        this.csvData.rows.forEach((row, rowIndex) => {
            const newRow = [...row];
            
            // Ajouter les statuts des clés
            const key1Result = this.results.find(r => r.rowIndex === rowIndex && r.column === this.config.key1Column);
            const key2Result = this.results.find(r => r.rowIndex === rowIndex && r.column === this.config.key2Column);
            
            if (this.config.key1Column) {
                newRow.push(key1Result ? key1Result.status : '');
            }
            if (this.config.hasKey2 && this.config.key2Column) {
                newRow.push(key2Result ? key2Result.status : '');
            }
            
            // Échapper les virgules et guillemets
            const escapedRow = newRow.map(cell => {
                const str = (cell || '').toString();
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            });
            
            csv += escapedRow.join(',') + '\n';
        });
        
        return csv;
    }
    
    resetToStart() {
        // Réinitialiser toutes les données
        this.csvData = null;
        this.csvHeaders = [];
        this.results = [];
        this.isChecking = false;
        this.autoDownloadTriggered = false; // Réinitialiser le flag
        localStorage.setItem('autoDownloadTriggered', 'false'); // Réinitialiser dans localStorage
        
        // Masquer toutes les étapes sauf la première
        this.stepConfig.style.display = 'none';
        this.stepConnection.style.display = 'none';
        this.stepProcessing.style.display = 'none';
        this.stepResults.style.display = 'none';
        
        // Réinitialiser l'upload
        this.fileDropZone.style.display = 'block';
        this.fileInfo.style.display = 'none';
        this.csvFileInput.value = '';
        
        // Réinitialiser l'état
        chrome.runtime.sendMessage({ type: 'resetState' });
        
        // Réinitialiser le texte du bouton
        this.startCheckingBtn.innerHTML = '🔍 Start verification';
        
        this.updateStatus('success', 'Prêt pour une nouvelle vérification');
        this.currentStep = 'upload';
    }
    
    updateStatus(type, message) {
        this.statusIndicator.className = `status-indicator ${type}`;
        this.statusText.textContent = message;
    }
    
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorModal.style.display = 'flex';
    }
    
    hideErrorModal() {
        this.errorModal.style.display = 'none';
    }

    showProgressWithRestoredData(state) {
        // Afficher la section de progression
        this.progressSection.style.display = 'block';
        
        // Masquer le bouton de démarrage, afficher celui d'arrêt
        this.startCheckingBtn.style.display = 'none';
        this.stopCheckingBtn.style.display = 'inline-flex';
        
        // Mettre à jour la barre de progression
        this.updateProgress(state.checkedKeys, state.totalKeys);
        
        // Mettre à jour le texte de la clé actuelle
        if (state.currentKey) {
            this.currentKeyText.textContent = `Vérification: ${state.currentKey}`;
        }
        
        // Mettre à jour les compteurs avec les résultats existants
        this.resetCounters();
        this.results.forEach(result => {
            this.updateCounters(result.status);
        });
        
        // Calculer le temps écoulé si disponible
        if (state.startTime) {
            const elapsedTime = Math.floor((Date.now() - state.startTime) / 1000);
            const elapsedMinutes = Math.floor(elapsedTime / 60);
            const elapsedSeconds = elapsedTime % 60;
            
            // Ajouter l'information de temps dans le statut
            const timeInfo = ` (${elapsedMinutes}m ${elapsedSeconds}s)`;
            this.updateStatus('processing', `Vérification en cours: ${state.checkedKeys}/${state.totalKeys} clés${timeInfo}`);
        }
    }

    async forceRestoreData() {
        try {
            const state = await chrome.runtime.sendMessage({ type: 'getExtensionState' });
            
            if (state.csvData) {
                this.csvData = state.csvData;
                this.csvHeaders = state.csvData.headers;
            }
            
            if (state.config) {
                this.config = state.config;
            }
            
            if (state.currentResults) {
                this.results = state.currentResults;
            }
            
            return true;
        } catch (error) {
            console.error('Erreur lors de la restauration forcée:', error);
            return false;
        }
    }

    initializeAutoDownloadOption() {
        const autoDownload = localStorage.getItem('autoDownload') === 'true';
        this.autoDownloadCheckbox.checked = autoDownload;
        console.log('🔧 Option téléchargement automatique initialisée:', autoDownload);
    }
}

// Initialisation automatique du popup
new SteamKeysPopup(); 