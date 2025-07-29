#!/usr/bin/env python3
"""
Steam Keys Checker
Automatically check the status of Steam keys via Steamworks.
"""

import pandas as pd
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

# Configuration
CSV_FILE_PATH = "data/steam-keys.csv"
STEAMWORKS_URL = "https://partner.steamgames.com/querycdkey/"
MIN_DELAY = 1  # Minimum delay in seconds between each verification
MAX_DELAY = 10  # Maximum delay in seconds between each verification
CHECK_KEY_2 = True  # Also check the key_2 column. Useful if you send 2 keys per content creator.

# Column names configuration - CUSTOMIZE THESE FOR YOUR CSV
KEY_1_COLUMN = "key_1"  # Name of the first key column in your CSV
KEY_2_COLUMN = "key_2"  # Name of the second key column in your CSV (if CHECK_KEY_2 is True)
TO_CHECK_COLUMN = "to check"  # Name of the column that determines if a key should be checked

# Logging configuration
def setup_logging():
    """Configure the logging system."""
    log_filename = f"steam_keys_checker_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_filename, encoding='utf-8'),
            logging.StreamHandler()
        ]
    )
    return logging.getLogger(__name__)

def setup_driver():
    """Configure and initialize the Chrome driver."""
    logger = logging.getLogger(__name__)
    logger.info("Configuring Chrome browser")
    chrome_options = Options()
    
    # Options for better stability
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    # Headless mode (no GUI) - uncomment if you want
    # chrome_options.add_argument("--headless")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    # Hide that it's an automated browser
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    return driver

def check_steam_key(driver, steam_key):
    """Check the status of a Steam key on the Steamworks site with an improved method."""
    logger = logging.getLogger(__name__)
    try:
        # Go to the verification page
        driver.get(STEAMWORKS_URL)
        
        # Wait for the page to load
        wait = WebDriverWait(driver, 10)
        
        # Find the specific input field with name="cdkey"
        try:
            key_input = wait.until(EC.presence_of_element_located((By.NAME, "cdkey")))
        except:
            return "Error: cdkey field not found"
        
        # Clear the field
        key_input.clear()
        time.sleep(0.5)  # Small pause
        
        # Enter the key character by character for better reliability
        for char in steam_key:
            key_input.send_keys(char)
            time.sleep(0.1)  # Pause between each character
        
        # Verify that the key was entered correctly
        typed_value = key_input.get_attribute('value')
        if typed_value != steam_key:
            # Retry if the first attempt didn't work
            key_input.clear()
            key_input.send_keys(steam_key)
            time.sleep(0.5)
            typed_value = key_input.get_attribute('value')
            
            if typed_value != steam_key:
                return f"Error: Unable to enter the key correctly (expected: {steam_key}, got: {typed_value})"
        
        # Find and submit the form directly
        try:
            form = driver.find_element(By.ID, "queryForm")
            form.submit()
        except:
            # If direct submission fails, look for the button
            verify_button = None
            button_selectors = [
                "input[type='submit']",
                "button[type='submit']",
                "input[value*='Vérifier']",
                "input[value*='Verify']"
            ]
            
            for selector in button_selectors:
                try:
                    verify_button = driver.find_element(By.CSS_SELECTOR, selector)
                    break
                except:
                    continue
            
            if not verify_button:
                return "Error: Verification button not found"
            
            verify_button.click()
        
        # Wait for the result
        time.sleep(3)
        
        # Verify that the key is still present after submission
        try:
            result_input = driver.find_element(By.NAME, "cdkey")
            final_value = result_input.get_attribute('value')
            if final_value != steam_key:
                return f"Error: The key was not submitted correctly (final: {final_value})"
        except:
            pass  # Don't fail if we can't verify
        
        # Search for status with an improved method
        status = "Status not found"
        
        try:
            # Search for status span with color
            status_span = driver.find_element(By.XPATH, "//td/span[contains(@style, 'color')]")
            status_text = status_span.text.strip()
            status_color = status_span.get_attribute('style')
            
            # Check if it's "Activated"
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
            # Alternative method: search in all content
            try:
                # Search for spans with specific colors (hex format)
                activated_spans = driver.find_elements(By.XPATH, "//span[@style='color: #67c1f5']")
                for span in activated_spans:
                    if "activée" in span.text.lower():
                        status = "Activated"
                        break
                
                if status == "Status not found":
                    not_activated_spans = driver.find_elements(By.XPATH, "//span[@style='color: #e24044']")
                    for span in not_activated_spans:
                        if "non activée" in span.text.lower():
                            status = "Not activated"
                            break
                
                # If still not found, search by RGB color
                if status == "Status not found":
                    rgb_activated_spans = driver.find_elements(By.XPATH, "//span[contains(@style, 'rgb(103, 193, 245)')]")
                    for span in rgb_activated_spans:
                        if "activée" in span.text.lower():
                            status = "Activated"
                            break
                
                if status == "Status not found":
                    rgb_not_activated_spans = driver.find_elements(By.XPATH, "//span[contains(@style, 'rgb(226, 64, 68)')]")
                    for span in rgb_not_activated_spans:
                        if "non activée" in span.text.lower():
                            status = "Not activated"
                            break
                
                # Last resort: search in table cells
                if status == "Status not found":
                    status_cells = driver.find_elements(By.TAG_NAME, "td")
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
        
        logger.info(f"Key {steam_key[:10]}... - Status: {status}")
        return status
        
    except Exception as e:
        error_msg = f"Error: {str(e)}"
        logger.error(f"Key {steam_key[:10]}... - {error_msg}")
        return error_msg

def should_check_key(row):
    """Determines if a row should be checked based on the 'to check' column."""
    
    # Check if the 'to check' column exists
    if TO_CHECK_COLUMN not in row:
        return True  # If the column doesn't exist, check all keys
    
    to_check_value = row[TO_CHECK_COLUMN]
    
    # Convert to boolean: True if the value is True, 'True', 'true', 1, or '1'
    if pd.isna(to_check_value):
        return False  # If NaN, don't check
    
    # Convert string values to boolean
    if isinstance(to_check_value, str):
        to_check_value = to_check_value.strip().lower()
        return to_check_value in ['true', '1', 'yes', 'oui']
    
    # For numeric values
    if isinstance(to_check_value, (int, float)):
        return bool(to_check_value)
    
    # For boolean values
    return bool(to_check_value)

def main():
    logger = setup_logging()
    logger.info("🚀 Starting Steam Keys Checker")
    print("🚀 Steam Keys Checker")
    print("=" * 50)
    
    # Check if the CSV file exists
    if not os.path.exists(CSV_FILE_PATH):
        logger.error(f"CSV file not found: {CSV_FILE_PATH}")
        print(f"❌ The file {CSV_FILE_PATH} does not exist.")
        print("Please place your CSV file in the project directory.")
        return
    
    logger.info(f"CSV file found: {CSV_FILE_PATH}")
    print(f"✅ CSV file found: {CSV_FILE_PATH}")
    
    # Load the CSV file
    try:
        df = pd.read_csv(CSV_FILE_PATH)
        logger.info(f"CSV loaded: {len(df)} rows, columns: {list(df.columns)}")
        print(f"✅ CSV loaded successfully: {len(df)} rows")
        print(f"Available columns: {list(df.columns)}")
        
        # Check if the key_1 column exists
        if KEY_1_COLUMN not in df.columns:
            print(f"❌ Column '{KEY_1_COLUMN}' not found in CSV")
            return
        
        print(f"✅ Column '{KEY_1_COLUMN}' found with {df[KEY_1_COLUMN].notna().sum()} keys")
        
        # Create status columns if they don't exist
        key1_status_column = f"{KEY_1_COLUMN}_status"
        if key1_status_column not in df.columns:
            df[key1_status_column] = None
            print(f"✅ Column '{key1_status_column}' created")
        
        if CHECK_KEY_2 and KEY_2_COLUMN in df.columns:
            print(f"✅ Column '{KEY_2_COLUMN}' found with {df[KEY_2_COLUMN].notna().sum()} keys")
            key2_status_column = f"{KEY_2_COLUMN}_status"
            if key2_status_column not in df.columns:
                df[key2_status_column] = None
                print(f"✅ Column '{key2_status_column}' created")
        
    except Exception as e:
        logger.error(f"CSV loading error: {e}")
        print(f"❌ Error loading CSV: {e}")
        return
    
    # Prepare the list of keys to verify
    keys_to_verify = []
    
    # Add key_1 keys that are not verified and have non-empty status
    key1_status_column = f"{KEY_1_COLUMN}_status"
    key1_to_check = df[(df[KEY_1_COLUMN].notna()) & (df[KEY_1_COLUMN] != '') & (df[key1_status_column].isna())]
    for index, row in key1_to_check.iterrows():
        if should_check_key(row):
            keys_to_verify.append((index, KEY_1_COLUMN, row[KEY_1_COLUMN]))
    
    # Add key_2 keys if configured
    if CHECK_KEY_2 and KEY_2_COLUMN in df.columns:
        key2_status_column = f"{KEY_2_COLUMN}_status"
        if key2_status_column in df.columns:
            key2_to_check = df[(df[KEY_2_COLUMN].notna()) & (df[KEY_2_COLUMN] != '') & (df[key2_status_column].isna())]
            for index, row in key2_to_check.iterrows():
                if should_check_key(row):
                    keys_to_verify.append((index, KEY_2_COLUMN, row[KEY_2_COLUMN]))
    
    if len(keys_to_verify) == 0:
        logger.info("No keys to verify - all already verified or no valid keys")
        print("ℹ️  All keys have already been verified or no valid keys found")
        return
    
    # Count keys by column
    key1_count = sum(1 for _, col, _ in keys_to_verify if col == KEY_1_COLUMN)
    key2_count = sum(1 for _, col, _ in keys_to_verify if col == KEY_2_COLUMN)
    
    logger.info(f"Starting verification: {len(keys_to_verify)} keys ({KEY_1_COLUMN}: {key1_count}, {KEY_2_COLUMN}: {key2_count})")
    print(f"\n🔍 Starting verification of {len(keys_to_verify)} keys...")
    
    print(f"   - {key1_count} keys in {KEY_1_COLUMN}")
    print(f"   - {key2_count} keys in {KEY_2_COLUMN}")
    
    # Display filtering statistics
    key1_status_column = f"{KEY_1_COLUMN}_status"
    total_key1_available = df[(df[KEY_1_COLUMN].notna()) & (df[KEY_1_COLUMN] != '') & (df[key1_status_column].isna())].shape[0]
    
    total_key2_available = 0
    if CHECK_KEY_2 and KEY_2_COLUMN in df.columns:
        key2_status_column = f"{KEY_2_COLUMN}_status"
        total_key2_available = df[(df[KEY_2_COLUMN].notna()) & (df[KEY_2_COLUMN] != '') & (df[key2_status_column].isna())].shape[0]
    
    print(f"\n📊 Filtering by '{TO_CHECK_COLUMN}' column:")
    print(f"   - {key1_count}/{total_key1_available} {KEY_1_COLUMN} keys selected (to check = True)")
    print(f"   - {key2_count}/{total_key2_available} {KEY_2_COLUMN} keys selected (to check = True)")
    
    print("\n⚠️  Instructions:")
    print("1. A Chrome browser will open")
    print("2. Log in to Steamworks on the page that opens")
    print("3. Once logged in, come back here and press Enter")
    
    input("\n⏸️  Press Enter when you're ready to start...")
    
    # Initialize the driver
    driver = setup_driver()
    
    try:
        # First visit to allow manual connection
        driver.get(STEAMWORKS_URL)
        logger.info("Browser opened, waiting for Steamworks connection")
        print("\n🌐 Browser opened. Please log in to Steamworks...")
        input("⏸️  Once logged in, press Enter to continue...")
        
        checked_count = 0
        
        for index, column_name, steam_key in keys_to_verify:
            print(f"\n[{checked_count + 1}/{len(keys_to_verify)}] Checking {column_name}: {steam_key[:10]}...")
            
            # Check the key
            status = check_steam_key(driver, steam_key)
            
            # Update the DataFrame in the correct column
            status_column = f"{column_name}_status"
            df.loc[index, status_column] = status
            
            print(f"   Status: {status}")
            
            checked_count += 1
            
            # Random delay between verifications
            if checked_count < len(keys_to_verify):
                delay = random.uniform(MIN_DELAY, MAX_DELAY)
                print(f"   Waiting {delay:.1f} seconds...")
                time.sleep(delay)
    
    except KeyboardInterrupt:
        logger.warning("Verification interrupted by user")
        print("\n⏹️  Verification interrupted by user")
    
    except Exception as e:
        logger.error(f"Error during verification: {e}")
        print(f"\n❌ Error during verification: {e}")
    
    finally:
        driver.quit()
        logger.info("Browser closed")
        
        # Save results
        output_file = CSV_FILE_PATH.replace('.csv', '_with_status.csv')
        df.to_csv(output_file, index=False)
        logger.info(f"Results saved: {output_file}")
        print(f"💾 Results saved in: {output_file}")
        
        # Display summary
        print("\n📊 Status summary:")
        key1_status_column = f"{KEY_1_COLUMN}_status"
        if key1_status_column in df.columns:
            key1_counts = df[key1_status_column].value_counts()
            print(f"  {KEY_1_COLUMN}:")
            for status, count in key1_counts.items():
                if pd.notna(status):
                    print(f"    {status}: {count}")
        
        if CHECK_KEY_2:
            key2_status_column = f"{KEY_2_COLUMN}_status"
            if key2_status_column in df.columns:
                key2_counts = df[key2_status_column].value_counts()
                print(f"  {KEY_2_COLUMN}:")
                for status, count in key2_counts.items():
                    if pd.notna(status):
                        print(f"    {status}: {count}")
        
        # Global summary
        total_verified = 0
        if key1_status_column in df.columns:
            total_verified += df[key1_status_column].notna().sum()
        if CHECK_KEY_2 and key2_status_column in df.columns:
            total_verified += df[key2_status_column].notna().sum()
        logger.info(f"Verification completed - Total keys verified: {total_verified}")

if __name__ == "__main__":
    main() 