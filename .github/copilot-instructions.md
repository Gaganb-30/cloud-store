# Copilot Instructions for Storage Service

## Overview
This project is a storage service application that allows users to upload, manage, and download files. It consists of a frontend built with React and a backend powered by Node.js and Express. The architecture is designed to handle file uploads efficiently, manage user quotas, and provide a robust error handling mechanism.

## Architecture
- **Frontend**: Located in the `frontend` directory, it uses React for building user interfaces. Key components include:
  - `FileUploader`: Handles file uploads with drag-and-drop support.
  - `Register`: Manages user registration.

- **Backend**: Located in the `src` directory, it includes:
  - **Controllers**: Handle incoming requests and interact with services (e.g., `uploadController.js`).
  - **Models**: Define data structures and interact with the database (e.g., `Quota.js`).
  - **Services**: Contain business logic (e.g., `UploadService.js`).
  - **Middleware**: Implement request logging and error handling.

## Developer Workflows
- **Starting the Server**: Run `node src/index.js` to start the server. Ensure MongoDB and Redis are running.
- **Testing**: Use Jest for unit tests. Run `npm test` in the root directory.
- **Debugging**: Use VS Code's built-in debugger. Set breakpoints in the controller files to inspect request handling.

## Project Conventions
- **Error Handling**: Custom error classes are defined in `src/utils/errors.js`. Use these for consistent error responses.
- **Logging**: Use the `logger` utility for logging requests and errors. Middleware in `src/middleware/requestLogger.js` handles logging.

## Integration Points
- **Database**: MongoDB is used for data storage. Ensure the connection is established in `src/index.js`.
- **External Services**: Redis is used for caching and session management. Initialize in the same file as the database connection.

## Communication Patterns
- **API Endpoints**: Defined in `src/routes`. Use RESTful conventions for naming and structuring endpoints.
- **State Management**: The frontend uses React Context for managing authentication and upload states.

## Examples
- **File Upload**: The `initUpload` function in `uploadController.js` initializes an upload session, checking user permissions and validating input.
- **Quota Management**: The `Quota` model in `src/models/Quota.js` manages user storage limits and tracks usage.

## Conclusion
This document provides a high-level overview of the Storage Service architecture and workflows. For detailed implementation, refer to the respective files in the project structure.