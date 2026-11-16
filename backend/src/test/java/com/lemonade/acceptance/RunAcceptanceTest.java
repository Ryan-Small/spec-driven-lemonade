package com.lemonade.acceptance;

import static io.cucumber.junit.platform.engine.Constants.GLUE_PROPERTY_NAME;

import org.junit.platform.suite.api.ConfigurationParameter;
import org.junit.platform.suite.api.IncludeEngines;
import org.junit.platform.suite.api.SelectDirectories;
import org.junit.platform.suite.api.Suite;

/**
 * Entry point for the @api acceptance tests. The scenarios come from the locked feature files.
 * The tag filter and the report plugin are set by the acceptanceTest task in build.gradle.kts.
 */
@Suite
@IncludeEngines("cucumber")
@SelectDirectories("../spec/features")
@ConfigurationParameter(key = GLUE_PROPERTY_NAME, value = "com.lemonade.acceptance")
public class RunAcceptanceTest {
}
