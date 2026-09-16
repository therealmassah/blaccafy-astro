FROM cloudron/base:4.0.0

WORKDIR /app/code

COPY . /app/code

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && chmod +x /app/code/start.sh

CMD ["/app/code/start.sh"]
