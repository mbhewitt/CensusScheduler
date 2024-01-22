FROM alpine:edge
RUN apk --no-cache add dnsmasq

COPY dnsmasq.conf /etc/dnsmasq.conf

EXPOSE 53 53/udp

CMD ["dnsmasq","-k"]
