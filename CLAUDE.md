# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vue API Tester - A Vue 3 based web API testing tool similar to Postman. This is a Chinese-language application that provides comprehensive API debugging capabilities with environment variable management, request history, code generation, and dark/light theme support.

## Development Commands

```bash
# Start development server (localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
# or
npm run serve
```

The application uses **Yarn 3.6.2+** as the package manager (specified in package.json).

## Core Architecture

### Tech Stack
- **Vue 3** with Composition API
- **Ant Design Vue v4** for UI components  
- **Monaco Editor** for code editing with syntax highlighting
- **Axios** for HTTP requests with custom interceptors
- **Vite** as build tool with custom proxy configuration

### Application Structure

**Layout System:**
- Three-panel layout: History sidebar (left) + Main workspace (center) + Response panel (right)
- Resizable panels with drag handles
- Collapsible history sidebar
- Top navigation header with environment/theme controls

**Core Services:**
- `httpService.js` - Main HTTP request handler with axios interceptors and environment variable processing
- `envService.js` - Environment variable management with localStorage persistence
- API services in `/src/api/` for different domains (Auth, User, Common, etc.)

**Key Components:**
- `Workspace.vue` - Main application layout and state management
- `RequestConfig.vue` - HTTP method, URL, params, headers configuration
- `ResponsePanel.vue` - Response display with syntax highlighting
- `HistoryPanel.vue` - Request history with search and reuse
- `BodyEditor.vue` - Request body editor with Monaco integration
- `EnvManager.vue` - Environment variable CRUD interface
- `CodeGenerator.vue` - Multi-language code generation (cURL, JS, Python, etc.)

### State Management

The application uses Vue 3 Composition API without a centralized state store. State is managed:
- Locally within components using `ref()` and `reactive()`
- Through localStorage for persistence (history, environment variables, theme)
- Via props/emits for parent-child communication

### HTTP Request Architecture

**Request Flow:**
1. User configures request in `RequestConfig.vue`
2. Request data flows to `Workspace.vue` main handler
3. `httpService.js` processes the configuration:
   - Applies environment variable substitution via `envUtils.js`
   - Handles authentication (Basic, Bearer, OAuth2)
   - Processes different body types (raw, form-data, urlencoded)
   - Manages request cancellation with axios cancel tokens
4. Response is processed and displayed in `ResponsePanel.vue`
5. Request is automatically saved to history

**Environment Variable Processing:**
- Variables use `{{variableName}}` syntax
- Processed in URLs, headers, auth tokens, and request bodies
- Multi-environment support with current environment selection
- Import/export functionality for environment configurations

### Data Conversion System

The `docs/api.js` file contains a comprehensive data conversion system:
- `ApiDataConverter` class provides bidirectional conversion between:
  - `apiContent` format (API debugging message structure)
  - `connectorContent` format (Connector debugging message structure)
- Includes batch processing capabilities and validation methods
- Handles complex data mapping between different parameter structures

### Development Proxy

Vite development server includes a proxy configuration for `/api/ds` requests:
```javascript
proxy: {
  '/api/ds': {
    target: 'http://192.168.201.129:20831',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/ds/, ''),
  }
}
```

### Theme System

Comprehensive dark/light theme implementation:
- Theme state managed in `App.vue` and persisted in localStorage
- Global CSS custom properties and `[data-theme="dark"]` selectors
- Ant Design theme algorithm switching
- Theme toggle available in header navigation

### Testing Infrastructure

Test files located in `/src/test/` directory include:
- Environment variable testing utilities
- Route parameter parsing tests  
- URL encoding/decoding validation
- API interaction examples

## Common Development Workflows

### Adding New API Endpoints
1. Add service methods to appropriate file in `/src/api/`
2. Follow the pattern of existing services extending `BaseApiService`
3. Use the global axios instance from `httpService.js` for consistency

### Adding New Components
1. Place in `/src/components/` directory
2. Follow existing naming conventions (PascalCase.vue)
3. Use Ant Design Vue components for UI consistency
4. Implement proper prop validation and emits declarations

### Environment Variable Integration
- Use `processEnvironmentVariables()` from `/src/utils/envUtils.js`
- Support `{{variableName}}` syntax in user inputs
- Test with different environment configurations

### Monaco Editor Integration
- Configuration handled in `/src/utils/monaco-config.js`
- Syntax highlighting for JSON, XML, HTML, and plain text
- JSON validation and auto-formatting capabilities
- Custom themes that respond to application dark/light mode

## File Organization Notes

- `/docs/` contains extensive feature documentation and implementation guides
- `/examples/` has usage examples and API integration samples  
- `/src/test/` includes testing utilities and validation tools
- Component tests should be placed in `/src/components/__tests__/`
- Utility functions in `/src/utils/` should be pure and well-tested