FROM node:12.16.1-alpine3.11
WORKDIR /root
ENV HOME /root
ENV PATH ./node_modules/.bin:/root/node_modules/.bin:$PATH
RUN apk add --update --no-cache bash curl g++ gcc git jq make openssl
RUN curl https://raw.githubusercontent.com/vishnubob/wait-for-it/ed77b63706ea721766a62ff22d3a251d8b4a6a30/wait-for-it.sh > /bin/wait-for && chmod +x /bin/wait-for
RUN npm config set unsafe-perm true && npm install -g npm@6.14.11
RUN npm install -g lerna@3.22.1
RUN apk add --update --no-cache python py-pip
RUN pip install --upgrade pip fdfgen
RUN apk add --no-cache --repository="http://dl-cdn.alpinelinux.org/alpine/v3.8/main" --repository="http://dl-cdn.alpinelinux.org/alpine/v3.8/community" pdftk

COPY test.sh /test.sh
COPY entry.sh /entry.sh

ENTRYPOINT ["bash", "/entry.sh"]
