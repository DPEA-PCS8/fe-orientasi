# API Directory

Place all API integration logic here.

## Rules
- **Library**: Use `axios` or `fetch`.
- **Error Handling**: Always handle promise rejections (`try-catch` or `.catch()`).
- **Endpoints**: Check `src/api/endpoints.js` (or create it) for URL constants.
- **Naming**: Functions should be `camelCase`.
- **Security**: No hardcoded secrets. Use environment variables.
