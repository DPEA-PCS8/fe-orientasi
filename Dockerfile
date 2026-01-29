FROM image-registry.openshift-image-registry.svc:5000/openshift/nginx:1.20-ubi9

# 1. Image UBI naruh HTML di /opt/app-root/src/
COPY dist/ /opt/app-root/src/

# 2. Naruh config jangan di /etc/nginx/ (karena itu di-lock), 
# tapi di lokasi yang diizinkan S2I
COPY nginx.conf /opt/app-root/etc/nginx.conf.d/default.conf

# 3. Pakai user default OpenShift (PENTING!)
USER 1001

EXPOSE 8080

# Jalankan nginx dengan flag supaya dia nggak lari ke background (biar pod nggak mati)
CMD ["nginx", "-g", "daemon off;"]