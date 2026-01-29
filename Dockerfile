FROM image-registry.openshift-image-registry.svc:5000/openshift/nginx:1.20-ubi9
COPY ./dist/ /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080