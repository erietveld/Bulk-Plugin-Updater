# Batch Plugin Updater

Original idea, remote table design and Subflow from: https://www.servicenow.com/community/admin-experience-blogs/creating-a-batch-installer-for-store-updates/ba-p/3038560
A modern ServiceNow application for managing and deploying plugin updates in batch operations with an intuitive dashboard interface.

## 🚀 Overview

The Batch Plugin Updater is a comprehensive ServiceNow application designed to streamline the process of managing store plugin updates. It provides administrators with a centralized dashboard to view, select, and deploy multiple plugin updates efficiently, reducing manual effort and ensuring consistent deployment practices.

### Key Features

- **Batch Processing**: Select and process multiple plugin updates simultaneously
- **Interactive Dashboard**: Modern React-based interface with real-time updates
- **Progress Tracking**: Monitor installation progress with detailed status information
- **Theme Support**: Multiple UI themes including ServiceNow, Polaris, and custom themes
- **Responsive Design**: Optimized for both desktop and mobile interfaces
- **REST API Integration**: Robust backend services for update management

## 🛠️ Technology Stack

### Frontend
- **React 19** - Modern JavaScript library for building user interfaces
- **TypeScript** - Type-safe development
- **Mantine UI** - Rich component library with theming support
- **Zustand** - Lightweight state management
- **TanStack Query** - Server state synchronization
- **ServiceNow SDK** - Build tool and development environment for ServiceNow applications

### Backend
- **ServiceNow Fluent** - Domain-specific language for metadata definition
- **Scripted REST APIs** - Custom API endpoints for update operations
- **Business Rules** - Server-side logic for data processing
- **Script Includes** - Reusable server-side code modules

### Infrastructure
- **ServiceNow Platform** - Cloud-native application platform
- **Git Integration** - Version control and deployment pipeline
- **ServiceNow IDE** - Development environment integration

## 📋 Prerequisites

- ServiceNow instance (Zurich or later)
- ServiceNow IDE access
- Git repository access with appropriate permissions
- Build Agent access

## 🔧 Installation Instructions

### Step 1: Repository Setup

1. **Fork the Repository**
   - On GitHub, fork this repository to your account

2. **Setup Access Credentials**
   - Create a personal access token in GitHub
   - Configure repository access permissions

### Step 2: ServiceNow IDE Configuration

1. **Create New Workspace**
   - Open ServiceNow IDE
   - Create a new workspace for the application

2. **Clone Repository**
   - In the IDE, on the right, select "Clone Git repository"
   - Enter your forked repository URL
   - Provide credentials when prompted

3. **Install Dependencies with Build and Install**
[Info] Warning messages can be ignored these come from some modules
   - The system will automatically detect package.json
   - Click the Build and Install button on the button right of the IDE


## 🎯 Usage

### Accessing the Application

1. Navigate to your ServiceNow instance
2. In the Application Navigator, look for "Batch Plugin Updater" in the application menu
3. Click on "Store Updates Dashboard" to open the main dashboard interface

### Managing Updates

1. **View Available Updates**: Browse the list of available plugin updates
2. **Select Updates**: Use checkboxes to select multiple updates for batch processing
3. **Review Selection**: Verify selected updates in the overlay panel
4. **Execute Installation**: Click "Install Selected" to begin batch processing
5. **Monitor Progress**: Track installation progress in real-time

## 🎨 Customization

### Themes
**Active Themes:**
- **Corporate Blue** - Professional corporate theme with blue accent colors
- **Vercel Modern** - Modern minimalist theme inspired by Vercel design system  
- **Cosmic Night** - Cosmic-inspired theme with purple accents and starry aesthetics
All themes support both light and dark color schemes and automatically detect system preferences.


### Potential Future Improvements
- Installation options for Available, but not installed, plugins
- Migrate installation to the Application Manager API
- Repair option for plugins
- Maintain a Favorites set, plugins you want always to be updates
- Schedukle function
- ...


### Project Structure

```
src/
├── fluent/                   # ServiceNow metadata definitions
│   ├── tables/               # Table definitions
│   ├── ui-pages/             # UI Page components
│   └── scripted-rest-apis/   # REST API endpoints
├── client/                   # React frontend application
├── components/               # Reusable UI components
├── hooks/                    # Custom React hooks
├── services/                 # API service layer
├── state/                    # State management
└── theme/                    # Theme configurations
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly in ServiceNow environment
5. Submit a pull request with detailed description

## 📄 License

This project is developed for internal ServiceNow usage. Please refer to your organization's guidelines for usage and distribution.

## 🎉 Get Started

Ready to streamline your plugin update process? Follow the installation instructions above and start managing your ServiceNow plugins more efficiently!

---

**Note**: This is an internal ServiceNow application. Ensure you have proper permissions and follow your organization's deployment guidelines.