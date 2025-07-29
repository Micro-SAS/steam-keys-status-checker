#!/usr/bin/env python3
"""
Steam Keys Checker - Application Desktop
Interface graphique moderne pour la vérification des clés Steam via Steamworks.
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import pandas as pd
import threading
import time
import os
import random
import logging
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

class SteamKeysCheckerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("🔑 Steam Keys Status Checker")
        self.root.geometry("800x600")
        self.root.configure(bg='#f0f0f0')
        
        # Configuration
        self.STEAMWORKS_URL = "https://partner.steamgames.com/querycdkey/"
        self.MIN_DELAY = 1
        self.MAX_DELAY = 10
        
        # Variables
        self.uploaded_df = None
        self.config = {
            'has_two_columns': False,
            'key1_column': 'key_1',
            'key2_column': 'key_2',
            'filter_column': 'to check'
        }
        self.driver = None
        self.is_processing = False
        
        self.setup_ui()
        self.setup_logging()
    
    def setup_logging(self):
        """Configure le système de logging."""
        log_filename = f"steam_keys_checker_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_filename, encoding='utf-8'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def setup_ui(self):
        """Configure l'interface utilisateur."""
        # Style
        style = ttk.Style()
        style.theme_use('clam')
        
        # Frame principal
        main_frame = ttk.Frame(self.root, padding="20")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Titre
        title_label = ttk.Label(main_frame, text="🔑 Steam Keys Status Checker", 
                               font=('Arial', 16, 'bold'))
        title_label.grid(row=0, column=0, columnspan=3, pady=(0, 20))
        
        # Section 1: Fichier CSV
        csv_frame = ttk.LabelFrame(main_frame, text="📁 Fichier CSV", padding="10")
        csv_frame.grid(row=1, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        
        self.file_button = ttk.Button(csv_frame, text="Choisir fichier CSV", 
                                     command=self.select_csv_file)
        self.file_button.grid(row=0, column=0, padx=(0, 10))
        
        self.file_label = ttk.Label(csv_frame, text="Aucun fichier sélectionné", 
                                   foreground="gray")
        self.file_label.grid(row=0, column=1, sticky=tk.W)
        
        # Section 2: Configuration
        config_frame = ttk.LabelFrame(main_frame, text="⚙️ Configuration", padding="10")
        config_frame.grid(row=2, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        
        # Checkbox pour 2 colonnes
        self.two_columns_var = tk.BooleanVar()
        self.two_columns_check = ttk.Checkbutton(config_frame, 
                                                text="J'ai 2 colonnes de clés Steam",
                                                variable=self.two_columns_var,
                                                command=self.toggle_second_column)
        self.two_columns_check.grid(row=0, column=0, columnspan=2, sticky=tk.W, pady=(0, 10))
        
        # Noms des colonnes
        ttk.Label(config_frame, text="Nom colonne 1:").grid(row=1, column=0, sticky=tk.W, padx=(0, 5))
        self.key1_entry = ttk.Entry(config_frame, width=15)
        self.key1_entry.insert(0, "key_1")
        self.key1_entry.grid(row=1, column=1, sticky=tk.W, padx=(0, 20))
        
        ttk.Label(config_frame, text="Nom colonne 2:").grid(row=1, column=2, sticky=tk.W, padx=(0, 5))
        self.key2_entry = ttk.Entry(config_frame, width=15, state='disabled')
        self.key2_entry.insert(0, "key_2")
        self.key2_entry.grid(row=1, column=3, sticky=tk.W)
        
        ttk.Label(config_frame, text="Colonne filtre:").grid(row=2, column=0, sticky=tk.W, padx=(0, 5), pady=(10, 0))
        self.filter_entry = ttk.Entry(config_frame, width=15)
        self.filter_entry.insert(0, "to check")
        self.filter_entry.grid(row=2, column=1, sticky=tk.W, pady=(10, 0))
        
        # Section 3: Informations CSV
        info_frame = ttk.LabelFrame(main_frame, text="📊 Informations CSV", padding="10")
        info_frame.grid(row=3, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        
        self.info_text = scrolledtext.ScrolledText(info_frame, height=6, width=70, 
                                                  state='disabled')
        self.info_text.grid(row=0, column=0, sticky=(tk.W, tk.E))
        
        # Section 4: Contrôles
        control_frame = ttk.Frame(main_frame)
        control_frame.grid(row=4, column=0, columnspan=3, pady=(0, 10))
        
        self.start_button = ttk.Button(control_frame, text="🚀 Lancer la vérification", 
                                      command=self.start_verification, state='disabled')
        self.start_button.grid(row=0, column=0, padx=(0, 10))
        
        self.stop_button = ttk.Button(control_frame, text="⏹️ Arrêter", 
                                     command=self.stop_verification, state='disabled')
        self.stop_button.grid(row=0, column=1)
        
        # Section 5: Progression
        progress_frame = ttk.LabelFrame(main_frame, text="📈 Progression", padding="10")
        progress_frame.grid(row=5, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        
        self.progress_var = tk.StringVar(value="Prêt")
        self.progress_label = ttk.Label(progress_frame, textvariable=self.progress_var)
        self.progress_label.grid(row=0, column=0, sticky=tk.W)
        
        self.progress_bar = ttk.Progressbar(progress_frame, mode='determinate')
        self.progress_bar.grid(row=1, column=0, sticky=(tk.W, tk.E), pady=(5, 0))
        
        # Section 6: Log
        log_frame = ttk.LabelFrame(main_frame, text="📝 Journal", padding="10")
        log_frame.grid(row=6, column=0, columnspan=3, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 10))
        
        self.log_text = scrolledtext.ScrolledText(log_frame, height=8, width=70)
        self.log_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Configuration du redimensionnement
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(0, weight=1)
        main_frame.rowconfigure(6, weight=1)
        csv_frame.columnconfigure(1, weight=1)
        info_frame.columnconfigure(0, weight=1)
        progress_frame.columnconfigure(0, weight=1)
        log_frame.columnconfigure(0, weight=1)
        log_frame.rowconfigure(0, weight=1)
    
    def log_message(self, message):
        """Ajoute un message au journal."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.log_text.insert(tk.END, f"[{timestamp}] {message}\n")
        self.log_text.see(tk.END)
        self.root.update_idletasks()
    
    def select_csv_file(self):
        """Sélectionne et charge un fichier CSV."""
        file_path = filedialog.askopenfilename(
            title="Sélectionner un fichier CSV",
            filetypes=[("Fichiers CSV", "*.csv"), ("Tous les fichiers", "*.*")]
        )
        
        if file_path:
            try:
                self.uploaded_df = pd.read_csv(file_path)
                filename = os.path.basename(file_path)
                
                self.file_label.config(text=f"✅ {filename} - {len(self.uploaded_df)} lignes, {len(self.uploaded_df.columns)} colonnes", 
                                     foreground="green")
                
                # Afficher les informations du CSV
                self.display_csv_info()
                
                # Activer le bouton de démarrage
                self.start_button.config(state='normal')
                
                self.log_message(f"CSV chargé: {filename}")
                
            except Exception as e:
                messagebox.showerror("Erreur", f"Erreur lors du chargement du CSV:\n{str(e)}")
                self.log_message(f"Erreur chargement CSV: {str(e)}")
    
    def display_csv_info(self):
        """Affiche les informations du CSV chargé."""
        if self.uploaded_df is None:
            return
        
        self.info_text.config(state='normal')
        self.info_text.delete(1.0, tk.END)
        
        info = f"📊 Colonnes disponibles dans votre CSV:\n"
        for i, col in enumerate(self.uploaded_df.columns, 1):
            info += f"  {i}. {col}\n"
        
        info += f"\n💡 Ajustez les noms de colonnes ci-dessus si nécessaire.\n"
        info += f"\n📈 Aperçu des données:\n"
        info += str(self.uploaded_df.head())
        
        self.info_text.insert(1.0, info)
        self.info_text.config(state='disabled')
    
    def toggle_second_column(self):
        """Active/désactive la deuxième colonne."""
        if self.two_columns_var.get():
            self.key2_entry.config(state='normal')
        else:
            self.key2_entry.config(state='disabled')
    
    def update_config(self):
        """Met à jour la configuration depuis l'interface."""
        self.config['has_two_columns'] = self.two_columns_var.get()
        self.config['key1_column'] = self.key1_entry.get()
        self.config['key2_column'] = self.key2_entry.get()
        self.config['filter_column'] = self.filter_entry.get()
    
    def start_verification(self):
        """Lance la vérification dans un thread séparé."""
        if self.uploaded_df is None:
            messagebox.showerror("Erreur", "Aucun fichier CSV chargé!")
            return
        
        self.is_processing = True
        self.start_button.config(state='disabled')
        self.stop_button.config(state='normal')
        
        # Lancer dans un thread pour ne pas bloquer l'interface
        thread = threading.Thread(target=self.verification_process)
        thread.daemon = True
        thread.start()
    
    def stop_verification(self):
        """Arrête la vérification."""
        self.is_processing = False
        if self.driver:
            try:
                self.driver.quit()
            except:
                pass
        
        self.start_button.config(state='normal')
        self.stop_button.config(state='disabled')
        self.progress_var.set("Arrêté")
        self.log_message("Vérification arrêtée par l'utilisateur")
    
    def verification_process(self):
        """Processus principal de vérification."""
        try:
            self.update_config()
            
            self.log_message("🔑 Démarrage de la vérification Steam Keys")
            self.progress_var.set("Préparation...")
            
            # Vérification des colonnes
            df = self.uploaded_df.copy()
            
            if self.config['key1_column'] not in df.columns:
                messagebox.showerror("Erreur", f"Colonne '{self.config['key1_column']}' non trouvée!")
                return
            
            self.log_message(f"✅ Colonne '{self.config['key1_column']}' trouvée avec {df[self.config['key1_column']].notna().sum()} clés")
            
            # Créer les colonnes de statut
            key1_status_column = f"{self.config['key1_column']}_status"
            if key1_status_column not in df.columns:
                df[key1_status_column] = None
            
            if self.config['has_two_columns'] and self.config['key2_column'] in df.columns:
                self.log_message(f"✅ Colonne '{self.config['key2_column']}' trouvée avec {df[self.config['key2_column']].notna().sum()} clés")
                key2_status_column = f"{self.config['key2_column']}_status"
                if key2_status_column not in df.columns:
                    df[key2_status_column] = None
            
            # Préparer la liste des clés à vérifier
            keys_to_verify = self.prepare_keys_list(df)
            
            if len(keys_to_verify) == 0:
                self.log_message("ℹ️ Toutes les clés ont déjà été vérifiées ou aucune clé valide trouvée")
                return
            
            # Statistiques
            key1_count = sum(1 for _, col, _ in keys_to_verify if col == self.config['key1_column'])
            key2_count = sum(1 for _, col, _ in keys_to_verify if col == self.config['key2_column'])
            
            self.log_message(f"🔍 Démarrage de la vérification de {len(keys_to_verify)} clés...")
            self.log_message(f"   - {key1_count} clés dans {self.config['key1_column']}")
            self.log_message(f"   - {key2_count} clés dans {self.config['key2_column']}")
            
            # Configuration de la barre de progression
            self.progress_bar.config(maximum=len(keys_to_verify))
            
            # Demander à l'utilisateur de se connecter
            response = messagebox.askokcancel(
                "Connexion Steamworks",
                "Chrome va s'ouvrir pour vous connecter à Steamworks.\n\n"
                "1. Connectez-vous à votre compte Steamworks\n"
                "2. Cliquez OK quand vous êtes connecté\n"
                "3. La vérification commencera automatiquement"
            )
            
            if not response:
                return
            
            # Initialiser le driver
            self.progress_var.set("Ouverture de Chrome...")
            self.driver = self.setup_driver()
            
            # Première visite pour la connexion
            self.driver.get(self.STEAMWORKS_URL)
            self.log_message("🌐 Chrome ouvert. Connectez-vous à Steamworks...")
            
            # Attendre la confirmation de connexion
            messagebox.showinfo(
                "Connexion",
                "Connectez-vous à Steamworks dans la fenêtre Chrome qui s'est ouverte, puis cliquez OK pour continuer."
            )
            
            # Vérification des clés
            checked_count = 0
            
            for index, column_name, steam_key in keys_to_verify:
                if not self.is_processing:
                    break
                
                self.progress_var.set(f"Vérification {checked_count + 1}/{len(keys_to_verify)}")
                self.log_message(f"[{checked_count + 1}/{len(keys_to_verify)}] Vérification {column_name}: {steam_key[:10]}...")
                
                # Vérifier la clé
                status = self.check_steam_key(steam_key)
                
                # Mettre à jour le DataFrame
                status_column = f"{column_name}_status"
                df.loc[index, status_column] = status
                
                self.log_message(f"   Statut: {status}")
                
                checked_count += 1
                self.progress_bar['value'] = checked_count
                
                # Délai entre les vérifications
                if checked_count < len(keys_to_verify) and self.is_processing:
                    delay = random.uniform(self.MIN_DELAY, self.MAX_DELAY)
                    self.log_message(f"   Attente {delay:.1f} secondes...")
                    time.sleep(delay)
            
            # Sauvegarder les résultats
            if checked_count > 0:
                self.save_results(df)
                self.display_summary(df)
            
        except Exception as e:
            self.log_message(f"❌ Erreur pendant la vérification: {e}")
            messagebox.showerror("Erreur", f"Erreur pendant la vérification:\n{str(e)}")
        
        finally:
            if self.driver:
                try:
                    self.driver.quit()
                    self.log_message("🌐 Chrome fermé")
                except:
                    pass
            
            self.is_processing = False
            self.start_button.config(state='normal')
            self.stop_button.config(state='disabled')
            self.progress_var.set("Terminé")
    
    def setup_driver(self):
        """Configure et initialise le driver Chrome."""
        chrome_options = Options()
        
        # Options pour une meilleure stabilité
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        # Masquer l'automatisation
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        return driver
    
    def check_steam_key(self, steam_key):
        """Vérifie le statut d'une clé Steam."""
        try:
            # Aller à la page de vérification
            self.driver.get(self.STEAMWORKS_URL)
            
            # Attendre et trouver le champ de saisie
            wait = WebDriverWait(self.driver, 10)
            
            try:
                key_input = wait.until(EC.presence_of_element_located((By.NAME, "cdkey")))
            except:
                return "Error: cdkey field not found"
            
            # Saisir la clé
            key_input.clear()
            time.sleep(0.5)
            
            # Saisie caractère par caractère
            for char in steam_key:
                key_input.send_keys(char)
                time.sleep(0.1)
            
            # Vérifier la saisie
            typed_value = key_input.get_attribute('value')
            if typed_value != steam_key:
                key_input.clear()
                key_input.send_keys(steam_key)
                time.sleep(0.5)
                typed_value = key_input.get_attribute('value')
                
                if typed_value != steam_key:
                    return f"Error: Unable to enter key correctly"
            
            # Soumettre le formulaire
            try:
                form = self.driver.find_element(By.ID, "queryForm")
                form.submit()
            except:
                # Chercher le bouton de soumission
                button_selectors = [
                    "input[type='submit']",
                    "button[type='submit']",
                    "input[value*='Vérifier']",
                    "input[value*='Verify']"
                ]
                
                verify_button = None
                for selector in button_selectors:
                    try:
                        verify_button = self.driver.find_element(By.CSS_SELECTOR, selector)
                        break
                    except:
                        continue
                
                if not verify_button:
                    return "Error: Verification button not found"
                
                verify_button.click()
            
            # Attendre le résultat
            time.sleep(3)
            
            # Analyser le statut
            return self.parse_status()
            
        except Exception as e:
            return f"Error: {str(e)}"
    
    def parse_status(self):
        """Analyse le statut retourné par Steamworks."""
        status = "Status not found"
        
        try:
            # Chercher le span avec couleur
            status_span = self.driver.find_element(By.XPATH, "//td/span[contains(@style, 'color')]")
            status_text = status_span.text.strip()
            status_color = status_span.get_attribute('style')
            
            # Analyser la couleur
            if ("#67c1f5" in status_color or 
                "rgb(103, 193, 245)" in status_color or 
                status_text.lower() == "activée"):
                status = "Activated"
            elif ("#e24044" in status_color or 
                  "rgb(226, 64, 68)" in status_color or 
                  status_text.lower() == "non activée"):
                status = "Not activated"
            else:
                status = f"Unknown status: {status_text}"
                
        except:
            # Méthodes alternatives de détection
            try:
                # Chercher par couleur exacte
                activated_spans = self.driver.find_elements(By.XPATH, "//span[@style='color: #67c1f5']")
                for span in activated_spans:
                    if "activée" in span.text.lower():
                        status = "Activated"
                        break
                
                if status == "Status not found":
                    not_activated_spans = self.driver.find_elements(By.XPATH, "//span[@style='color: #e24044']")
                    for span in not_activated_spans:
                        if "non activée" in span.text.lower():
                            status = "Not activated"
                            break
                
                # Recherche dans les cellules de tableau
                if status == "Status not found":
                    status_cells = self.driver.find_elements(By.TAG_NAME, "td")
                    for cell in status_cells:
                        cell_text = cell.text.strip().lower()
                        if "non activée" in cell_text:
                            status = "Not activated"
                            break
                        elif "activée" in cell_text:
                            status = "Activated"
                            break
                        elif "invalid" in cell_text or "invalide" in cell_text:
                            status = "Invalid"
                            break
                            
            except Exception as inner_e:
                status = f"Error during detection: {str(inner_e)}"
        
        return status
    
    def prepare_keys_list(self, df):
        """Prépare la liste des clés à vérifier."""
        keys_to_verify = []
        
        # Clés de la première colonne
        key1_status_column = f"{self.config['key1_column']}_status"
        key1_to_check = df[(df[self.config['key1_column']].notna()) & 
                          (df[self.config['key1_column']] != '') & 
                          (df[key1_status_column].isna())]
        
        for index, row in key1_to_check.iterrows():
            if self.should_check_key(row):
                keys_to_verify.append((index, self.config['key1_column'], row[self.config['key1_column']]))
        
        # Clés de la deuxième colonne si configurée
        if self.config['has_two_columns'] and self.config['key2_column'] in df.columns:
            key2_status_column = f"{self.config['key2_column']}_status"
            if key2_status_column in df.columns:
                key2_to_check = df[(df[self.config['key2_column']].notna()) & 
                                  (df[self.config['key2_column']] != '') & 
                                  (df[key2_status_column].isna())]
                
                for index, row in key2_to_check.iterrows():
                    if self.should_check_key(row):
                        keys_to_verify.append((index, self.config['key2_column'], row[self.config['key2_column']]))
        
        return keys_to_verify
    
    def should_check_key(self, row):
        """Détermine si une clé doit être vérifiée."""
        if self.config['filter_column'] not in row:
            return True
        
        to_check_value = row[self.config['filter_column']]
        
        if pd.isna(to_check_value):
            return False
        
        if isinstance(to_check_value, str):
            to_check_value = to_check_value.strip().lower()
            return to_check_value in ['true', '1', 'yes', 'oui']
        
        if isinstance(to_check_value, (int, float)):
            return bool(to_check_value)
        
        return bool(to_check_value)
    
    def save_results(self, df):
        """Sauvegarde les résultats dans un fichier CSV."""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_filename = f'steam_keys_with_status_{timestamp}.csv'
        df.to_csv(output_filename, index=False)
        
        self.log_message(f"💾 Résultats sauvegardés dans: {output_filename}")
        
        # Proposer d'ouvrir le dossier
        if messagebox.askyesno("Sauvegarde", f"Résultats sauvegardés dans:\n{output_filename}\n\nOuvrir le dossier?"):
            import subprocess
            import platform
            
            if platform.system() == "Windows":
                subprocess.run(["explorer", "/select,", output_filename])
            elif platform.system() == "Darwin":  # macOS
                subprocess.run(["open", "-R", output_filename])
            else:  # Linux
                subprocess.run(["xdg-open", os.path.dirname(output_filename)])
    
    def display_summary(self, df):
        """Affiche le résumé des résultats."""
        self.log_message("\n📊 Résumé des statuts:")
        
        key1_status_column = f"{self.config['key1_column']}_status"
        if key1_status_column in df.columns:
            key1_counts = df[key1_status_column].value_counts()
            self.log_message(f"  {self.config['key1_column']}:")
            for status, count in key1_counts.items():
                if pd.notna(status):
                    self.log_message(f"    {status}: {count}")
        
        if self.config['has_two_columns']:
            key2_status_column = f"{self.config['key2_column']}_status"
            if key2_status_column in df.columns:
                key2_counts = df[key2_status_column].value_counts()
                self.log_message(f"  {self.config['key2_column']}:")
                for status, count in key2_counts.items():
                    if pd.notna(status):
                        self.log_message(f"    {status}: {count}")
        
        # Total
        total_verified = 0
        if key1_status_column in df.columns:
            total_verified += df[key1_status_column].notna().sum()
        if self.config['has_two_columns'] and f"{self.config['key2_column']}_status" in df.columns:
            total_verified += df[f"{self.config['key2_column']}_status"].notna().sum()
        
        self.log_message(f"\n🎯 Total de clés vérifiées: {total_verified}")
        self.log_message("✅ Traitement terminé !")

def main():
    root = tk.Tk()
    app = SteamKeysCheckerApp(root)
    root.mainloop()

if __name__ == "__main__":
    main() 