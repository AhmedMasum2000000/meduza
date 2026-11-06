FROM node:20-alpine
WORKDIR /app
COPY server.mjs .
RUN mkdir -p /data && chown node:node /data
USER node
ENV DATA_DIR=/data PORT=8787
EXPOSE 8787
CMD ["node", "server.mjs"]
