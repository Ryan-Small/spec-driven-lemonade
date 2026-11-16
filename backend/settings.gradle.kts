plugins {
    // Lets the Java toolchain download the JDK it asks for (Amazon Corretto 21).
    id("org.gradle.toolchains.foojay-resolver-convention") version "1.0.0"
}

rootProject.name = "lemonade-backend"
