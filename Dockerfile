FROM image-registry.openshift-image-registry.svc:5000/openshift/nginx:1.20-ubi9

# 1. Copy file hasil build react
COPY dist/ /opt/app-root/src/

# 2. Lokasi ini HARUS EXACT biar di-include sama nginx.conf bawaan UBI
# Folder aslinya adalah /opt/app-root/etc/nginx.d/
COPY nginx.conf /opt/app-root/etc/nginx.d/default.conf

USER 1001
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]