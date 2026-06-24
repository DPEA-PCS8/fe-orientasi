# FE SSO Refactor Progress

T11 done - vite https + port 5174 (via @vitejs/plugin-basic-ssl; verified dev serves https://localhost:5174)
T12 done - LoginPage SSO button + SsoCallback component (handles error param) + /signin-oidc route in App.tsx
T13 done - removed RSA helpers + login() from authApi.ts; deleted useLoginForm.ts; removed unused LoginCredentials type
