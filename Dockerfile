# Runs as uid 101 and listens on 8080, as apps/landing/deployment.yaml in
# mnhafid/k3s expects. The unprivileged variant already owns its cache and pid
# paths, which is what the Proxmox build had to chown by hand.
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html app.js styles.css validate.js /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets
