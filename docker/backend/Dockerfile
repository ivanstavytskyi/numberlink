FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

COPY gradlew .
COPY gradle gradle
COPY build.gradle* settings.gradle* ./
RUN chmod +x ./gradlew
RUN ./gradlew dependencies --no-daemon || true
COPY . .
RUN chmod +x ./gradlew
RUN ./gradlew build --no-daemon -x test

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
ARG OTEL_JAVA_AGENT_VERSION=2.31.1
RUN apk add --no-cache wget \
    && mkdir -p /otel \
    && wget -q -O /otel/opentelemetry-javaagent.jar \
      "https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v${OTEL_JAVA_AGENT_VERSION}/opentelemetry-javaagent.jar"
COPY --from=build /app/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
