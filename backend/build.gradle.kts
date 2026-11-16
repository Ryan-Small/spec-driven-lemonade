plugins {
    java
    id("org.springframework.boot") version "4.1.2"
    id("io.spring.dependency-management") version "1.1.7"
    id("org.springdoc.openapi-gradle-plugin") version "2.1.0"
    id("info.solidsoft.pitest") version "1.19.0"
}

group = "com.lemonade"
version = "0.1.0"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
        vendor = JvmVendorSpec.AMAZON
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-api:3.2.0")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation(platform("io.cucumber:cucumber-bom:8.1.0"))
    testImplementation("io.cucumber:cucumber-java")
    testImplementation("io.cucumber:cucumber-spring")
    testImplementation("io.cucumber:cucumber-junit-platform-engine")
    testImplementation("org.junit.platform:junit-platform-suite")
    testImplementation("io.rest-assured:rest-assured:6.3.0")
    testImplementation("net.jqwik:jqwik:1.10.2")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

// Requirements that are not implemented yet. Their scenarios are left out of the acceptance run.
val pendingFile = file("../tools/trace-check/pending-requirements.txt")
val pendingRequirements = pendingFile.readLines().map { it.trim() }.filter { it.startsWith("REQ-") }
val apiTagFilter = "@api" +
    if (pendingRequirements.isEmpty()) "" else " and not (" + pendingRequirements.joinToString(" or ") { "@$it" } + ")"

// Fast tier: unit and property tests. These belong to the implementation.
tasks.test {
    useJUnitPlatform {
        excludeEngines("junit-platform-suite", "cucumber")
    }
    exclude("com/lemonade/acceptance/**")
}

// Spec tier: the @api scenarios from the locked feature files.
val acceptanceTest by tasks.registering(Test::class) {
    description = "Runs the @api scenarios in spec/features against the running application."
    group = "verification"
    testClassesDirs = sourceSets.test.get().output.classesDirs
    classpath = sourceSets.test.get().runtimeClasspath
    useJUnitPlatform {
        includeEngines("junit-platform-suite")
    }
    include("com/lemonade/acceptance/RunAcceptanceTest.class")
    systemProperty("cucumber.filter.tags", apiTagFilter)
    systemProperty("cucumber.plugin", "pretty, message:../reports/cucumber-api.ndjson")
    inputs.dir("../spec/features")
    inputs.file(pendingFile)
    outputs.upToDateWhen { false }
    testLogging {
        showStandardStreams = true
    }
}

// Writes the OpenAPI document of the running application to build/openapi/openapi.yaml.
openApi {
    apiDocsUrl = "http://localhost:8080/v3/api-docs.yaml"
    outputDir = layout.buildDirectory.dir("openapi")
    outputFileName = "openapi.yaml"
}

// Mutation tests: game rules and orchestration only, judged by the fast tier.
pitest {
    pitestVersion = "1.30.2"
    junit5PluginVersion = "1.2.3"
    // CI passes -PpitTargetClasses=<classes of the changed files>. The default is everything.
    targetClasses = (findProperty("pitTargetClasses") as String?)?.split(",")?.toSet()
        ?: setOf("com.lemonade.domain.*", "com.lemonade.service.*")
    targetTests = setOf("com.lemonade.domain.*", "com.lemonade.service.*")
    outputFormats = setOf("HTML", "XML")
    timestampedReports = false
    mutationThreshold = 80
    failWhenNoMutations = false
}
