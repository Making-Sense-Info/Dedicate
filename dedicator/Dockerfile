# syntax=docker/dockerfile:1
# Build from repository root:
#   docker build -f dedicator/Dockerfile -t dedicator .
# CI can skip the Node stage with:
#   --build-arg WEB_MODE=compiled   (expects dedicator/web/dist already built)

ARG WEB_MODE=build

FROM node:22-bookworm AS web-build
WORKDIR /web
COPY dedicator/web/package.json dedicator/web/yarn.lock ./
RUN --mount=type=cache,target=/root/.cache/yarn \
    yarn install --frozen-lockfile
COPY dedicator/web/ ./
RUN yarn build \
  && mkdir -p /out \
  && cp -a /web/dist /out/dist

FROM busybox:1.36 AS web-compiled
COPY dedicator/web/dist /out/dist

FROM web-${WEB_MODE} AS web-final

FROM eclipse-temurin:17-jre-jammy AS runtime
# unzip required: Saxon HE ships as a zip (ensure_saxon / invoke.sh)
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip python3-venv curl unzip ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python deps early (stable layer)
COPY dedicator/api/requirements.txt /tmp/requirements.txt
RUN python3 -m venv /opt/venv \
  && /opt/venv/bin/pip install --no-cache-dir -r /tmp/requirements.txt \
  && rm /tmp/requirements.txt

# Sparna jar: prefer context copy (CI cache / local jars/), else download once
ENV SHACL_JAR=/opt/jars/shacl-play-app-0.12.5-onejar.jar
COPY dedicator/jars/ /tmp/jars/
RUN mkdir -p /opt/jars \
  && if [ -f /tmp/jars/shacl-play-app-0.12.5-onejar.jar ]; then \
       cp /tmp/jars/shacl-play-app-0.12.5-onejar.jar "$SHACL_JAR"; \
     else \
       curl -fsSL -L -o "$SHACL_JAR" \
         https://github.com/sparna-git/shacl-play/releases/download/0.12.5/shacl-play-app-0.12.5-onejar.jar; \
     fi \
  && rm -rf /tmp/jars \
  && test -f "$SHACL_JAR"

COPY ddi-l-to-healthdcat-ap /app/ddi-l-to-healthdcat-ap
COPY dedicator/api /app/dedicator/api
COPY --from=web-final /out/dist /app/dedicator/web/dist

ENV SHACL_SHAPES=https://data.health.europa.eu/healthdcat-ap/releases/release-8/html/shacl/HealthDCAT-AP_validator/config/rdf-validator/ehds/shapes/non-public-shapes.ttl
ENV SAXON_URL=https://github.com/Saxonica/Saxon-HE/releases/download/SaxonHE12-5/SaxonHE12-5J.zip

# lib/*.jar is gitignored — download Saxon into the image (needs unzip)
RUN chmod +x /app/dedicator/api/invoke.sh /app/ddi-l-to-healthdcat-ap/run.sh \
  && mkdir -p /app/ddi-l-to-healthdcat-ap/lib \
  && tmp="$(mktemp -d)" \
  && curl -fsSL -o "$tmp/saxon.zip" "$SAXON_URL" \
  && unzip -qo "$tmp/saxon.zip" \
       "saxon-he-12.5.jar" \
       "lib/xmlresolver-5.2.2.jar" \
       "lib/xmlresolver-5.2.2-data.jar" \
       -d "$tmp" \
  && mv "$tmp/saxon-he-12.5.jar" /app/ddi-l-to-healthdcat-ap/lib/ \
  && mv "$tmp/lib/xmlresolver-5.2.2.jar" /app/ddi-l-to-healthdcat-ap/lib/ \
  && mv "$tmp/lib/xmlresolver-5.2.2-data.jar" /app/ddi-l-to-healthdcat-ap/lib/ \
  && rm -rf "$tmp" \
  && test -f /app/ddi-l-to-healthdcat-ap/lib/saxon-he-12.5.jar \
  && test -f /app/ddi-l-to-healthdcat-ap/lib/xmlresolver-5.2.2.jar

ENV PATH="/opt/venv/bin:$PATH"
ENV DEDICATOR_CORS="*"
EXPOSE 8080
WORKDIR /app/dedicator/api
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
