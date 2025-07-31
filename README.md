# 🔑 Steam Keys Checker - Chrome Extension

**Automated Steam key verification tool via Steamworks Partner with a Chrome extension interface**

---

## ✨ Features

- **Chrome Extension**: Integration with your browser
- **Bulk CSV Processing**: Upload and process CSV files containing Steam keys
- **Automated Verification**: Check key status via https://partner.steamgames.com/querycdkey/
- **Dual Key Support**: Handle both single and dual key columns
- **Smart Filtering**: Filter keys based on specific columns to avoid unnecessary checks
- **Real-time Progress**: Live progress tracking with completion notifications
- **Local Storage**: All data stored locally in your browser - no external servers
- **Resume Capability**: Continue interrupted verifications from where you left off
- **Export Results**: Download verification results as CSV files
- **Privacy-First**: No personal data collection, no external data transmission

## 🚀 Installation

### Chrome Web Store (Coming Soon)
The extension will be available on the Chrome Web Store for easy installation.

### Manual Installation (Developer Mode)

1. **Download the extension** from [GitHub Releases](https://github.com/Micro-SAS/steam-keys-status-checker/releases)
2. **Extract the ZIP file** to a folder on your computer
3. **Open Chrome** and navigate to `chrome://extensions/`
4. **Enable "Developer mode"** (toggle in the top right)
5. **Click "Load unpacked"** and select the `chrome-extension` folder
6. **Pin the extension** to your toolbar for easy access

## 📋 Usage Guide

### 1. **Prepare Your CSV File**
Your CSV file should contain:
- ** 1 (to 2) column(s)** with Steam keys
- **Filter column**: To determine which rows to process (default: `to check`)

### 2. **Example CSV Structure**
```csv
steam_tag,key_1,key_2,to_check,date_creation,status,type,medium
Game1,XXXXX-XXXXX-XXXXX,YYYYY-YYYYY-YYYYY,true,2024-01-01,Sent,Review,Twitch
Game2,AAAAA-AAAAA-AAAAA,,true,2024-01-02,Pending,Review,YouTube
Game3,BBBBB-BBBBB-BBBBB,CCCCC-CCCCC-CCCCC,false,2024-01-03,Draft,Review,Blog
```

### 3. **Using the Extension**

1. **Click the extension icon** in your Chrome toolbar
2. **Connect to Steamworks**:
   - Click "Connect to Steamworks"
   - Log in to your Steamworks Partner account
   - Navigate to the key verification page if you are not ready on this page.
3. **Upload your CSV file** by dragging and dropping or clicking "Select File"
4. **Configure columns**:
   - Select your key columns
   - Choose your filter column
   - Set verification scope (all keys or filtered only)
5. **Start verification**:
   - Click "Check the status of X Steam Keys"
   - Monitor real-time progress (You can close the popup but do **NOT** close your Chrome browser)
   - Wait for completion notification
6. **Download results**:
   - Click "Download Results" to get your CSV with statuses

## 📊 Detected Statuses

- **"Activated"**: Key already used/activated (blue color on Steamworks)
- **"Not activated"**: Valid and available key (red color on Steamworks)
- **"Invalid"**: Invalid or expired key
- **"Error: ..."**: Verification problem (detailed message)

## 🔧 Technical Details

### Manifest V3
Built with the latest Chrome extension standards for better performance and security.

### Permissions Required
- **`storage`**: Save verification progress and results locally
- **`activeTab`**: Access Steamworks Partner pages
- **`scripting`**: Inject content scripts for key verification
- **`contextMenus`**: Right-click menu integration
- **`notifications`**: Completion notifications
- **`https://partner.steamgames.com/*`**: Access Steamworks Partner interface

### Privacy & Security
- **No external servers**: All processing happens locally
- **No data collection**: No personal information is gathered
- **Local storage only**: All data stays in your browser
- **Official API only**: Only communicates with Steamworks Partner

## 🛡️ Security Features

### Anti-Detection Measures
- **Random delays**: 1-10 seconds between verifications
- **Natural user behavior**: Mimics human interaction patterns
- **Stealth mode**: No automation signatures
- **Rate limiting**: Respects Steamworks Partner limits

### Error Handling
- **Interruptions**: Stop and resume capability
- **Progress persistence**: Results saved automatically
- **Error recovery**: Retry mechanisms for failed verifications
- **Detailed logging**: Comprehensive error reporting

## 📈 Performance

### Expected Statistics
- **~6 keys/minute** average (with security delays)
- **100 keys ≈ 15-20 minutes**
- **500 keys ≈ 1h30-2h**

### Usage Recommendations
- **Batches of 50-100 keys** maximum per session
- **Off-peak hours** to avoid site overload
- **Test first** with a few keys

## 🚨 Troubleshooting

### Common Issues

#### "Cannot connect to Steamworks"
- ✅ Ensure you're logged into Steamworks Partner
- ✅ Check if the page loads correctly
- ✅ Test the querycdkey page manually

#### "Extension not working"
- ✅ Verify the extension is enabled in Chrome
- ✅ Check if you're on the correct Steamworks page
- ✅ Refresh the page and try again

#### "CSV upload fails"
- ✅ Ensure your CSV file is properly formatted
- ✅ Check that required columns exist
- ✅ Verify file size (should be under 10MB)

### Debug Information
- Check the browser console for detailed error messages
- Extension logs are available in the popup interface
- Contact support with specific error messages

## 🎯 Version Information

**Current Version**: 1.1.0 (December 2024)

### Recent Updates
- ✅ Chrome extension with Manifest V3
- ✅ Modern popup interface
- ✅ CSV file upload and processing
- ✅ Real-time progress tracking
- ✅ Local data storage
- ✅ Resume capability
- ✅ Export functionality
- ✅ Privacy-first design

## 🔨 Development

### Prerequisites
- Chrome browser
- Steamworks Partner account
- Basic knowledge of Chrome extensions

### Development Setup
```bash
git clone https://github.com/Micro-SAS/steam-keys-status-checker.git
cd steam-keys-status-checker/chrome-extension
# Load as unpacked extension in Chrome
```

### Building for Distribution
```bash
# Create ZIP file for Chrome Web Store
zip -r steam-keys-checker.zip chrome-extension/
```

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Open [Issues](https://github.com/Micro-SAS/steam-keys-status-checker/issues) for bug reports
- Submit [Pull Requests](https://github.com/Micro-SAS/steam-keys-status-checker/pulls) for improvements
- Share enhancement suggestions

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 📞 Support

For questions or support:
- **Email**: contact@hushcrasher.com
- **GitHub**: [https://github.com/belzanne](https://github.com/belzanne)
- **Privacy Policy**: [https://micro-sas.github.io/steam-keys-status-checker/](https://micro-sas.github.io/steam-keys-status-checker/)

---

**Created by [Micro-SAS](https://github.com/Micro-SAS)** | **Steam Keys Checker v1.1.0** 