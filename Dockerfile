FROM image-registry.openshift-image-registry.svc:5000/openshift/nginx:1.20-ubi9
COPY ./dist/ /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# OpenShift compatibility:
# 1. Support running as arbitrary user (random UID) in root group (GID 0)
# 2. Grant group write permissions to necessary directories
RUN chmod -R g+rwx /var/cache/nginx /var/run /var/log/nginx && \
    chgrp -R 0 /var/cache/nginx /var/run /var/log/nginx && \
    sed -i.bak 's/^user/#user/' /etc/nginx/nginx.conf

EXPOSE 8080