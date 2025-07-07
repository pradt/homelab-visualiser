# Changelog

All notable changes to the homelab-visualiser project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Console logging with timestamps for all API routes
  - GET /api/containers - logs when retrieving containers data
  - GET /api/icons/fontawesome - logs when serving FontAwesome icons
  - GET /api/icons/material - logs when serving Material Design icons
  - GET /api/icons/emoji - logs when serving emoji icons
  - GET /api/icons/simpleicons - logs when serving Simple Icons
  - GET /api/icons/homelab - logs when serving Homelab icons
  - POST /api/containers - logs when saving containers data
  - Server startup - logs when server starts listening

### Changed
- Enhanced server startup logging to include timestamp

## [1.0.0] - Initial Release

### Added
- Express.js backend server with RESTful API endpoints
- Frontend interface for homelab visualization
- Support for multiple icon libraries:
  - FontAwesome icons
  - Material Design icons
  - Emoji icons
  - Simple Icons
  - Homelab-specific icons
- Container data persistence using JSON file storage
- Docker support with Dockerfile and docker-compose.yml
- Static file serving for frontend assets
- API endpoints for retrieving and saving container configurations

### Technical Details
- Node.js backend with Express framework
- File-based storage system for container data
- RESTful API design
- Docker containerization support
- Cross-platform compatibility 