# Smart Leads - Deployment Guide

## 📦 **Distribution Options for Kansas City Royals**

### Option 1: Download Pre-built Releases (Recommended)

1. **Go to GitHub Releases**: https://github.com/lanemc/smart-leads-electron/releases
2. **Download for your platform**:
   - **Windows**: `Smart-Leads-Setup-x.x.x.exe` (installer)
   - **macOS**: `Smart-Leads-x.x.x.dmg` (disk image)
   - **Linux**: `Smart-Leads-x.x.x.AppImage` (portable app)

3. **Install and Run**:
   - **Windows**: Run the `.exe` installer, follow setup wizard
   - **macOS**: Open `.dmg`, drag app to Applications folder
   - **Linux**: Make AppImage executable: `chmod +x Smart-Leads-*.AppImage` then run

### Option 2: Build from Source

```bash
# Clone the repository
git clone https://github.com/lanemc/smart-leads-electron.git
cd smart-leads-electron

# Install dependencies
npm install

# Build the application
npm run build

# Create distributable packages
npm run package        # All platforms
npm run package:win    # Windows only
npm run package:mac    # macOS only  
npm run package:linux  # Linux only
```

Built packages will be in the `release/` folder.

## 🚀 **Automated Building**

The repository includes GitHub Actions that automatically:

- ✅ **Run tests** on every push
- ✅ **Build for all platforms** (Windows, macOS, Linux)
- ✅ **Create releases** when you push a version tag
- ✅ **Upload distributables** to GitHub Releases

### Creating a New Release

```bash
# Tag a new version
git tag v1.0.1
git push origin v1.0.1

# GitHub Actions will automatically:
# 1. Build for all platforms
# 2. Run tests
# 3. Create a GitHub release
# 4. Upload all distributables
```

## 📋 **First-Time Setup for Users**

1. **Download and install** the app for your platform
2. **Launch the application**
3. **Configure OpenAI API Key**:
   - Click the Settings (⚙️) icon
   - Enter your OpenAI API key
   - Adjust processing settings if needed
   - Click Save

4. **Ready to use**!

## 🔒 **Security Notes**

- **API Keys**: Stored securely using Electron's encrypted storage
- **Code Signing**: For production deployment, set up code signing certificates
- **Auto-Updates**: Framework included, can be configured for automatic updates

## 🛠 **Production Deployment Checklist**

### For Internal Distribution
- [ ] Build and test on target platforms
- [ ] Verify OpenAI API integration works
- [ ] Test CSV import/export functionality
- [ ] Create user documentation
- [ ] Set up internal distribution method

### For External Distribution (if needed)
- [ ] Set up code signing certificates
  - **Windows**: Authenticode certificate
  - **macOS**: Apple Developer certificate
- [ ] Configure auto-updater endpoint
- [ ] Set up crash reporting (optional)
- [ ] Create installer with organization branding

## 📊 **System Requirements**

### Minimum Requirements
- **OS**: Windows 10+, macOS 10.15+, Ubuntu 18+
- **RAM**: 4GB (8GB recommended)
- **Storage**: 500MB available space
- **Network**: Internet connection for AI processing

### Recommended Specifications
- **RAM**: 8GB+ for large CSV files
- **CPU**: Multi-core processor for concurrent processing
- **Storage**: SSD for better performance

## 🔧 **Configuration Files**

The app creates configuration files in:
- **Windows**: `%USERPROFILE%\.smart-leads\`
- **macOS/Linux**: `~/.smart-leads/`

Files created:
- `config.json` - Application settings (non-sensitive)
- `config.encrypted` - Encrypted sensitive data (API keys)

## 📞 **Support Information**

- **Repository**: https://github.com/lanemc/smart-leads-electron
- **Issues**: https://github.com/lanemc/smart-leads-electron/issues
- **Documentation**: README.md in the repository

## 🎯 **Quick Start for Royals Team**

1. **Download**: Get the latest release from GitHub
2. **Install**: Run the installer for your platform
3. **Configure**: Add your OpenAI API key in settings
4. **Import**: Drag and drop a CSV file with leads
5. **Process**: Click "Process Leads" and monitor progress
6. **Export**: Filter results and export qualified leads

The application is production-ready and follows security best practices for handling sensitive API keys and lead data.