#!/usr/bin/env python3
"""
Script de packaging pour Steam Keys Checker
Crée un exécutable distributable de l'application.
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def install_pyinstaller():
    """Installe PyInstaller si nécessaire."""
    try:
        import PyInstaller
        print("✅ PyInstaller déjà installé")
    except ImportError:
        print("📦 Installation de PyInstaller...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])
        print("✅ PyInstaller installé")

def clean_build():
    """Nettoie les dossiers de build précédents."""
    folders_to_clean = ['build', 'dist', '__pycache__']
    
    for folder in folders_to_clean:
        if os.path.exists(folder):
            shutil.rmtree(folder)
            print(f"🧹 Dossier {folder} nettoyé")

def create_spec_file():
    """Crée le fichier .spec pour PyInstaller."""
    spec_content = '''# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['steam_keys_gui.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('README.md', '.'),
    ],
    hiddenimports=[
        'selenium',
        'pandas',
        'webdriver_manager',
        'tkinter',
        'threading'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='SteamKeysChecker',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)
'''
    
    with open('steam_keys_checker.spec', 'w') as f:
        f.write(spec_content)
    
    print("✅ Fichier .spec créé")

def build_executable():
    """Construit l'exécutable."""
    print("🔨 Construction de l'exécutable...")
    
    cmd = [
        'pyinstaller',
        '--onefile',
        '--windowed',
        '--name=SteamKeysChecker',
        '--add-data=README.md:.',
        'steam_keys_gui.py'
    ]
    
    try:
        subprocess.check_call(cmd)
        print("✅ Exécutable créé avec succès!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur lors de la construction: {e}")
        return False
    
    return True

def create_installer_script():
    """Crée un script d'installation simple."""
    if sys.platform == "win32":
        installer_content = '''@echo off
echo 🔑 Steam Keys Status Checker - Installation
echo ==========================================
echo.
echo Installation des dépendances...
pip install -r requirements.txt
echo.
echo ✅ Installation terminée!
echo.
echo Pour lancer l'application:
echo   python steam_keys_gui.py
echo.
pause
'''
        with open('install.bat', 'w') as f:
            f.write(installer_content)
        print("✅ Script d'installation Windows créé (install.bat)")
    
    else:  # Unix/Linux/macOS
        installer_content = '''#!/bin/bash
echo "🔑 Steam Keys Status Checker - Installation"
echo "=========================================="
echo
echo "Installation des dépendances..."
pip3 install -r requirements.txt
echo
echo "✅ Installation terminée!"
echo
echo "Pour lancer l'application:"
echo "  python3 steam_keys_gui.py"
echo
read -p "Appuyez sur Entrée pour continuer..."
'''
        with open('install.sh', 'w') as f:
            f.write(installer_content)
        
        # Rendre exécutable
        os.chmod('install.sh', 0o755)
        print("✅ Script d'installation Unix créé (install.sh)")

def create_readme_app():
    """Crée un README spécifique pour l'application desktop."""
    readme_content = '''# 🔑 Steam Keys Status Checker - Application Desktop

## 🚀 Démarrage Rapide

### Option 1 : Exécutable (Recommandé)
1. Téléchargez `SteamKeysChecker.exe` (Windows) ou `SteamKeysChecker` (Mac/Linux)
2. Double-cliquez pour lancer l'application
3. Suivez les instructions à l'écran

### Option 2 : Script Python
1. Installez Python 3.8+ sur votre système
2. Exécutez le script d'installation :
   - Windows : `install.bat`
   - Mac/Linux : `./install.sh`
3. Lancez l'application : `python steam_keys_gui.py`

## 📋 Utilisation

1. **Choisir fichier CSV** : Sélectionnez votre fichier de clés Steam
2. **Configuration** : 
   - Cochez "2 colonnes" si vous avez deux colonnes de clés
   - Ajustez les noms des colonnes si nécessaire
3. **Lancer la vérification** : Chrome s'ouvrira automatiquement
4. **Connexion Steamworks** : Connectez-vous dans la fenêtre Chrome
5. **Attendre** : La vérification se fait automatiquement
6. **Récupérer** : Le CSV avec les statuts sera sauvegardé

## 🔧 Configuration CSV

Votre fichier CSV doit contenir :
- **Colonnes de clés** : `key_1`, `key_2` (optionnel)
- **Colonne de filtrage** : `to check` (valeurs: true/false, 1/0, yes/no)

## 📊 Résultats

Les statuts suivants sont détectés :
- **Activated** : Clé déjà utilisée
- **Not activated** : Clé disponible
- **Invalid** : Clé non valide
- **Error** : Problème lors de la vérification

## ⚠️ Prérequis

- Compte Steamworks Partner valide
- Connexion Internet stable
- Chrome installé sur votre système

## 🆘 Support

En cas de problème :
1. Vérifiez que Chrome est installé
2. Vérifiez votre connexion Steamworks
3. Consultez les logs dans l'application
4. Contactez le support : [GitHub Issues](https://github.com/Micro-SAS/steam-keys-status-checker/issues)

---

**Version 2.0 Desktop** - Créé par [Micro-SAS](https://github.com/Micro-SAS)
'''
    
    with open('README_DESKTOP.md', 'w') as f:
        f.write(readme_content)
    
    print("✅ README desktop créé")

def main():
    print("🔑 Steam Keys Checker - Script de Packaging")
    print("=" * 50)
    
    # Vérifier qu'on est dans le bon répertoire
    if not os.path.exists('steam_keys_gui.py'):
        print("❌ Erreur: steam_keys_gui.py non trouvé!")
        print("Exécutez ce script depuis le répertoire du projet.")
        return
    
    # Nettoyer les builds précédents
    clean_build()
    
    # Installer PyInstaller
    install_pyinstaller()
    
    # Créer les fichiers d'installation
    create_installer_script()
    create_readme_app()
    
    # Demander si on veut créer l'exécutable
    response = input("\n🤔 Voulez-vous créer l'exécutable? (y/N): ").lower()
    if response in ['y', 'yes', 'oui']:
        if build_executable():
            print("\n🎉 Packaging terminé avec succès!")
            print(f"📁 Exécutable disponible dans: dist/")
            
            if os.path.exists('dist/SteamKeysChecker.exe'):
                print(f"   - Windows: dist/SteamKeysChecker.exe")
            elif os.path.exists('dist/SteamKeysChecker'):
                print(f"   - Unix: dist/SteamKeysChecker")
        else:
            print("\n❌ Erreur lors du packaging")
    else:
        print("\n✅ Scripts d'installation créés")
        print("Pour créer l'exécutable plus tard, relancez ce script.")
    
    print("\n📋 Fichiers créés:")
    files_created = []
    if os.path.exists('install.bat'):
        files_created.append("install.bat (Windows)")
    if os.path.exists('install.sh'):
        files_created.append("install.sh (Unix)")
    if os.path.exists('README_DESKTOP.md'):
        files_created.append("README_DESKTOP.md")
    if os.path.exists('dist/'):
        files_created.append("dist/ (exécutable)")
    
    for file in files_created:
        print(f"   - {file}")

if __name__ == "__main__":
    main() 