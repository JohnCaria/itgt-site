# itgovernanceturkey.com

Static pages of the ITGT Consultancy website (EN + TR). Every push to `main` is uploaded to `public_html` on Hostinger by `.github/workflows/deploy.yml`.

The upload only adds or updates files. It never deletes anything on the server, so WordPress (blog, admin, uploads) stays untouched.

Required repository secrets: `FTP_USER`, `FTP_PASSWORD` (hPanel → Files → FTP Accounts).
