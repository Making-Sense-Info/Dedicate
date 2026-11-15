# syntax=docker/dockerfile:1
# Build from repository root:
#   docker build -f dedicator/Dockerfile -t dedicator .

FROM node:22-bookworm AS web-build
WORKDIR /web
COPY dedicator/web/package.json dedicator/web/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY dedicator/web/ ./
RUN yarn build

FROM eclipse-temurin:17-jre-jammy AS runtime
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip python3-venv curl unzip ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY ddi-l-to-healthdcat-ap /app/ddi-l-to-healthdcat-ap
COPY dedicator/api /app/dedicator/api
COPY --from=web-build /web/dist /app/dedicator/web/dist

RUN chmod +x /app/dedicator/api/invoke.sh /app/ddi-l-to-healthdcat-ap/run.sh \
  && python3 -m venv /opt/venv \
  && /opt/venv/bin/pip install --no-cache-dir -r /app/dedicator/api/requirements.txt

ENV SHACL_JAR=/opt/jars/shacl-play-app-0.12.5-onejar.jar
ENV SHACL_SHAPES=https://data.health.europa.eu/healthdcat-ap/releases/release-8/html/shacl/HealthDCAT-AP_validator/config/rdf-validator/ehds/shapes/non-public-shapes.ttl
RUN mkdir -p /opt/jars \
  && curl -fsSL -L -o "$SHACL_JAR" \
    https://github.com/sparna-git/shacl-play/releases/download/0.12.5/shacl-play-app-0.12.5-onejar.jar \
  && printf '%s\n' '<root/>' > /tmp/warm.xml \
  && bash /app/dedicator/api/invoke.sh \
       --input /tmp/warm.xml \
       --output /tmp/warm.ttl \
       --xsl /app/ddi-l-to-healthdcat-ap/xsl/ddi-lifecycle-to-dcat-ap.xsl \
    || true \
  && rm -f /tmp/warm.xml /tmp/warm.ttl \
  && test -f /app/ddi-l-to-healthdcat-ap/lib/saxon-he-12.5.jar

ENV PATH="/opt/venv/bin:$PATH"
ENV DEDICATOR_CORS="*"
EXPOSE 8080
WORKDIR /app/dedicator/api
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
